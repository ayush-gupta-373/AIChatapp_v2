import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setMessages } from "../redux/messageSlice";

const normalizeId = (value) => {
  const id =
    value && typeof value === "object"
      ? (value._id ?? value.id ?? value.$oid)
      : value;
  return String(id ?? "");
};

const useGetRealTimeMessage = () => {
  const dispatch = useDispatch();
  const { socket } = useSelector((store) => store.socket);
  const { selectedUser } = useSelector((store) => store.user);
  const { messages } = useSelector((store) => store.message);

  useEffect(() => {
    if (!socket || !selectedUser) return;

    const handleNewMessage = (newMessage) => {
      if (!newMessage) return;

      const isRelevantMessage =
        newMessage.senderId === selectedUser._id ||
        newMessage.receiverId === selectedUser._id;

      if (!isRelevantMessage) return;

      const nextMessages = Array.isArray(messages)
        ? [...messages.filter((msg) => msg._id !== newMessage._id), newMessage]
        : [newMessage];

      dispatch(setMessages(nextMessages));
    };

    socket.on("newMessage", handleNewMessage);

    const handleUpdatedMessage = (updatedMessage) => {
      if (!updatedMessage) return;

      const selectedUserId = normalizeId(selectedUser);
      const isRelevantMessage =
        normalizeId(updatedMessage.senderId) === selectedUserId ||
        normalizeId(updatedMessage.receiverId) === selectedUserId;
      if (!isRelevantMessage) return;

      dispatch(
        setMessages(
          (Array.isArray(messages) ? messages : []).map((item) =>
            normalizeId(item._id) === normalizeId(updatedMessage._id)
              ? updatedMessage
              : item,
          ),
        ),
      );
    };
    socket.on("messageUpdated", handleUpdatedMessage);

    const handleDeletedMessage = ({ messageId }) => {
      dispatch(setMessages(messages.filter((msg) => msg._id !== messageId)));
    };
    socket.on("messageDeleted", handleDeletedMessage);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("messageUpdated", handleUpdatedMessage);
      socket.off("messageDeleted", handleDeletedMessage);
    };
  }, [socket, selectedUser, messages, dispatch]);
};

export default useGetRealTimeMessage;
