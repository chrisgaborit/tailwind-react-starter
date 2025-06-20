import express from "express";
import cors from "cors";
import generateRoute from "./routes/generateRoute";

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Routes
app.use("/generate", generateRoute);

export default app;
