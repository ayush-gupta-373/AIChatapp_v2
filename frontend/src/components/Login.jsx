import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "react-hot-toast";
import axios from "axios";
import { useDispatch } from "react-redux";
import { setAuthUser } from "../redux/userSlice";
import API_BASE_URL from "../config";
const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [user, setUser] = useState({
    username: "",
    password: "",
  });
  const onSubmitHandler = async (e) => {
    e.preventDefault();
    //console.log(user);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/v1/user/login`, user, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });

      dispatch(setAuthUser(res.data));
      navigate("/");
    } catch (error) {
      toast.error(error.response.data.message || "Something went wrong");
    }
    setUser({
      username: "",
      password: "",
    });
  };
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-2xl bg-slate-950/75 backdrop-blur-md border border-white/10 shadow-2xl p-6 sm:p-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white">Welcome Back</h1>
          <p className="text-sm text-slate-400 mt-2">
            Login to continue chatting
          </p>
        </div>
        <form onSubmit={onSubmitHandler}>
          <div className="form-control mb-4">
            <label htmlFor="username" className="label">
              <span className="label-text text-slate-200">Username</span>
            </label>

            <input
              id="username"
              type="text"
              placeholder="Enter your username"
              className="input input-bordered w-full bg-slate-900/70 text-white placeholder:text-slate-500 border-slate-700 focus:border-indigo-500"
              value={user.username}
              onChange={(e) => setUser({ ...user, username: e.target.value })}
            />
          </div>

          <div className="form-control mb-6">
            <label htmlFor="password" className="label">
              <span className="label-text text-slate-200">Password</span>
            </label>

            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              className="input input-bordered w-full bg-slate-900/70 text-white placeholder:text-slate-500 border-slate-700 focus:border-indigo-500"
              value={user.password}
              onChange={(e) => setUser({ ...user, password: e.target.value })}
            />
          </div>

          <button className="btn btn-primary w-full text-base">Login</button>

          <p className="text-center text-sm text-slate-400 mt-6">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-indigo-400 hover:text-indigo-300 font-medium hover:underline"
            >
              Signup
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
