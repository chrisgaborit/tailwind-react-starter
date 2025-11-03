// backend/src/middleware/normaliseDuration.ts
import type { Request, Response, NextFunction } from "express";
import { parseDurationMins } from "../utils/parseDuration";

// ✅ Allow 1–90 minutes instead of forcing min=5
const MIN = 1;
const MAX = 90;

export function normaliseDuration(req: Request, _res: Response, next: NextFunction) {
  const body = (req.body ?? {}) as Record<string, any>;
  const raw = body.durationMins ?? body.duration ?? body.moduleDuration;

  // Parse user input into a number of minutes
  const parsed = parseDurationMins(raw);

  // Clamp between 1 and 90 minutes
  const clamped = Math.min(MAX, Math.max(MIN, Math.round(parsed || 0)));

  body.durationMins = clamped;
  req.body = body;

  next();
}