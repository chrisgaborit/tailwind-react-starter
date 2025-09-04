// backend/src/routes/pdfRoute.ts
import { Router, type Request, type Response } from "express";
import crypto from "crypto";
import {
  supabaseServer,
  verifyUser,
  getOrgIdForUser,
} from "../services/supabase"; // server-side client (service role) + helpers
import { renderStoryboardAsHTML } from "../services/pdfService";
import { htmlToPdfBuffer } from "../services/pdfRenderer";

const BUCKET = (process.env.SUPABASE_BUCKET || "storyboards").trim();

export const pdfRouter = Router();

/**
 * POST /api/storyboards/:id/pdf
 * Auth: Authorization: Bearer <jwt>
 * Steps:
 *  - verify caller
 *  - ensure storyboard belongs to caller's org
 *  - render HTML -> PDF
 *  - upload to Supabase Storage (public)
 *  - persist pdf_url (+ sha256) on storyboards row
 */
pdfRouter.post("/storyboards/:id/pdf", async (req: Request, res: Response) => {
  try {
    if (!BUCKET) return res.status(500).json({ error: "Storage bucket not configured" });

    // --- Auth ----------------------------------------------------------------
    const auth = req.get("authorization") || "";
    const jwt = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7) : undefined;
    const user = await verifyUser(jwt);
    const orgId = await getOrgIdForUser(user.id);

    // --- Load storyboard (detailed JSON) ------------------------------------
    const { data: sbRow, error: sbErr } = await supabaseServer
      .from("storyboards")
      .select("id, org_id, title, json")
      .eq("id", req.params.id)
      .single();

    if (sbErr) throw sbErr;
    if (!sbRow) return res.status(404).json({ error: "Storyboard not found" });
    if (sbRow.org_id !== orgId) return res.status(403).json({ error: "Forbidden" });
    if (!sbRow.json || typeof sbRow.json !== "object")
      return res.status(400).json({ error: "Storyboard JSON is empty or invalid" });

    // --- Render HTML -> PDF --------------------------------------------------
    const html = renderStoryboardAsHTML(sbRow.json as any);
    const pdfBuffer = await htmlToPdfBuffer(html);
    const sha256 = crypto.createHash("sha256").update(pdfBuffer).digest("hex");

    // --- Upload to Supabase Storage -----------------------------------------
    // path scheme: {org}/{storyboardId}/{timestamp}_{safeTitle}.pdf
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const safeTitle = String(sbRow.title || "storyboard").slice(0, 60).replace(/[^\w\-]+/g, "_");
    const filePath = `${orgId}/${sbRow.id}/${ts}_${safeTitle}.pdf`;

    const { error: upErr } = await supabaseServer.storage
      .from(BUCKET)
      .upload(filePath, pdfBuffer, {
        contentType: "application/pdf",
        cacheControl: "public, max-age=31536000, immutable",
        upsert: true, // safe because filename includes timestamp
      });

    if (upErr) throw upErr;

    const { data: pub } = supabaseServer.storage.from(BUCKET).getPublicUrl(filePath);
    const pdfUrl = pub?.publicUrl || null;

    // --- Persist URL + hash on the row --------------------------------------
    const { error: updErr } = await supabaseServer
      .from("storyboards")
      .update({
        pdf_url: pdfUrl,
        pdf_sha256: sha256,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sbRow.id)
      .eq("org_id", orgId);

    if (updErr) throw updErr;

    return res.status(200).json({ id: sbRow.id, pdf_url: pdfUrl, pdf_sha256: sha256 });
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error("[pdfRoute] Error:", err);
    const msg = err?.message || "Failed to generate PDF";
    const status =
      msg === "Forbidden" ? 403 :
      msg === "Storyboard not found" ? 404 :
      400;
    return res.status(status).json({ error: msg });
  }
});

export default pdfRouter;