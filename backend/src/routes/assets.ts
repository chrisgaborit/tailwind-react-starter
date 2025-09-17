// backend/src/routes/assets.ts
const { Router, Request, Response } = require('express');
const { enqueueStoryboardAssets, getModuleQueueSnapshot } = require('../services/assetQueue');
{ StoryboardModule } from "../types";
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const router = Router();

function uid() {
  return crypto.randomBytes(8).toString("hex");
}

// POST /api/assets/enqueue
// Body: { moduleId?: string, storyboard: StoryboardModule }
router.post("/enqueue", async (req: Request, res: Response) => {
  try {
    const storyboard = req.body?.storyboard as StoryboardModule;
    if (!storyboard || !Array.isArray(storyboard.scenes)) {
      return res.status(400).json({ error: "Invalid storyboard payload" });
    }
    const moduleId = req.body?.moduleId || uid();
    const snapshot = enqueueStoryboardAssets(moduleId, storyboard);
    return res.status(202).json({ moduleId, snapshot });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || "Failed to enqueue assets" });
  }
});

// GET /api/assets/status/:moduleId
router.get("/status/:moduleId", (req: Request, res: Response) => {
  try {
    const moduleId = req.params.moduleId;
    const snapshot = getModuleQueueSnapshot(moduleId);
    return res.status(200).json(snapshot);
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || "Failed to load queue status" });
  }
});

// (Optional) GET /api/assets/download?path=... — serves local files safely from assets dir
router.get("/download", (req: Request, res: Response) => {
  const p = String(req.query.path || "");
  const base = process.env.ASSETS_DIR || path.join(process.cwd(), "assets");
  const resolved = path.resolve(base, p.replace(/^(\.\.[/\\])+/, ""));
  if (!resolved.startsWith(path.resolve(base))) {
    return res.status(400).send("Invalid path");
  }
  if (!fs.existsSync(resolved)) return res.status(404).send("Not found");
  res.sendFile(resolved);
});

module.exports = router;