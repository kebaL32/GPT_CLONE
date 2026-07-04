import "dotenv/config";
import db from "./db/db.config.js";
import express from "express";
import cors from "cors";
import mainRouter from "./src/api/main.routes.js";
import { ErrorHandler } from "./src/middleware/errorHandler.js";

const app = express();

// --- UPDATE THIS CORS BLOCK ---
const allowedOrigins = [
  "http://localhost:5173",          // For local development testing
  "https://chatgptch.netlify.app" // Your live production Netlify app
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, Postman, or server-to-server)
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
// ------------------------------

app.use(express.json()); // used to parse json payloads
app.use("/api", mainRouter);
app.use(ErrorHandler);

async function startServer() {
  try {
    const connection = await db.getConnection();
    connection.release();
    // Render handles the port automatically using process.env.PORT, 
    // but keeping 3788 as a local fallback is great!
    const PORT = process.env.PORT || 3777 ;
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
  }
}

startServer();