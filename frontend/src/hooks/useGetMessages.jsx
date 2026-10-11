import { useEffect } from "react";
import axios from "axios";
import { useSelector, useDispatch } from "react-redux";
import { setMessages } from "../redux/messageSlice";
import API_BASE_URL from "../config";

const useGetMessages = () => {
  const { selectedUser } = useSelector((store) => store.user);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedUser?._id) return;

      try {
        axios.defaults.withCredentials = true;
        const response = await axios.get(
          `${API_BASE_URL}/api/v1/message/${selectedUser._id}`,
          { withCredentials: true },
        );
        dispatch(setMessages(response.data.messages || []));
      } catch (err) {
        console.log(err);
      }
    };

    fetchMessages();
  }, [selectedUser, dispatch]);
};

export default useGetMessages;
