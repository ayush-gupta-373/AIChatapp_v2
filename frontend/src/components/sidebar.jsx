import { useState } from "react";
import { FiSearch, FiLogOut } from "react-icons/fi";
import OtherUsers from "./otherUsers";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { setAuthUser } from "../redux/userSlice";
import useGetOtherUsers from "../hooks/useGetOtherUsers";
import API_BASE_URL from "../config";

const Sidebar = () => {
  useGetOtherUsers();

  const { otherUser } = useSelector((store) => store.user);
  const dispatch = useDispatch();

  const [search, setSearch] = useState("");
  const searchValue = search.trim().toLowerCase();
  const filteredUsers = (otherUser || []).filter(
    (user) =>
      user.fullName.toLowerCase().includes(searchValue) ||
      user.username.toLowerCase().includes(searchValue),
  );

  const navigate = useNavigate();

  const searchSubmitHandler = (e) => {
    e.preventDefault();
  };

  const logoutHandler = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/user/logout`, {
        withCredentials: true,
      });

      navigate("/login");
      toast.success(response.data.message);
      dispatch(setAuthUser(null));
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="h-full w-full bg-slate-950/75 backdrop-blur-md border border-white/10 rounded-xl flex flex-col overflow-hidden">
      <form
        onSubmit={searchSubmitHandler}
        className="flex items-center gap-2 p-4"
      >
        <div className="flex-1 flex items-center bg-slate-900/70 border border-white/10 rounded-lg px-3 focus-within:border-indigo-500/50 transition">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full bg-transparent outline-none text-white placeholder:text-slate-500 py-2"
          />

          <button
            type="submit"
            className="text-indigo-400 hover:text-indigo-300 transition p-1"
          >
            <FiSearch size={20} />
          </button>
        </div>
      </form>

      <div className="divider my-0 border-white/10"></div>

      <div className="flex-1 overflow-y-auto px-2 py-2">
        <OtherUsers users={filteredUsers} />
      </div>

      <div className="divider my-0 border-white/10"></div>

      <div className="p-4">
        <button
          onClick={logoutHandler}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-slate-900/80 border border-white/10 text-slate-300 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition"
        >
          <FiLogOut size={19} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
