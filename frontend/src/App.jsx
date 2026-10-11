import "./App.css";
import HomePage from "./components/HomePage";
import Login from "./components/Login";
import Signup from "./components/signup";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
  Link,
} from "react-router-dom";
import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import io from "socket.io-client";
import { setSocket } from "./redux/socketSlice";
import { setOnlineUsers } from "./redux/userSlice";
import API_BASE_URL from "./config";

const AuthLanding = () => (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-10">
    <div className="w-full max-w-4xl rounded-2xl border border-white/10 bg-slate-950/75 p-8 shadow-2xl backdrop-blur-md sm:p-10">
      <div className="text-center mb-8">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500/15 text-2xl text-indigo-300 ring-1 ring-indigo-400/30">
          💬
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-white">
          ChatApp
        </h1>
        <p className="mt-3 text-sm text-slate-400">
          Connect with friends in real time.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          to="/login"
          className="rounded-xl bg-indigo-500 px-5 py-3 text-center text-base font-medium text-white transition hover:bg-indigo-400"
        >
          Login
        </Link>
        <Link
          to="/signup"
          className="rounded-xl border border-white/10 bg-slate-900/80 px-5 py-3 text-center text-base font-medium text-slate-200 transition hover:border-indigo-500/60 hover:text-white"
        >
          Signup
        </Link>
      </div>
    </div>
  </div>
);

const RootRoute = () => {
  const { authUser } = useSelector((store) => store.user);

  if (!authUser) return <AuthLanding />;

  return <HomePage />;
};

const PublicRoute = ({ children }) => {
  const { authUser } = useSelector((store) => store.user);

  if (authUser) return <Navigate to="/" replace />;

  return children;
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootRoute />,
  },
  {
    path: "/login",
    element: (
      <PublicRoute>
        <Login />
      </PublicRoute>
    ),
  },
  {
    path: "/signup",
    element: (
      <PublicRoute>
        <Signup />
      </PublicRoute>
    ),
  },
]);

function App() {
  const { socket } = useSelector((store) => store.socket);
  const { authUser } = useSelector((store) => store.user);
  const dispatch = useDispatch();

  useEffect(() => {
    if (authUser) {
      const newSocket = io(API_BASE_URL, {
        query: { userId: authUser._id },
      });

      dispatch(setSocket(newSocket));

      if (socket) {
        socket.off("getOnlineUsers");
      }

      newSocket.on("getOnlineUsers", (onlineUsers) => {
        dispatch(setOnlineUsers(onlineUsers));
      });

      return () => {
        newSocket.disconnect();
        dispatch(setSocket(null));
      };
    }

    socket?.disconnect();
    dispatch(setSocket(null));
  }, [authUser]);

  return (
    <div className="flex items-center justify-center">
      <RouterProvider router={router} />
    </div>
  );
}

export default App;
