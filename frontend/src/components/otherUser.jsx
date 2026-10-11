import defaultProfile from "../assets/defaultProfile.png";
import { useSelector, useDispatch } from "react-redux";
import { setSelectedUser } from "../redux/userSlice";

const OtherUser = ({ user }) => {
  const dispatch = useDispatch();

  const { selectedUser, onlineUsers } = useSelector((store) => store.user);

  const isOnline = onlineUsers?.includes(user._id);
  const isSelected = selectedUser?._id === user._id;

  const selectUserHandler = () => {
    dispatch(setSelectedUser(isSelected ? null : user));
  };

  return (
    <>
      <div
        onClick={selectUserHandler}
        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 ${
          isSelected
            ? "bg-indigo-500/15 border border-indigo-500/40 shadow-lg shadow-indigo-500/10"
            : "hover:bg-slate-800/60 border border-transparent"
        }`}
      >
        <div className={`avatar ${isOnline ? "online" : "offline"}`}>
          <div
            className={`w-12 rounded-full ring-2 ring-offset-2 ring-offset-slate-950 ${
              isSelected ? "ring-indigo-400" : "ring-indigo-500/50"
            }`}
          >
            <img
              src={user.profilePhoto || defaultProfile}
              alt={user.fullName}
              onError={(event) => {
                event.currentTarget.src = defaultProfile;
              }}
            />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3
            className={`font-medium truncate ${
              isSelected ? "text-indigo-300" : "text-white"
            }`}
          >
            {user.fullName}
          </h3>

          <p
            className={`text-xs ${
              isOnline ? "text-green-400" : "text-slate-500"
            }`}
          >
            {isOnline ? "Online" : "Offline"}
          </p>
        </div>
      </div>

      <div className="divider my-0 border-slate-700/50"></div>
    </>
  );
};

export default OtherUser;
