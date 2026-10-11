const mongoose = require("mongoose");
const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  message: {
    type: String,
    default: "",
  },
  edited: {
    type: Boolean,
    default: false,
  },
  attachment: {
    url: { type: String, default: "" },
    name: { type: String, default: "" },
    type: { type: String, default: "" },
  },
  deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  reactions: {
    type: [
      {
        emoji: { type: String, required: true },
        users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      },
    ],
    default: [],
  },
},{timestamps: true})
module.exports = mongoose.model("Message", messageSchema);