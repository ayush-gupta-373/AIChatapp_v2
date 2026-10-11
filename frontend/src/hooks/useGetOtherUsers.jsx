import { useEffect } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { setOtherUser } from "../redux/userSlice";
import API_BASE_URL from "../config";
const useGetOtherUsers = () => {
  const dispatch = useDispatch();
  const authUserId = useSelector((store) => store.user.authUser?._id);

  useEffect(() => {
    if (!authUserId) {
      dispatch(setOtherUser([]));
      return;
    }

    const controller = new AbortController();
    dispatch(setOtherUser([]));

    const fetchOtherUsers = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/v1/user/`, {
          withCredentials: true,
          signal: controller.signal,
        });
        const users = Array.isArray(response.data) ? response.data : [];
        dispatch(
          setOtherUser(
            users.filter((user) => String(user._id) !== String(authUserId)),
          ),
        );
      } catch (error) {
        if (!controller.signal.aborted) {
          dispatch(setOtherUser([]));
          console.error("Error fetching other users:", error);
        }
      }
    };

    fetchOtherUsers();
    return () => controller.abort();
  }, [authUserId, dispatch]);
};
export default useGetOtherUsers;
