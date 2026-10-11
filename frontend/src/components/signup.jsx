import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import API_BASE_URL from "../config";
const Signup = () => {
  const [user, setUser] = useState({
    fullName: "",
    username: "",
    password: "",
    confirmPassword: "",
    gender: "",
    profilePhoto: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    //console.log(user);
    //console.log(e);
    try {
      const formData = new FormData();
      Object.entries(user).forEach(([key, value]) => {
        if (value !== null && value !== "") formData.append(key, value);
      });
      const res = await axios.post(
        `${API_BASE_URL}/api/v1/user/register`,
        formData,
        { withCredentials: true },
      );
      //console.log(res);
      if (res.data.success) {
        toast.success(res.data.message);
        setUser({
          fullName: "",
          username: "",
          password: "",
          confirmPassword: "",
          gender: "",
          profilePhoto: null,
        });
        navigate("/login");
        return;
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to create account");
      console.log(err.response || err);
    } finally {
      setIsSubmitting(false);
    }
    setUser({
      fullName: "",
      username: "",
      password: "",
      confirmPassword: "",
      gender: "",
      profilePhoto: null,
    });
  };
  return (
    <div className="h-screen overflow-hidden flex items-center justify-center px-3 py-3 sm:px-4 sm:py-4">
      <div className="w-full max-w-md rounded-2xl bg-slate-950/75 backdrop-blur-md border border-white/10 shadow-2xl p-4 sm:p-6">
        <div className="text-center mb-3 sm:mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Create Account
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Join ChatApp and start connecting
          </p>
        </div>

        <form onSubmit={onSubmitHandler}>
          <div className="form-control mb-2 sm:mb-3">
            <label className="label">
              <span className="label-text text-slate-200">Full Name</span>
            </label>
            <input
              type="text"
              value={user.fullName}
              onChange={(e) => setUser({ ...user, fullName: e.target.value })}
              placeholder="Enter your full name"
              className="input input-sm sm:input-md input-bordered w-full bg-slate-900/70 text-white placeholder:text-slate-500 border-slate-700 focus:border-indigo-500"
            />
          </div>

          <div className="form-control mb-2 sm:mb-3">
            <label className="label">
              <span className="label-text text-slate-200">Username</span>
            </label>
            <input
              type="text"
              value={user.username}
              onChange={(e) => setUser({ ...user, username: e.target.value })}
              placeholder="Choose a username"
              className="input input-sm sm:input-md input-bordered w-full bg-slate-900/70 text-white placeholder:text-slate-500 border-slate-700 focus:border-indigo-500"
            />
          </div>

          <div className="form-control mb-2 sm:mb-3">
            <label className="label">
              <span className="label-text text-slate-200">Password</span>
            </label>
            <input
              type="password"
              value={user.password}
              onChange={(e) => setUser({ ...user, password: e.target.value })}
              placeholder="Enter password"
              className="input input-sm sm:input-md input-bordered w-full bg-slate-900/70 text-white placeholder:text-slate-500 border-slate-700 focus:border-indigo-500"
            />
          </div>

          <div className="form-control mb-2 sm:mb-3">
            <label className="label">
              <span className="label-text text-slate-200">
                Confirm Password
              </span>
            </label>
            <input
              type="password"
              value={user.confirmPassword}
              onChange={(e) =>
                setUser({ ...user, confirmPassword: e.target.value })
              }
              placeholder="Confirm your password"
              className="input input-sm sm:input-md input-bordered w-full bg-slate-900/70 text-white placeholder:text-slate-500 border-slate-700 focus:border-indigo-500"
            />
          </div>

          <div className="mb-3 sm:mb-4">
            <label className="text-xs sm:text-sm text-slate-200 block mb-1 sm:mb-2">
              Gender
            </label>

            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={user.gender === "male"}
                  onChange={(e) => setUser({ ...user, gender: e.target.value })}
                  className="radio radio-primary radio-sm"
                />
                Male
              </label>

              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={user.gender === "female"}
                  onChange={(e) => setUser({ ...user, gender: e.target.value })}
                  className="radio radio-primary radio-sm"
                />
                Female
              </label>
            </div>
          </div>

          <div className="form-control mb-3 sm:mb-4">
            <label htmlFor="profilePhoto" className="label">
              <span className="label-text text-slate-200">
                Profile photo (optional)
              </span>
            </label>
            <input
              id="profilePhoto"
              type="file"
              accept="image/*"
              onChange={(e) =>
                setUser({ ...user, profilePhoto: e.target.files?.[0] || null })
              }
              className="file-input file-input-sm sm:file-input-md file-input-bordered w-full bg-slate-900/70 text-slate-200 border-slate-700"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary btn-sm sm:btn-md w-full text-base"
          >
            {isSubmitting ? "Creating..." : "Create Account"}
          </button>

          <p className="text-center text-xs sm:text-sm text-slate-400 mt-3 sm:mt-4">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-indigo-400 hover:text-indigo-300 font-medium hover:underline"
            >
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Signup;
