import { useRef, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { createPortal } from "react-dom";
import { setMessages } from "../redux/messageSlice";
import API_BASE_URL from "../config";

const translationLanguages = [
  "Spanish",
  "French",
  "German",
  "Hindi",
  "Arabic",
  "Japanese",
];

const formatMessageTime = (createdAt) => {
  if (!createdAt) return "";
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};

const normalizeId = (value) => {
  const id =
    value && typeof value === "object"
      ? (value._id ?? value.id ?? value.$oid)
      : value;
  return String(id ?? "").toLowerCase();
};

const Message = ({ message, authUser }) => {
  const scroll = useRef();
  const optionsButton = useRef();
  const dispatch = useDispatch();
  const { messages } = useSelector((store) => store.message);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(message?.message || "");
  const [selectedReaction, setSelectedReaction] = useState(null);
  const [translationLanguage, setTranslationLanguage] = useState("Spanish");
  const [translatedText, setTranslatedText] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const messageSenderId = normalizeId(message?.senderId);
  const authUserId = normalizeId(
    authUser?._id ?? authUser?.id ?? authUser?.userId,
  );
  const isSentByCurrentUser =
    Boolean(messageSenderId) && messageSenderId === authUserId;

  useEffect(() => {
    scroll.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [message]);

  const toggleReaction = async (emoji) => {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/api/v1/message/${message._id}/reaction`,
        { emoji },
        { withCredentials: true },
      );
      const updatedReaction = response.data.message.reactions?.find(
        (reaction) => reaction.emoji === emoji,
      );
      const currentUserReacted = updatedReaction?.users?.some(
        (userId) => String(userId) === String(authUser?._id),
      );
      setSelectedReaction(currentUserReacted ? emoji : null);
      dispatch(
        setMessages(
          messages.map((item) =>
            item._id === message._id ? response.data.message : item,
          ),
        ),
      );
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update reaction");
    }
  };

  const translateMessage = async () => {
    setIsTranslating(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/ai/translate`,
        { text: message.message, language: translationLanguage },
        { withCredentials: true },
      );
      setTranslatedText(response.data.result);
    } catch (error) {
      toast.error(error.response?.data?.message || "Translation unavailable");
    } finally {
      setIsTranslating(false);
    }
  };

  const editMessage = async () => {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/api/v1/message/${message._id}`,
        { message: editedText },
        { withCredentials: true },
      );
      dispatch(
        setMessages(
          messages.map((item) =>
            item._id === message._id ? response.data.message : item,
          ),
        ),
      );
      setIsEditing(false);
      setShowMenu(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to edit message");
    }
  };

  const removeMessageLocally = () => {
    dispatch(setMessages(messages.filter((item) => item._id !== message._id)));
    setShowMenu(false);
  };

  const deleteMessageForMe = async () => {
    try {
      await axios.delete(
        `${API_BASE_URL}/api/v1/message/${message._id}/for-me`,
        { withCredentials: true },
      );
      removeMessageLocally();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to delete message");
    }
  };

  const deleteMessageForEveryone = async () => {
    try {
      await axios.delete(
        `${API_BASE_URL}/api/v1/message/${message._id}/for-everyone`,
        { withCredentials: true },
      );
      removeMessageLocally();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to delete message");
    }
  };

  const toggleMenu = () => {
    if (showMenu) {
      setShowMenu(false);
      return;
    }

    const buttonRect = optionsButton.current?.getBoundingClientRect();
    if (!buttonRect) return;

    const menuWidth = 240;
    const menuHeight = 260;
    const left = Math.max(
      8,
      Math.min(buttonRect.right - menuWidth, window.innerWidth - menuWidth - 8),
    );
    const belowTop = buttonRect.bottom + 8;
    const top =
      belowTop + menuHeight <= window.innerHeight - 8
        ? belowTop
        : Math.max(8, buttonRect.top - menuHeight - 8);

    setMenuPosition({ x: left, y: top });
    setShowMenu(true);
  };

  return (
    <div ref={scroll} className="w-full">
      <div
        className={`flex mb-3 ${isSentByCurrentUser ? "justify-end" : "justify-start"}`}
      >
        <div
          className={`relative max-w-[80%] sm:max-w-[70%] px-4 py-2.5 shadow-lg border border-white/10 ${isSentByCurrentUser ? "bg-indigo-500/90 rounded-2xl rounded-tr-sm" : "bg-slate-800/80 rounded-2xl rounded-tl-sm"}`}
        >
          {selectedReaction && (
            <div className="absolute -top-3 right-2 z-10 flex gap-1 rounded-full border border-white/10 bg-slate-950/95 px-1.5 py-0.5 text-xs shadow-lg">
              <span title="Your reaction">{selectedReaction}</span>
            </div>
          )}
          {isEditing ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                editMessage();
              }}
              className="flex gap-2"
            >
              <input
                value={editedText}
                onChange={(event) => setEditedText(event.target.value)}
                className="min-w-0 rounded bg-slate-900 px-2 py-1 text-sm text-white"
                autoFocus
              />
              <button type="submit" className="text-xs text-white">
                Save
              </button>
            </form>
          ) : message?.message ? (
            <p className="text-sm text-slate-100 wrap-break-word">
              {message?.message}
              {message?.edited && (
                <span className="ml-2 text-xs text-slate-300">(edited)</span>
              )}
            </p>
          ) : null}
          {translatedText && (
            <p className="mt-2 border-t border-white/15 pt-2 text-sm text-indigo-100 wrap-break-word">
              <span className="mr-1 text-xs font-semibold uppercase text-indigo-300">
                {translationLanguage}
              </span>
              {translatedText}
            </p>
          )}
          {message?.attachment?.url &&
            (message.attachment.type?.startsWith("image/") ? (
              <a
                href={message.attachment.url}
                download={message.attachment.name || true}
                target="_blank"
                rel="noreferrer"
                className="mt-2 block overflow-hidden rounded-lg"
              >
                <img
                  src={message.attachment.url}
                  alt={message.attachment.name || "Shared photo"}
                  className="max-h-72 max-w-full object-contain"
                />
              </a>
            ) : message.attachment.type?.startsWith("video/") ? (
              <video
                src={message.attachment.url}
                controls
                className="mt-2 max-h-72 max-w-full rounded-lg"
              />
            ) : message.attachment.type?.startsWith("audio/") ? (
              <audio
                src={message.attachment.url}
                controls
                className="mt-2 max-w-full"
              />
            ) : (
              <a
                href={`${API_BASE_URL}/api/v1/message/download/${message._id}`}
                className="mt-2 block text-xs text-indigo-200 underline"
              >
                {message.attachment.name || "Open attachment"}
              </a>
            ))}
          <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-slate-300/70">
            <span>{formatMessageTime(message?.createdAt)}</span>
            <button
              ref={optionsButton}
              type="button"
              onClick={toggleMenu}
              className="rounded px-2 py-1 text-[11px] font-medium text-slate-200 hover:bg-white/10 hover:text-white"
              aria-label="Message options"
              title="Message options"
              aria-expanded={showMenu}
            >
              Options
            </button>
          </div>
          {showMenu &&
            createPortal(
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-[9998] cursor-default"
                  onClick={() => setShowMenu(false)}
                  aria-label="Close message options"
                />
                <div
                  className="fixed z-[9999] max-h-[min(70vh,320px)] w-60 overflow-y-auto rounded-lg border border-white/10 bg-slate-950 p-2 shadow-2xl"
                  style={{ left: menuPosition.x, top: menuPosition.y }}
                  role="menu"
                  aria-label="Message actions"
                >
                  <div className="flex flex-wrap gap-1">
                    {["❤️", "👍", "😂"].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          toggleReaction(emoji);
                          setShowMenu(false);
                        }}
                        className="rounded px-2 py-1 text-sm hover:bg-white/10"
                      >
                        {emoji}
                      </button>
                    ))}
                    {message?.message && (
                      <div className="flex w-full items-center gap-1">
                        <select
                          value={translationLanguage}
                          onChange={(event) =>
                            setTranslationLanguage(event.target.value)
                          }
                          className="min-w-0 flex-1 rounded bg-slate-900 px-2 py-1 text-xs text-slate-200 outline-none"
                          aria-label="Translation language"
                        >
                          {translationLanguages.map((language) => (
                            <option key={language} value={language}>
                              {language}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            translateMessage();
                            setShowMenu(false);
                          }}
                          disabled={isTranslating}
                          className="rounded px-2 py-1 text-xs text-indigo-300 hover:bg-white/10 disabled:opacity-50"
                        >
                          {isTranslating ? "..." : "Translate"}
                        </button>
                      </div>
                    )}
                    {isSentByCurrentUser && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setEditedText(message.message);
                            setIsEditing(true);
                            setShowMenu(false);
                          }}
                          className="rounded px-2 py-1 text-xs text-slate-200 hover:bg-white/10"
                        >
                          Edit
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={deleteMessageForMe}
                      className="rounded px-2 py-1 text-xs text-red-300 hover:bg-red-500/10"
                    >
                      Delete for me
                    </button>
                    {isSentByCurrentUser && (
                      <button
                        type="button"
                        onClick={deleteMessageForEveryone}
                        className="rounded px-2 py-1 text-xs text-red-300 hover:bg-red-500/10"
                      >
                        Delete for everyone
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowMenu(false)}
                      className="rounded px-2 py-1 text-xs text-slate-400 hover:bg-white/10"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </>,
              document.body,
            )}
        </div>
      </div>
    </div>
  );
};

export default Message;
