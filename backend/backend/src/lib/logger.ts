import pino from "pino";
import pinoHttp from "pino-http";
import { nanoid } from "nanoid";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  redact: { paths: ["req.headers.authorization"], censor: "***" },
  transport: process.env.NODE_ENV === "development" ? { target: "pino-pretty" } : undefined,
});

export const httpLogger = pinoHttp({
  logger,
  genReqId: (req) => (req.headers["x-request-id"] as string) || nanoid(10),
  customLogLevel: (_req, res, err) => (err || res.statusCode >= 500 ? "error" : "info"),
});
