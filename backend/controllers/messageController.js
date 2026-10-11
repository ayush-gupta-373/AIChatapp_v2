const Conversation = require("../models/conversationModel");
const Message = require("../models/messageModel");

const saveMessage = async ({ senderId, receiverId, message = "", attachment = {} }) => {
  let conversation = await Conversation.findOne({
    participants: { $all: [senderId, receiverId] },
  });

  if (!conversation) {
    conversation = await Conversation.create({ participants: [senderId, receiverId] });
  }

  const newMessage = await Message.create({ senderId, receiverId, message, attachment });
  conversation.messages.push(newMessage._id);
  await conversation.save();

  if (global.io) {
    global.io.to(`user:${receiverId}`).emit("newMessage", newMessage);
  }
  return newMessage;
};

exports.sendMessage = async (req, res, next) => {
  try {
    const senderId = req.id;
    const receiverId = req.params.id;
    const { message } = req.body;

    const newMessage = await saveMessage({ senderId, receiverId, message });

    return res.status(200).json({ newMessage });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.getMessage = async (req, res, next) => {
  try {
    const senderId = req.id;
    const receiverId = req.params.id;

    const conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    if (!conversation || !conversation.messages || conversation.messages.length === 0) {
      return res.status(200).json({ messages: [] });
    }

    const messages = await Message.find({
      _id: { $in: conversation.messages },
      deletedFor: { $ne: senderId },
    }).sort({ createdAt: 1 });

    return res.status(200).json({ messages });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.sendFileMessage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "A file is required" });
    const newMessage = await saveMessage({
      senderId: req.id,
      receiverId: req.params.id,
      attachment: {
        url: await require("../config/cloudinary").uploadToCloudinary(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype,
        ),
        name: req.file.originalname,
        type: req.file.mimetype,
      },
    });
    return res.status(200).json({ newMessage });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Unable to send file" });
  }
};

exports.toggleReaction = async (req, res) => {
  try {
    const { emoji } = req.body;
    const message = await Message.findById(req.params.messageId);
    if (!message || !emoji) return res.status(400).json({ message: "Invalid reaction" });

    let reaction = message.reactions.find((item) => item.emoji === emoji);
    if (!reaction) {
      message.reactions.push({ emoji, users: [req.id] });
    } else {
      const index = reaction.users.findIndex((userId) => String(userId) === String(req.id));
      if (index === -1) reaction.users.push(req.id);
      else reaction.users.splice(index, 1);
      if (reaction.users.length === 0) message.reactions = message.reactions.filter((item) => item.emoji !== emoji);
    }

    await message.save();
    return res.status(200).json({ message });
  } catch (error) {
    return res.status(500).json({ message: "Unable to update reaction" });
  }
};

exports.editMessage = async (req, res) => {
  try {
    const messageText = req.body.message?.trim();
    const message = await Message.findOne({ _id: req.params.messageId, senderId: req.id });

    if (!message) return res.status(404).json({ message: "Message not found" });
    if (!messageText) return res.status(400).json({ message: "Message cannot be empty" });

    message.message = messageText;
    message.edited = true;
    await message.save();

    if (global.io) {
      global.io
        .to(`user:${message.senderId}`)
        .to(`user:${message.receiverId}`)
        .emit("messageUpdated", message);
    }

    return res.status(200).json({ message });
  } catch (error) {
    return res.status(500).json({ message: "Unable to edit message" });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const message = await Message.findOneAndDelete({
      _id: req.params.messageId,
      senderId: req.id,
    });

    if (!message) return res.status(404).json({ message: "Message not found" });

    await Conversation.updateMany(
      { messages: message._id },
      { $pull: { messages: message._id } },
    );

    return res.status(200).json({ messageId: message._id });
  } catch (error) {
    return res.status(500).json({ message: "Unable to delete message" });
  }
};

exports.deleteMessageForMe = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });

    if (
      String(message.senderId) !== String(req.id) &&
      String(message.receiverId) !== String(req.id)
    ) {
      return res.status(403).json({ message: "You cannot delete this message" });
    }

    await Message.findByIdAndUpdate(req.params.messageId, {
      $addToSet: { deletedFor: req.id },
    });
    return res.status(200).json({ messageId: message._id });
  } catch (error) {
    return res.status(500).json({ message: "Unable to delete message" });
  }
};

exports.deleteMessageForEveryone = async (req, res) => {
  try {
    const message = await Message.findOne({
      _id: req.params.messageId,
      senderId: req.id,
    });
    if (!message) return res.status(404).json({ message: "Message not found" });

    await Message.findByIdAndDelete(message._id);
    await Conversation.updateMany(
      { messages: message._id },
      { $pull: { messages: message._id } },
    );

    if (global.io) {
      global.io.to(`user:${message.receiverId}`).emit("messageDeleted", {
        messageId: String(message._id),
      });
    }

    return res.status(200).json({ messageId: message._id });
  } catch (error) {
    return res.status(500).json({ message: "Unable to delete message" });
  }
};

exports.downloadFile = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message?.attachment?.url) {
      return res.status(404).json({ message: "Attachment not found" });
    }

    if (
      String(message.senderId) !== String(req.id) &&
      String(message.receiverId) !== String(req.id)
    ) {
      return res.status(403).json({ message: "You cannot access this file" });
    }

    const fileResponse = await fetch(message.attachment.url);
    if (!fileResponse.ok) return res.status(502).json({ message: "Unable to download file" });

    const fileBuffer = Buffer.from(await fileResponse.arrayBuffer());
    const fileName = (message.attachment.name || "download")
      .split(/[\\/]/)
      .pop()
      .replace(/[^a-zA-Z0-9._ -]/g, "_")
      .trim() || "download";

    res.setHeader("Content-Type", message.attachment.type || "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    return res.send(fileBuffer);
  } catch (error) {
    return res.status(500).json({ message: "Unable to download file" });
  }
};