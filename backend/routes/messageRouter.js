const express = require("express");
const {
	sendMessage,
	sendFileMessage,
	toggleReaction,
	editMessage,
	deleteMessage,
	deleteMessageForMe,
	deleteMessageForEveryone,
	downloadFile,
	getMessage,
} = require("../controllers/messageController");
const isAuthenticated = require("../middleware/isAuthenticated");
const upload = require("../middleware/upload");

const messageRouter = express.Router();
messageRouter.post("/send/:id",isAuthenticated,sendMessage);
messageRouter.post("/send-file/:id", isAuthenticated, upload.single("file"), sendFileMessage);
messageRouter.patch("/:messageId/reaction", isAuthenticated, toggleReaction);
messageRouter.patch("/:messageId", isAuthenticated, editMessage);
messageRouter.delete("/:messageId", isAuthenticated, deleteMessage);
messageRouter.delete("/:messageId/for-me", isAuthenticated, deleteMessageForMe);
messageRouter.delete("/:messageId/for-everyone", isAuthenticated, deleteMessageForEveryone);
messageRouter.get("/download/:messageId", isAuthenticated, downloadFile);
messageRouter.get("/:id",isAuthenticated,getMessage);
module.exports = messageRouter;