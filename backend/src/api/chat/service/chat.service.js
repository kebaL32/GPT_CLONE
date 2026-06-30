import db from "../../../../db/db.config.js";
import { GoogleGenAI } from "@google/genai";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash-lite";

const geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

if (
  !geminiClient ||
  !geminiClient.chats ||
  typeof geminiClient.chats.create !== "function"
) {
  try {
    console.error("geminiClient:", Object.keys(geminiClient || {}));
  } catch (e) {
    console.error("geminiClient is not inspectable");
  }
  throw new Error(
    "Gemini client 'chats.create' is unavailable. Check @google/genai usage and that GEMINI_API_KEY is set",
  );
}

export const getRecentConversationRows = async (limit = 5) => {
  const normalizedLimit = Number.parseInt(limit, 10);
  const safeLimit =
    Number.isNaN(normalizedLimit) || normalizedLimit <= 0
      ? 20
      : normalizedLimit;
  const [rows] = await db.execute(
    `SELECT id, role, content, created_at
   FROM conversations
   ORDER BY id DESC
   LIMIT ?`,
    [safeLimit],
  );
  return rows.reverse();
};

const generateAssistantAnswer = async (historyRows, question) => {
  const formattedHistory = historyRows.map((row) => ({
    role: row.role === "assistant" ? "model" : "user",
    parts: [{ text: row.content }],
  }));

  try {
    // console.log("[DEBUG] Creating chat with history:", formattedHistory.length, "messages");
    const chat = await geminiClient.chats.create({
      model: GEMINI_MODEL,
      config: {
        maxOutputTokens: 1024,
        systemInstruction: `
       You are a software-focused AI assistant. Only answer questions related to programming, software engineering, computer science, web development, IT, APIs, databases, and technology. Politely refuse unrelated questions and redirect the user back to software-related topics.`,
      },
      history: formattedHistory,
    });

    console.log("[DEBUG] Chat created, sending message...");
    const result = await chat.sendMessage({ message: question });

    // console.log("[DEBUG] Gemini response received:", result.text?.substring(0, 50));
    return {
      text: result.text,
      totalTokens: result.usageMetadata.totalTokenCount,
    };
  } catch (error) {
    // console.error("[ERROR] in generateAssistantAnswer:", error.message);
    // console.error("[ERROR] Full error:", error);
    throw error;
  }
};

const getMessageById = async (messageId) => {
  const [rows] = await db.execute(
    `SELECT id, role, content, token_count, created_at FROM conversations WHERE id = ? LIMIT 1`,
    [messageId],
  );
  if (!rows[0]) return null;
  return {
    id: rows[0].id,
    role: rows[0].role,
    content: rows[0].content,
    tokenCount: rows[0].token_count,
    createdAt: rows[0].created_at,
  };
};

async function createConversationService(question) {
  try {
    // validation
    if (!question.trim()) {
      const error = new Error("Question is required");
      error.status = 400;
      throw error;
    }

    // // console.log("[DEBUG] Creating conversation for question:", question.substring(0, 50));
    const historyRows = await getRecentConversationRows(5);
    // console.log("[DEBUG] Retrieved", historyRows.length, "history rows");

    const [result] = await db.execute(
      `INSERT INTO conversations (content, role) VALUES (?, "user")`,
      [question],
    );
    // console.log("[DEBUG] Inserted user message with ID:", result.insertId);

    const { text, totalTokens } = await generateAssistantAnswer(
      historyRows,
      question,
    );
    // console.log("[DEBUG] Generated assistant answer, tokens:", totalTokens);

    const [createAssistantMessageResult] = await db.execute(
      `INSERT INTO conversations (role, content, token_count) VALUES (?, ?, ?)`,
      ["assistant", text, totalTokens],
    );
    // console.log("[DEBUG] Inserted assistant message with ID:", createAssistantMessageResult.insertId);

    const userConversation = await getMessageById(result.insertId);
    const assistantConversation = await getMessageById(
      createAssistantMessageResult.insertId,
    );

    return {
      userConversation,
      assistantConversation,
    };
  } catch (error) {
    // console.error("[ERROR] in createConversationService:", error.message);
    // console.error("[ERROR] Full stack:", error);
    throw error;
  }
}

export default createConversationService;
