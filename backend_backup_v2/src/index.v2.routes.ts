// backend/src/index.v2.routes.ts
import { Router } from "express";
import { DirectorAgent } from "./agents_v2/directorAgent";
const router = Router();

router.post("/api/v2/storyboards", async (req, res) => {
  console.log("🧠 RAG DISABLED: Running in pure Agent mode");
  
  try {
    // Pure agent mode - no RAG context injection
    // DirectorAgent receives only: topic, duration, audience, sourceMaterial
    const sb = await new DirectorAgent().buildStoryboard(req.body);
    res.json({ success: true, storyboard: sb });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e?.message || String(e) });
  }
});

export default router;
