import axios from "axios";
import { useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setMessages } from "../redux/messageSlice";
import API_BASE_URL from "../config";

const SendInput = () => {
  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [filePreview, setFilePreview] = useState("");
  const fileInputRef = useRef(null);

  const dispatch = useDispatch();

  const { selectedUser } = useSelector((store) => store.user);
  const { messages } = useSelector((store) => store.message);

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    if ((!message.trim() && !file) || !selectedUser) {
      return;
    }

    setIsSending(true);
    setUploadError("");
    try {
      const formData = new FormData();
      formData.append("message", message);
      if (file) formData.append("file", file);
      const res = await axios.post(
        file
          ? `${API_BASE_URL}/api/v1/message/send-file/${selectedUser._id}`
          : `${API_BASE_URL}/api/v1/message/send/${selectedUser._id}`,
        file ? formData : { message },
        { withCredentials: true },
      );

      dispatch(
        setMessages([
          ...(Array.isArray(messages) ? messages : []),
          res?.data?.newMessage,
        ]),
      );

      setMessage("");
      setFile(null);
      if (filePreview) URL.revokeObjectURL(filePreview);
      setFilePreview("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setUploadError(
        err.response?.data?.message ||
          "Unable to send attachment. Please try again.",
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form onSubmit={onSubmitHandler} className="relative w-full min-w-0">
      {file && (
        <div className="mb-2 flex items-center gap-2 rounded-lg border border-white/10 bg-slate-900/80 p-2">
          {filePreview ? (
            <img
              src={filePreview}
              alt="Selected attachment preview"
              className="h-12 w-12 rounded object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded bg-slate-800 text-xs text-slate-400">
              FILE
            </div>
          )}
          <span className="min-w-0 flex-1 truncate text-sm text-slate-200">
            {file.name}
          </span>
          <button
            type="button"
            onClick={() => {
              setFile(null);
              if (filePreview) URL.revokeObjectURL(filePreview);
              setFilePreview("");
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
            className="px-2 text-lg leading-none text-slate-400 hover:text-white"
            aria-label="Remove selected attachment"
            title="Remove attachment"
          >
            &times;
          </button>
        </div>
      )}
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,audio/*,.pdf,.xls,.xlsx,.csv,.doc,.docx,.ppt,.pptx"
          className="hidden"
          onChange={(e) => {
            const selectedFile = e.target.files?.[0] || null;
            if (filePreview) URL.revokeObjectURL(filePreview);
            setFile(selectedFile);
            setFilePreview(
              selectedFile?.type.startsWith("image/")
                ? URL.createObjectURL(selectedFile)
                : "",
            );
            setUploadError("");
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0 rounded-lg border border-white/10 px-3 py-2.5 text-slate-300 hover:text-white"
          aria-label="Attach a file"
          title={file?.name || "Attach a file"}
        >
          +
        </button>
        <input
          type="text"
          placeholder="Type a message..."
          className="min-w-0 flex-1 bg-slate-900/70 text-slate-200 placeholder:text-slate-500 border border-white/10 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 backdrop-blur-md"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <button
          type="submit"
          disabled={isSending}
          className="shrink-0 bg-indigo-500/90 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-600 transition focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        >
          {isSending ? "Sending..." : "Send"}
        </button>
      </div>
      {uploadError && (
        <p className="absolute bottom-20 left-4 right-4 text-xs text-red-300 sm:left-auto sm:right-4">
          {uploadError}
        </p>
      )}
    </form>
  );
};

export default SendInput;
