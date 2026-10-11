const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { uploadToCloudinary } = require("../config/cloudinary");

const isProduction = process.env.NODE_ENV === "production";

const getCookieOptions = () => ({
  httpOnly: true,
  path: "/",
  sameSite: isProduction ? "none" : "lax",
  secure: isProduction,
  maxAge: 24 * 60 * 60 * 1000,
});

exports.register=async (req, res,next) => {
  try {
    const { fullName, username, password, confirmPassword, gender } = req.body;
    if(!fullName || !username || !password || !confirmPassword || !gender){
      return res.status(400).json({message: "All fields are required"});
    }
    if(password !== confirmPassword){
      return res.status(400).json({message: "Password and confirm password do not match"});
    }
     const user= await User.findOne({username});
    if(user){
      return res.status(400).json({message: "Username already exists"});
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const profilePhoto = req.file
      ? await uploadToCloudinary(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype,
        )
      : "";
    await User.create({ fullName, username, password: hashedPassword, profilePhoto, gender });
    return res.status(201).json({
      message: "User registered successfully",
      success: true,
      profilePhoto,
    });
  }
  catch(error)
  {
    console.log(error);
    return res.status(500).json({ message: "Unable to create account" });
  }
}
exports.login=async (req, res,next) => {
  try {
    const { username, password } = req.body;
    if(!username || !password){
      return res.status(400).json({message: "All fields are required"});
    }
     const user= await User.findOne({username})
     if(!user){
      return res.status(400).json({message: "invalid username or password"});
     }
     const isMatch=await bcrypt.compare(password,user.password);
     if(!isMatch){
      return res.status(400).json({message: "invalid username or password"});
     }
     const tokenData={
      userId: user._id,
     }
     const token = await jwt.sign(tokenData, process.env.JWT_SECRET_KEY, { expiresIn: "1d" });
     return res.status(200).cookie("token", token, getCookieOptions()).json({
      _id: user._id,
      fullName: user.fullName,
      username: user.username,
      profilePhoto: user.profilePhoto,
      gender: user.gender,
     })
    }
  catch(error)
  {

    console.log(error);
  }
}
exports.logout=async (req, res,next) => {
  try {
    return res.status(200).cookie("token", "", {
      ...getCookieOptions(),
      maxAge: 0,
    }).json({
      message: "User logged out successfully"
    })
  }
  catch(error)
  {
    console.log(error);
  }
}
exports.getOtherUsers=async (req, res,next) => {
  try
  {
    const loggedInUserId=req.id;
    const otherUsers=await User.find({_id: {$ne: loggedInUserId}}).select("-password");
    return res.status(200).json(
      otherUsers
    )

  }
  catch(error)
  {
    console.log(error);
  }
}