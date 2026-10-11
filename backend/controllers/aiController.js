const requestAI = async (prompt) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-3.5-flash";

  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    try {
      const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 180,
        },
      }),
      signal: controller.signal,
    },
      );

      if (!response.ok) {
        const errorBody = await response.text();
        if ((response.status === 429 || response.status >= 500) && attempt === 0) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          continue;
        }
        const error = new Error(`Gemini request failed: ${errorBody}`);
        error.status = response.status;
        throw error;
      }

      const data = await response.json();
      return (
        data.candidates?.[0]?.content?.parts?.map((part) => part.text).join("") ||
        "No response generated"
      );
    } catch (error) {
      if (error.name === "AbortError") {
        const timeoutError = new Error("AI request timed out. Please try again.");
        timeoutError.status = 504;
        throw timeoutError;
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
};

const sendAIError = (res, error) => {
  const status = error.status === 401 || error.status === 403
    ? 502
    : error.status === 429
      ? 429
      : error.status === 504
        ? 504
        : 503;
  return res.status(status).json({ message: error.message });
};

const createLocalSummary = (messages) => {
  const recentMessages = messages
    .map((item) => item.message?.trim())
    .filter(Boolean)
    .slice(-5);

  if (!recentMessages.length) return "No text messages to summarize";

  return [
    "Recent conversation highlights:",
    ...recentMessages.map((message) => `- ${message.slice(0, 160)}`),
  ].join("\n");
};

exports.summarize = async (req, res) => {
  try {
    const messages = Array.isArray(req.body.messages) ? req.body.messages.slice(-15) : [];
    const transcript = messages.map((item) => item.message).filter(Boolean).join("\n");
    if (!transcript) return res.status(400).json({ message: "No text messages to summarize" });
    try {
      const summary = await requestAI(`Summarize this private chat in concise bullet points:\n${transcript}`);
      return res.json({ result: summary });
    } catch (error) {
      if (error.status === 429 || error.status === 500 || error.status === 502 || error.status === 503 || error.status === 504) {
        return res.json({
          result: createLocalSummary(messages),
          fallback: true,
        });
      }
      throw error;
    }
  } catch (error) {
    return sendAIError(res, error);
  }
};

exports.translate = async (req, res) => {
  try {
    const { text, language } = req.body;
    if (!text || !language) return res.status(400).json({ message: "Text and language are required" });
    const result = await requestAI(`Translate this message to ${language}. Return only the translation:\n${text}`);
    return res.json({ result });
  } catch (error) {
    return sendAIError(res, error);
  }
};