import express from "express";
import {
  CreateConversationController,
  GetConversationController,
} from "./controller/chat.controller.js";

const chatRouter = express.Router();
// use plural 'conversations' to match frontend expectations
chatRouter.post("/conversations", CreateConversationController);
chatRouter.get("/conversations", GetConversationController);

export default chatRouter;
