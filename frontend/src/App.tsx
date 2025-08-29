// @ts-nocheck
import React, { useState, useEffect, useCallback, useMemo } from "react";
import type { StoryboardModule, StoryboardFormData, CompanyImage } from "@/types";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Button from "@/components/ui/Button";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";
import StoryboardForm from "@/components/StoryboardForm";
import StoryboardDisplay from "@/components/StoryboardDisplay";

import { normaliseStoryboardForUI } from "@/lib/normaliseStoryboard";
import { GENERIC_ERROR_MESSAGE, FORM_ERROR_MESSAGE } from "./constants";

const BACKEND_URL = (import.meta as any)?.env?.VITE_BACKEND_URL || "http://localhost:8080";

/* -------- minimal normalizer for legacy responses -------- */
function normalizeToScenes(sb: any): StoryboardModule {
  if (!sb) return sb;
  if (Array.isArray(sb?.scenes) && sb.scenes.length > 0) return sb;
  if (Array.isArray(sb?.pages) && sb.pages.length > 0) {
    const scenes = sb.pages.map((p: any, i: number) => ({
      sceneNumber: p.pageNumber ?? i + 1,
      pageTitle: p.pageTitle || p.title || `Scene ${i + 1}`,
      screenLayout: p.screenLayout || "",
      templateId: p.templateId || "",
      screenId: p.screenId || `scene-${i + 1}`,
      narrationScript: p.narrationScript || p.voiceover || "",
      onScreenText: p.onScreenText || p.ost || "",
      visualDescription: p.visualDescription || p.visuals || "",
      interactionType: p.interactionType || p.interactivity?.type || "None",
      interactionDescription: p.interactionDescription || "",
      developerNotes: p.developerNotes || p.developerNotesV2 || "",
      accessibilityNotes: p.accessibilityNotes || "",
    }));
    return { ...sb, scenes };
  }
  return sb;
}

function extractStoryboardFromResponse(json: any, fallbackModuleName: string) {
  const candidate =
    json?.storyboard ??
    json?.storyboardModule ??
    json?.data?.storyboardModule ??
    json;

  const minimallyNormalised = normalizeToScenes(candidate);
  if (!minimallyNormalised?.scenes?.length) {
    console.error("Unexpected API payload keys:", Object.keys(json || {}));
    throw new Error("API response did not contain a valid Storyboard Module.");
  }
  if (!minimallyNormalised.moduleName) {
    minimallyNormalised.moduleName = fallbackModuleName || "Untitled Module";
  }
  const fullyNormalised = normaliseStoryboardForUI(minimallyNormalised);
  return {
    storyboard: fullyNormalised,
    meta: json?.meta || json?.data?.meta || {
      storyboardId: json?.id || json?.storyboardId || fullyNormalised?.id || undefined,
      modelUsed: json?.meta?.modelUsed,
      examples: json?.meta?.examples,
      durationMs: json?.meta?.durationMs,
    },
  };
}

/* ============================ Helpers ============================ */
const clampDuration = (mins: number) => Math.min(90, Math.max(1, Math.round(mins)));
const ensureClampedDuration = (n: any): number => {
  const parsed = Number(Array.isArray(n) ? n[0] : n);
  const base = isNaN(parsed) ? 20 : parsed;
  return clampDuration(base);
};

/* ============================ Defaults ============================ */
const defaultInitialFormData: StoryboardFormData = {
  moduleName: "",
  moduleType: "E-Learning",
  complexityLevel: "Level 3",
  tone: "Professional",
  outputLanguage: "English (UK)",
  organisationName: "",
  targetAudience: "",
  durationMins: 20,
  duration: "",
  brandGuidelines: "Adhere to modern, clean design principles.",
  fonts: "",
  colours: "",
  learningOutcomes: "",
  content: "",
  additionalNotes: "",
  preferredMethodology: undefined,
  aiModel: "gpt-4o",
  companyImages: [],
};

const getInitialData = (): StoryboardFormData => {
  try {
    const saved = localStorage.getItem("storyboardFormData");
    if (saved) return { ...defaultInitialFormData, ...JSON.parse(saved) };
  } catch {}
  return defaultInitialFormData;
};

enum AppState { FormInput, Loading, Success, Error }

const App: React.FC = () => {
  const [formData, setFormData] = useState<StoryboardFormData>(getInitialData);
  const [storyboardModule, setStoryboardModule] = useState<StoryboardModule | null>(null);
  const [meta, setMeta] = useState<any>(null);
  const [appState, setAppState] = useState<AppState>(AppState.FormInput);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  // lightweight toast (no deps)
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    window.clearTimeout((showToast as any)._t);
    (showToast as any)._t = window.setTimeout(() => setToastMsg(null), 2400);
  }, []);

  useEffect(() => {
    const { companyImages, ...rest } = formData || {};
    localStorage.setItem("storyboardFormData", JSON.stringify(rest));
  }, [formData]);

  const handleFormChange = useCallback((fieldName: keyof StoryboardFormData, value: any) => {
    if (fieldName === "durationMins") {
      const n = Number(Array.isArray(value) ? value[0] : value);
      setFormData(prev => ({ ...prev, durationMins: isNaN(n) ? undefined : n }));
    } else if (fieldName === "companyImages") {
      setFormData(prev => ({ ...prev, companyImages: value as CompanyImage[] }));
    } else {
      setFormData(prev => ({ ...prev, [fieldName]: value }));
    }
    if (error) {
      setError(null);
      if (appState === AppState.Error) setAppState(AppState.FormInput);
    }
  }, [error, appState]);

  const handleFileChange = useCallback((files: FileList | null) => {
    if (!files) return;
    const pdfs = Array.from(files).filter(f => f.type === "application/pdf");
    setSelectedFiles(prev => [...prev, ...pdfs]);
  }, []);
  const handleFileRemove = useCallback((fileName: string) => setSelectedFiles(prev => prev.filter(f => f.name !== fileName)), []);
  const handleImageChange = useCallback((files: FileList | null) => {
    if (!files) return;
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"];
    const imgs = Array.from(files).filter(f => allowed.includes(f.type));
    setImageFiles(prev => [...prev, ...imgs]);
  }, []);
  const handleImageRemove = useCallback((fileName: string) => setImageFiles(prev => prev.filter(f => f.name !== fileName)), []);

  // Soft validation: no hard fail for duration — we clamp later and toast
  const validateForm = (): boolean => {
    const hasContent = !!formData.content?.trim() || selectedFiles.length > 0;
    const required: (keyof StoryboardFormData)[] = ["moduleName", "moduleType", "complexityLevel", "tone"];
    if (!hasContent || required.some(f => !formData[f])) {
      setError(FORM_ERROR_MESSAGE);
      setAppState(AppState.Error);
      return false;
    }
    // Duration handled by auto-clamp; never block on range
    setError(null);
    return true;
  };

  const endpoint = useMemo(
    () => (selectedFiles.length > 0 || imageFiles.length > 0 ? "/api/v1/generate-from-files" : "/api/v1/generate-from-text"),
    [selectedFiles.length, imageFiles.length]
  );

  const handleGenerateStoryboard = useCallback(async () => {
    if (!validateForm()) return;

    setAppState(AppState.Loading);
    setError(null);
    setStoryboardModule(null);
    setMeta(null);

    try {
      // Clamp duration just-in-time before send; toast if we adjusted
      const original = formData.durationMins;
      const clamped = ensureClampedDuration(
        typeof original === "number" ? original : 20
      );
      if (typeof original === "number" && clamped !== original) {
        showToast(`Duration adjusted to ${clamped} mins (allowed range 1–90).`);
      } else if (typeof original !== "number") {
        showToast(`Duration set to ${clamped} mins.`);
      }

      // Update local state so UI reflects the adjusted value post-submit
      setFormData(prev => ({ ...prev, durationMins: clamped }));

      const payloadFormData: StoryboardFormData = {
        ...formData,
        durationMins: clamped,
        duration: formData.duration || undefined,
        companyImages: formData.companyImages?.length ? formData.companyImages : undefined,
      };

      let response: Response;
      if (endpoint.includes("files")) {
        const fd = new FormData();
        fd.append("formData", JSON.stringify(payloadFormData));
        selectedFiles.forEach(f => fd.append("files", f, f.name));
        imageFiles.forEach(img => fd.append("companyImages", img, img.name));
        response = await fetch(`${BACKEND_URL}${endpoint}`, { method: "POST", body: fd });
      } else {
        response = await fetch(`${BACKEND_URL}${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ formData: payloadFormData }),
        });
      }

      const raw = await response.text();
      if (!response.ok) throw new Error(raw || `Request failed with status ${response.status}`);

      let json: any;
      try { json = JSON.parse(raw); } catch { throw new Error(`Non-JSON response from server:\n${raw.slice(0, 400)}`); }

      const { storyboard, meta } = extractStoryboardFromResponse(json, formData.moduleName || "Untitled Module");
      setStoryboardModule(storyboard);
      try { localStorage.setItem("lastStoryboard", JSON.stringify(storyboard)); } catch {}
      setMeta(meta || null);
      setAppState(AppState.Success);
    } catch (err) {
      console.error("Generation error:", err);
      setError(err instanceof Error ? err.message : GENERIC_ERROR_MESSAGE);
      setAppState(AppState.Error);
    }
  }, [formData, selectedFiles, imageFiles, endpoint, showToast]);

  const handleStartNew = useCallback(() => {
    setFormData(defaultInitialFormData);
    setStoryboardModule(null);
    setSelectedFiles([]);
    setImageFiles([]);
    setError(null);
    setMeta(null);
    setAppState(AppState.FormInput);
  }, []);

  /* ----------------- Exact PDF (html2pdf, on-screen) ----------------- */
  const downloadExactOnScreenPdf = useCallback(async () => {
    if (!storyboardModule) return alert("Cannot download PDF: storyboard data is not available.");

    setIsDownloading(true);
    setError(null);

    try {
      const root = document.getElementById("storyboard-print-root");
      if (!root) throw new Error("Cannot find storyboard content on the page.");

      const html2pdf = (await import("html2pdf.js")).default;

      // wait for fonts/images to settle
      if ("fonts" in document) {
        try { await (document as any).fonts.ready; } catch {}
      }
      await new Promise((r) => setTimeout(r, 100));

      const safeFilename = (storyboardModule.moduleName || "export")
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase();

      const opt: any = {
        margin: 16, // pt
        filename: `storyboard_${safeFilename}_exact.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          windowWidth: root.scrollWidth,
        },
        jsPDF: { unit: "pt", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["css", "legacy"] }, // uses .pdf-avoid-break / .pdf-pagebreak
      };

      const worker = html2pdf().set(opt).from(root);

      // render to PDF (no save yet)
      await worker.toPdf();
      const pdf: any = await (worker as any).get("pdf");

      // footer page numbers
      const total = pdf.internal.getNumberOfPages();
      const size = pdf.internal.pageSize;
      for (let i = 1; i <= total; i++) {
        pdf.setPage(i);
        pdf.setFontSize(9);
        const label = `Page ${i} of ${total}`;
        const w = pdf.getTextWidth(label);
        pdf.text(label, size.getWidth() - 16 - w, size.getHeight() - 12);
      }

      pdf.save(opt.filename);
    } catch (err) {
      console.error("Exact PDF export error:", err);
      setError(err instanceof Error ? err.message : "Could not generate exact on-screen PDF.");
    } finally {
      setIsDownloading(false);
    }
  }, [storyboardModule]);

  /* ----------------- Compact PDF (backend-rendered) ----------------- */
  async function fetchPdfAsBlob(url: string, init?: RequestInit) {
    const res = await fetch(url, init);
    if (!res.ok) {
      let msg = res.statusText;
      try { const j = await res.json(); msg = j.message || msg; } catch { msg = await res.text(); }
      throw new Error(msg || `Request failed: ${res.status}`);
    }
    return res.blob();
  }

  const downloadCompactPdf = useCallback(async () => {
    if (!storyboardModule) return alert("Cannot download PDF: storyboard data is not available.");
    setIsDownloading(true);
    setError(null);
    try {
      const pdfBlob = await fetchPdfAsBlob(`${BACKEND_URL}/api/v1/generate-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(storyboardModule),
      });
      const blobUrl = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      const safeFilename = (storyboardModule.moduleName || "export").replace(/[^a-z0-9]/gi, "_").toLowerCase();
      a.download = `storyboard_${safeFilename}_compact.pdf`;
      a.href = blobUrl;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Compact PDF download error:", err);
      setError(err instanceof Error ? err.message : "Could not download compact PDF.");
    } finally {
      setIsDownloading(false);
    }
  }, [storyboardModule]);

  /* ----------------- Exact PDF (backend-rendered alias) ------------- */
  const downloadExactServerPdf = useCallback(async () => {
    if (!storyboardModule) return alert("Cannot download PDF: storyboard data is not available.");
    setIsDownloading(true);
    setError(null);
    try {
      const pdfBlob = await fetchPdfAsBlob(`${BACKEND_URL}/api/storyboard/pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(storyboardModule),
      });
      const blobUrl = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      const safeFilename = (storyboardModule.moduleName || "export").replace(/[^a-z0-9]/gi, "_").toLowerCase();
      a.download = `storyboard_${safeFilename}_exact-server.pdf`;
      a.href = blobUrl;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Exact (server) PDF download error:", err);
      setError(err instanceof Error ? err.message : "Could not download exact server PDF.");
    } finally {
      setIsDownloading(false);
    }
  }, [storyboardModule]);

  const dismissError = () => {
    setError(null);
    if (appState === AppState.Error) setAppState(AppState.FormInput);
  };

  const canGenerate = appState !== AppState.Loading;

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100">
      <Header />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        {/* Toast */}
        {toastMsg && (
          <div
            role="status"
            aria-live="polite"
            className="fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-lg bg-slate-900/90 px-4 py-2 text-sm text-slate-100 shadow-2xl border border-slate-700"
            data-html2canvas-ignore="true"
          >
            {toastMsg}
          </div>
        )}

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-sky-300 tracking-tight sm:text-5xl">
              eLearning Storyboard Generator
            </h1>
            <p className="mt-3 text-lg text-slate-300">Crafting eLearning experiences with AI</p>
          </div>

          <StoryboardForm
            formData={formData}
            onFormChange={handleFormChange}
            disabled={appState === AppState.Loading}
            files={selectedFiles}
            onFileChange={handleFileChange}
            onFileRemove={handleFileRemove}
            imageFiles={imageFiles}
            onImageChange={handleImageChange}
            onImageRemove={handleImageRemove}
          />

          <section aria-live="polite" className="my-8 text-center flex justify-center items-center gap-4" data-html2canvas-ignore="true">
            {storyboardModule && (
              <Button onClick={handleStartNew} variant="ghost" className="w-full sm:w-auto">
                Start New Storyboard
              </Button>
            )}
            <Button
              onClick={handleGenerateStoryboard}
              isLoading={appState === AppState.Loading}
              disabled={!canGenerate}
              className="w-full sm:w-auto text-lg px-8 py-4"
            >
              {appState === AppState.Loading ? "Generating..." : storyboardModule ? "Regenerate Storyboard" : "Generate Storyboard"}
            </Button>
          </section>

          {appState === AppState.Loading && <LoadingSpinner />}
          {error && <ErrorMessage message={error} onDismiss={dismissError} />}

          {appState === AppState.Success && storyboardModule && (
            <section id="storyboard-print-root" aria-labelledby="storyboard-output-title">
              <h2 id="storyboard-output-title" className="sr-only">Generated Storyboard Output</h2>

              <p className="my-4 p-4 bg-sky-800 text-sky-100 rounded-md text-center">
                Storyboard generated successfully. You can now download the document.
              </p>

              {meta && (
                <div className="text-xs text-slate-400 text-center mb-2">
                  {meta.modelUsed ? <>Model: <b>{meta.modelUsed}</b> · </> : null}
                  {typeof meta.examples === "number" ? <>Examples: {meta.examples} · </> : null}
                  {typeof meta.durationMs === "number" ? <>Time: {meta.durationMs} ms</> : null}
                </div>
              )}

              <div className="my-6 flex flex-col sm:flex-row gap-3 justify-center" data-html2canvas-ignore="true">
                <Button
                  onClick={downloadExactOnScreenPdf}
                  variant="primary"
                  className="w-full sm:w-auto text-md px-6 py-3"
                  isLoading={isDownloading}
                  disabled={isDownloading}
                >
                  {isDownloading ? "Preparing PDF..." : "Download Exact On-Screen PDF"}
                </Button>

                <Button
                  onClick={downloadExactServerPdf}
                  variant="secondary"
                  className="w-full sm:w-auto text-md px-6 py-3"
                  disabled={isDownloading}
                >
                  Download Exact (Server) PDF
                </Button>

                <Button
                  onClick={downloadCompactPdf}
                  variant="ghost"
                  className="w-full sm:w-auto text-md px-6 py-3"
                  disabled={isDownloading}
                >
                  Download Compact PDF
                </Button>
              </div>

              <StoryboardDisplay storyboardModule={storyboardModule} />
            </section>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default App;