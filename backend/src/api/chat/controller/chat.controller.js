import createConversationService from "../service/chat.service.js";
import { getRecentConversationRows } from "../service/chat.service.js";

async function CreateConversationController(req, res, next) {
  try {
    const { question } = req.body;

    const result = await createConversationService(question);

    res.status(201).json({
      success: true,
      message: "Conversation created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

async function GetConversationController(req, res, next) {
  try {
    const result = await getRecentConversationRows(100);

    res.status(200).json({
      success: true,
      message: "Conversation retrieved successfully",
      data: { conversations: result },
    });
  } catch (error) {
    next(error);
  }
}

export { CreateConversationController, GetConversationController };
