import { useEffect } from "react";
import defaultProfile from "../assets/defaultProfile.png";
import Messages from "./Messages";
import SendInput from "./sendMessage";
import { useSelector, useDispatch } from "react-redux";
import { setSelectedUser } from "../redux/userSlice";
import axios from "axios";
import { useState } from "react";
import { FiArrowLeft } from "react-icons/fi";
import API_BASE_URL from "../config";

const MessageContainer = () => {
  const { selectedUser, authUser } = useSelector((store) => store.user);
  const { messages } = useSelector((store) => store.message);
  const dispatch = useDispatch();
  const [aiResult, setAiResult] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  useEffect(() => {
    return () => dispatch(setSelectedUser(null));
  }, [dispatch]);

  const runAiAction = async (action) => {
    setAiLoading(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/ai/${action}`,
        action === "summarize"
          ? { messages }
          : { text: "", language: "English" },
        { withCredentials: true },
      );
      setAiResult(response.data.result);
    } catch (error) {
      setAiResult(error.response?.data?.message || "AI feature unavailable");
    } finally {
      setAiLoading(false);
    }
  };
  return (
    <>
      {selectedUser !== null ? (
        <div className="flex-1 min-w-0 min-h-0 h-full flex flex-col bg-slate-950/30">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 sm:px-5 py-4 border-b border-white/10 bg-slate-950/60 backdrop-blur-md">
            <button
              type="button"
              onClick={() => dispatch(setSelectedUser(null))}
              className="md:hidden text-slate-300 hover:text-white px-2 py-1"
              aria-label="Back to users"
              title="Back to users"
            >
              <FiArrowLeft size={20} />
            </button>
            <div className="avatar">
              <div className="w-11 rounded-full ring ring-indigo-500/60 ring-offset-2 ring-offset-slate-950">
                <img
                  src={selectedUser?.profilePhoto || defaultProfile}
                  alt="User"
                  onError={(event) => {
                    event.currentTarget.src = defaultProfile;
                  }}
                />
              </div>
            </div>

            <div className="min-w-0">
              <h2 className="truncate text-white font-semibold">
                {selectedUser?.fullName}
              </h2>
            </div>
            <div className="ml-auto flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => runAiAction("summarize")}
                disabled={aiLoading}
                className="shrink-0 whitespace-nowrap rounded-xl bg-purple-600 px-2 py-2 text-xs font-semibold text-white shadow-lg shadow-purple-900/30 transition hover:bg-purple-500 sm:px-4 sm:text-sm"
              >
                {aiLoading ? "Summarizing..." : "✨ Summary"}
              </button>
            </div>
          </div>

          {aiResult && (
            <div className="flex items-start gap-3 border-b border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-slate-200">
              <p className="min-w-0 flex-1 whitespace-pre-wrap break-words">
                {aiResult}
              </p>
              <button
                type="button"
                onClick={() => setAiResult("")}
                className="shrink-0 text-xs text-indigo-300"
              >
                Close
              </button>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-5">
            <Messages />
          </div>

          {/* Send Message */}
          <div className="shrink-0 p-3 sm:p-4 border-t border-white/10 bg-slate-950/60 backdrop-blur-md">
            <SendInput />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-slate-950/30">
          <div className="text-center">
            <h1 className="text-xl font-semibold text-white">
              Let's start a conversation {authUser?.fullName}
            </h1>

            <p className="text-sm text-slate-500 mt-2">
              Select a user to start chatting
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default MessageContainer;
