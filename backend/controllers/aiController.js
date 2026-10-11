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
        contents: [{
          role: "user",
          parts: [{
            text: attempt === 0
              ? prompt
              : `${prompt}\n\nYour previous response was incomplete. Return a complete, useful summary with multiple sections and enough detail to cover the conversation.`,
          }],
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: attempt === 0 ? 8192 : 16384,
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
      const candidate = data.candidates?.[0];
      const result = candidate?.content?.parts
        ?.map((part) => part.text || "")
        .join("")
        .trim();
      const incomplete =
        !result ||
        result.length < 40 ||
        (candidate.finishReason && candidate.finishReason !== "STOP");

      if (incomplete) {
        if (attempt === 0) continue;
        const error = new Error(
          `Gemini returned an incomplete summary${candidate?.finishReason ? ` (${candidate.finishReason})` : ""}`,
        );
        error.status = 502;
        throw error;
      }

      return result;
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
  if (error.status === 429) {
    return res.status(429).json({
      code: "RATE_LIMITED",
      message: "Gemini API rate limit reached. Please try again later.",
    });
  }

  const status = error.status === 401 || error.status === 403
    ? 502
    : error.status === 504
      ? 504
      : 503;
  return res.status(status).json({ message: error.message });
};

const MAX_SUMMARY_INPUT_CHARS = 3_000_000;

const prepareSummaryMessages = (messages) => {
  const textMessages = messages
    .map((item) => ({
      sender: typeof item.sender === "string" ? item.sender : "Participant",
      message: typeof item.message === "string" ? item.message.trim() : "",
    }))
    .filter((item) => item.message);

  const includedMessages = [];
  let includedCharacters = 0;
  let partiallyIncluded = false;

  for (let index = textMessages.length - 1; index >= 0; index -= 1) {
    const item = textMessages[index];
    const line = `${item.sender}: ${item.message}`;
    const separatorLength = includedMessages.length ? 1 : 0;
    const availableCharacters =
      MAX_SUMMARY_INPUT_CHARS - includedCharacters - separatorLength;

    if (line.length <= availableCharacters) {
      includedMessages.push(line);
      includedCharacters += line.length + separatorLength;
      continue;
    }

    if (!includedMessages.length && availableCharacters > item.sender.length + 2) {
      includedMessages.push(
        `${item.sender}: ${item.message.slice(-(availableCharacters - item.sender.length - 2))}`,
      );
      partiallyIncluded = true;
    }
    break;
  }

  const omittedMessages = textMessages.length - includedMessages.length;
  return {
    transcript: includedMessages.reverse().join("\n"),
    totalMessages: textMessages.length,
    includedMessages: includedMessages.length,
    truncated: omittedMessages > 0 || partiallyIncluded,
  };
};

exports.summarize = async (req, res) => {
  try {
    const messages = Array.isArray(req.body.messages) ? req.body.messages : [];
    const summaryInput = prepareSummaryMessages(messages);
    const { transcript } = summaryInput;
    if (!transcript) return res.status(400).json({ message: "No text messages to summarize" });
    try {
      const summary = await requestAI(
        `Write a detailed, comprehensive summary of the entire conversation below. Do not make it brief. Organize the response into sections for the main topics and their important details, decisions and reasons, questions and answers, and unresolved issues or next steps. Preserve names, dates, numbers, and meaningful context. Cover earlier as well as recent messages, merge repetition, and do not invent information.\n\n${transcript}`,
      );
      return res.json({ result: summary, ...summaryInput });
    } catch (error) {
      if (error.status === 429) {
        return res.status(429).json({
          code: "RATE_LIMITED",
          message: "Gemini API rate limit reached. Please try again later.",
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