import { useEffect } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { setOtherUser } from "../redux/userSlice";
import API_BASE_URL from "../config";
const useGetOtherUsers = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    const fetchOtherUsers = async () => {
      try {
        axios.defaults.withCredentials = true;
        const response = await axios.get(`${API_BASE_URL}/api/v1/user/`, {
          withCredentials: true,
        });
        dispatch(setOtherUser(response.data));
      } catch (error) {
        console.error("Error fetching other users:", error);
      }
    };
    fetchOtherUsers();
  }, [dispatch]);
};
export default useGetOtherUsers;
