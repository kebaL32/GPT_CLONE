import "dotenv/config";
import express from "express";
import db from "./db/db.config.js";
import cors from "cors";
import { errorHandler } from "./src/middleware/error-handler.js";
import mainRouter from "./src/api/main.routes.js";

const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173", "https://chatgptch.netlify.app"],
  }),
);
app.use(express.json());
app.use("/api", mainRouter);


app.use(errorHandler);

async function startServer() {
  try {
    const connection = await db.getConnection();
    connection.release();

    app.listen(3777, (err) => {
      if (err) {
        throw err;
      }

      console.log("Server is running on http://localhost:3777");
    });
  } catch (error) {
    console.error("Error starting server:", error);
  }
}

startServer();
