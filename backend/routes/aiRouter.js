const express = require("express");
const { summarize, translate } = require("../controllers/aiController");
const isAuthenticated = require("../middleware/isAuthenticated");

const aiRouter = express.Router();
aiRouter.post("/summarize", isAuthenticated, summarize);
aiRouter.post("/translate", isAuthenticated, translate);

module.exports = aiRouter;