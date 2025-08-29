// frontend/src/components/StoryboardActions.tsx
import React, { useState } from "react";
import {
  saveDetailedStoryboard,
  renameStoryboard,
  deleteStoryboard,
  setStoryboardPdfUrl,
} from "@/lib/storyboardService";
import type { StoryboardModule } from "@/types";

type Props = {
  storyboard: StoryboardModule;
  /** If already saved, pass the row id so Rename/Delete/PDF are enabled */
  storyboardId?: string;
  /** Initial title to use for Save/Rename prompts */
  title: string;
  /** Optional project to associate on first save */
  projectId?: string;
  /** Optional model label to store on first save */
  model?: string;
  /** If you already generated a PDF, pass its URL to attach */
  pdfUrl?: string;
  onSaved?: (id: string) => void;
  onDeleted?: () => void;
  onRenamed?: (newTitle: string) => void;
  className?: string;
};

const StoryboardActions: React.FC<Props> = ({
  storyboard,
  storyboardId,
  title,
  projectId,
  model = "gpt-4o",
  pdfUrl,
  onSaved,
  onDeleted,
  onRenamed,
  className,
}) => {
  const [loading, setLoading] = useState<null | "save" | "rename" | "delete" | "pdf">(null);
  const [status, setStatus] = useState<string>("");

  async function handleSave() {
    try {
      setLoading("save");
      setStatus("");
      const id = await saveDetailedStoryboard(title, storyboard, projectId, model);
      onSaved?.(id);
      setStatus("Storyboard saved.");
    } catch (err: any) {
      console.error(err);
      setStatus(`Save failed: ${err?.message || err}`);
      alert(`Save failed: ${err?.message || err}`);
    } finally {
      setLoading(null);
    }
  }

  async function handleRename() {
    if (!storyboardId) return alert("No storyboard selected");
    const newTitle = prompt("Enter new title", title);
    if (!newTitle || !newTitle.trim()) return;
    try {
      setLoading("rename");
      setStatus("");
      await renameStoryboard(storyboardId, newTitle.trim());
      onRenamed?.(newTitle.trim());
      setStatus("Storyboard renamed.");
    } catch (err: any) {
      console.error(err);
      setStatus(`Rename failed: ${err?.message || err}`);
      alert(`Rename failed: ${err?.message || err}`);
    } finally {
      setLoading(null);
    }
  }

  async function handleDelete() {
    if (!storyboardId) return alert("No storyboard selected");
    if (!confirm("Delete this storyboard? This action cannot be undone.")) return;
    try {
      setLoading("delete");
      setStatus("");
      await deleteStoryboard(storyboardId);
      onDeleted?.();
      setStatus("Storyboard deleted.");
    } catch (err: any) {
      console.error(err);
      setStatus(`Delete failed: ${err?.message || err}`);
      alert(`Delete failed: ${err?.message || err}`);
    } finally {
      setLoading(null);
    }
  }

  async function handleSavePdf() {
    if (!storyboardId) return alert("No storyboard selected");
    // Use provided pdfUrl if available; otherwise ask for one
    const url = pdfUrl || prompt("Paste the PDF URL to attach", "");
    if (!url) return;
    try {
      setLoading("pdf");
      setStatus("");
      await setStoryboardPdfUrl(storyboardId, url);
      setStatus("PDF URL saved.");
    } catch (err: any) {
      console.error(err);
      setStatus(`PDF save failed: ${err?.message || err}`);
      alert(`PDF save failed: ${err?.message || err}`);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 mt-4 ${className || ""}`}>
      {/* SAVE */}
      <button
        disabled={!!loading}
        onClick={handleSave}
        className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60"
        title="Save detailed storyboard to your organisation"
      >
        {loading === "save" ? "Saving..." : "Save"}
      </button>

      {/* RENAME */}
      <button
        disabled={!!loading || !storyboardId}
        onClick={handleRename}
        className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-60"
        title="Rename storyboard"
      >
        {loading === "rename" ? "Renaming..." : "Rename"}
      </button>

      {/* DELETE */}
      <button
        disabled={!!loading || !storyboardId}
        onClick={handleDelete}
        className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white disabled:opacity-60"
        title="Delete storyboard"
      >
        {loading === "delete" ? "Deleting..." : "Delete"}
      </button>

      {/* SAVE PDF */}
      <button
        disabled={!!loading || !storyboardId}
        onClick={handleSavePdf}
        className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-60"
        title="Attach/Update PDF URL for this storyboard"
      >
        {loading === "pdf" ? "Saving PDF..." : "Save PDF"}
      </button>

      {/* STATUS */}
      <span className="text-slate-600 text-sm ml-1" role="status" aria-live="polite">
        {status}
      </span>
    </div>
  );
};

export default StoryboardActions;