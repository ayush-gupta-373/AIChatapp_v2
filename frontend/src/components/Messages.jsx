import useGetMessages from "../hooks/useGetMessages";
import useGetRealTimeMessage from "../hooks/useRealTimeMessage";
import { useSelector } from "react-redux";
import Message from "./Message";

const getDayKey = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "unknown" : date.toDateString();
};

const getDayLabel = (value) => {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (getDayKey(date) === getDayKey(today)) return "Today";
  if (getDayKey(date) === getDayKey(yesterday)) return "Yesterday";
  return date.toLocaleDateString([], {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const Messages = () => {
  useGetMessages();
  useGetRealTimeMessage();

  const { messages } = useSelector((store) => store.message);
  const { authUser } = useSelector((store) => store.user);

  if (!messages) return null;

  return (
    <div className="w-full">
      {messages?.map((message, index) => {
        const previousMessage = messages[index - 1];
        const showDayLabel =
          index === 0 ||
          getDayKey(message.createdAt) !==
            getDayKey(previousMessage?.createdAt);

        return (
          <div key={message._id}>
            {showDayLabel && message.createdAt && (
              <div className="my-4 flex justify-center">
                <span className="rounded-full bg-slate-800/80 px-3 py-1 text-[11px] text-slate-300 shadow-sm">
                  {getDayLabel(message.createdAt)}
                </span>
              </div>
            )}
            <Message message={message} authUser={authUser} />
          </div>
        );
      })}
    </div>
  );
};

export default Messages;
