import Sidebar from "./sidebar";
import MessageContainer from "./messageContainer";
import { useSelector } from "react-redux";

const HomePage = () => {
  const { selectedUser } = useSelector((store) => store.user);

  return (
    <div className="min-h-screen w-full bg-slate-950/30 backdrop-blur-sm p-3 sm:p-4 md:p-6 flex items-center justify-center">
      <div className="w-full h-[calc(100vh-1.5rem)] sm:h-[calc(100vh-2rem)] md:h-[calc(100vh-3rem)] max-w-7xl flex overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60 backdrop-blur-md shadow-2xl">
        <div
          className={`${selectedUser ? "hidden md:block" : "block"} w-full md:w-[320px] lg:w-87.5 shrink-0 border-r border-white/10`}
        >
          <Sidebar />
        </div>

        <div
          className={`${selectedUser ? "flex" : "hidden md:flex"} flex-1 min-w-0`}
        >
          <MessageContainer />
        </div>
      </div>
    </div>
  );
};

export default HomePage;
