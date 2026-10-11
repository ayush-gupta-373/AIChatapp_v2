const express = require("express");
const userRouter = express.Router();
const { register,login,logout,getOtherUsers} = require("../controllers/userController");
const isAuthenticated = require("../middleware/isAuthenticated");
const upload = require("../middleware/upload");

userRouter.post("/register", upload.single("profilePhoto"), register);
userRouter.post("/login", login);
userRouter.get("/logout", logout);
userRouter.get("/",isAuthenticated, getOtherUsers);



module.exports = userRouter;