import "dotenv/config";
import app from "./app";

console.log("🧠 CLEAN START: RAG disabled, Agents v2 only");
process.env.USE_RAG = "false";

const port = process.env.PORT ? Number(process.env.PORT) : 8080;

const server = app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
  console.log("✅ Agents v2 routes loaded");
  console.log("🧹 Prompt Reset Applied – No legacy coaching content allowed");
});

server.on("error", (error) => {
  console.error("❌ Failed to start server:", error);
});
