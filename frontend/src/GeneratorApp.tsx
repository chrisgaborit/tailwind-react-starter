// @ts-nocheck
import React, { useState, useEffect, useCallback, useMemo } from "react";
import type { StoryboardModule, StoryboardFormData, CompanyImage } from "@/types";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Button from "@/components/ui/Button";
import LoadingSpinner from "@/components/LoadingSpinner";
import StoryboardProgress from "@/components/StoryboardProgress";
import ErrorMessage from "@/components/ErrorMessage";
import StoryboardForm from "@/components/StoryboardForm";
import StoryboardDisplay from "@/components/StoryboardDisplay";
import InputSummary from "@/components/InputSummary";
import ErrorBoundary from "@/components/ErrorBoundary";

import { normaliseStoryboardForUI } from "@/lib/normaliseStoryboard";
import { downloadStoryboardPdf } from "@/lib/api";
import { GENERIC_ERROR_MESSAGE, FORM_ERROR_MESSAGE } from "./constants";

// ✅ Logo (white-on-dark) from /public
const LearnoLogo = "/learno-logo-light.png";

const BASE_URL = ((import.meta as any)?.env?.VITE_BACKEND_BASE || "http://localhost:8080").replace(/\/$/, "");
const STORYBOARD_ENDPOINT = `${BASE_URL}/api/v2/storyboards`;
if (typeof window !== "undefined") {
  console.log("Posting to:", STORYBOARD_ENDPOINT);
}

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

enum AppState {
  FormInput = "form-input",
  Loading = "loading",
  Cancelling = "cancelling",
  Success = "success",
  Error = "error",
}

function getInitialData(): StoryboardFormData {
  try {
    const stored = localStorage.getItem("storyboardFormData");
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        moduleName: parsed.moduleName || "",
        moduleType: parsed.moduleType || "compliance",
        complexityLevel: parsed.complexityLevel || "intermediate",
        tone: parsed.tone || "professional",
        durationMins: parsed.durationMins || 15,
        content: parsed.content || "",
        learningObjectives: parsed.learningObjectives || "",
        targetAudience: parsed.targetAudience || "",
        companyImages: [],
      };
    }
  } catch (e) {
    console.warn("Failed to parse stored form data:", e);
  }
  return {
    moduleName: "",
    moduleType: "compliance",
    complexityLevel: "intermediate",
    tone: "professional",
    durationMins: 15,
    content: "",
    learningObjectives: "",
    targetAudience: "",
    companyImages: [],
    options: { skipAIImages: false },
  };
}

const GeneratorApp: React.FC = () => {
  const [formData, setFormData] = useState<StoryboardFormData>(getInitialData);
  const [storyboardModule, setStoryboardModule] = useState<StoryboardModule | null>(null);
  const [meta, setMeta] = useState<any>(null);
  const [appState, setAppState] = useState<AppState>(AppState.FormInput);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  // lightweight toast (no deps)
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortController) {
        abortController.abort();
      }
    };
  }, [abortController]);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    window.clearTimeout((showToast as any)._t);
    (showToast as any)._t = window.setTimeout(() => setToastMsg(null), 2400);
  }, []);

  useEffect(() => {
    const { companyImages, ...rest } = formData || {};
    localStorage.setItem("storyboardFormData", JSON.stringify(rest));
  }, [formData]);

  const handleFormChange = useCallback(
    (fieldName: keyof StoryboardFormData, value: any) => {
      if (fieldName === "durationMins") {
        const n = Number(Array.isArray(value) ? value[0] : value);
        setFormData((prev) => ({ ...prev, durationMins: isNaN(n) ? undefined : n }));
      } else if (fieldName === "companyImages") {
        setFormData((prev) => ({ ...prev, companyImages: value as CompanyImage[] }));
      } else {
        setFormData((prev) => ({ ...prev, [fieldName]: value }));
      }
      if (error) {
        setError(null);
        if (appState === AppState.Error) setAppState(AppState.FormInput);
      }
    },
    [error, appState]
  );

  const handleFileChange = useCallback((files: FileList | null) => {
    if (!files) return;
    const pdfs = Array.from(files).filter((f) => f.type === "application/pdf");
    setSelectedFiles((prev) => [...prev, ...pdfs]);
  }, []);
  const handleFileRemove = useCallback(
    (fileName: string) => setSelectedFiles((prev) => prev.filter((f) => f.name !== fileName)),
    []
  );
  const handleImageChange = useCallback((files: FileList | null) => {
    if (!files) return;
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"];
    const imgs = Array.from(files).filter((f) => allowed.includes(f.type));
    setImageFiles((prev) => [...prev, ...imgs]);
  }, []);
  const handleImageRemove = useCallback(
    (fileName: string) => setImageFiles((prev) => prev.filter((f) => f.name !== fileName)),
    []
  );

  // Soft validation
  const validateForm = (): boolean => {
    const hasContent = !!formData.content?.trim() || selectedFiles.length > 0;
    const required: (keyof StoryboardFormData)[] = ["moduleName", "moduleType", "complexityLevel", "tone"];
    if (!hasContent || required.some((f) => !formData[f])) {
      setError(FORM_ERROR_MESSAGE);
      setAppState(AppState.Error);
      return false;
    }
    setError(null);
    return true;
  };

  const endpoint = useMemo(() => STORYBOARD_ENDPOINT, []);

  const handleCancelGeneration = useCallback(() => {
    if (abortController) {
      setAppState(AppState.Cancelling);
      abortController.abort();
      setAbortController(null);
      setAppState(AppState.FormInput);
      setError("Generation cancelled by user");
    }
  }, [abortController]);

  // Keyboard shortcut for cancellation (Escape key) - MOVED AFTER handleCancelGeneration definition
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && appState === AppState.Loading) {
        handleCancelGeneration();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [appState, handleCancelGeneration]);

  const handleGenerateStoryboard = useCallback(async () => {
    if (!validateForm()) return;

    setAppState(AppState.Loading);
    setError(null);
    setStoryboardModule(null);
    setMeta(null);

    // Auto-scroll to bottom when generation starts
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);

    const controller = new AbortController();
    setAbortController(controller);

    try {
      const fileSummary = selectedFiles.length
        ? `\n\nUploaded files:\n${selectedFiles.map((file) => `- ${file.name}`).join('\n')}`
        : '';
      const imageSummary = imageFiles.length
        ? `\n\nUploaded images:\n${imageFiles.map((file) => `- ${file.name}`).join('\n')}`
        : '';

      const payload = {
        topic: formData.moduleName || "Untitled Module",
        duration: `${formData.durationMins || 15} minutes`,
        audience: formData.targetAudience || "General staff",
        sourceMaterial: `${formData.content || ""}${fileSummary}${imageSummary}`.trim(),
      };

      console.log("Posting to:", endpoint, payload);

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      if (!res.ok) {
        let msg = res.statusText;
        try {
          const j = await res.json();
          msg = j.error || j.message || msg;
        } catch (e) {
          // ignore JSON parse errors
        }
        throw new Error(`${res.status}: ${msg}`);
      }

      const response = await res.json();
      console.log("Response success:", response.success !== false);

      if (response.success === false) {
        throw new Error(response.error?.message || "Storyboard generation failed");
      }

      const storyboardEnvelope =
        response?.storyboard?.storyboard ??
        response?.storyboard ??
        response?.storyboardModule ??
        response?.data?.storyboardModule ??
        response?.data ??
        response;

      const scenes =
        response?.storyboard?.scenes ??
        response?.storyboard?.data?.scenes ??
        storyboardEnvelope?.scenes ??
        storyboardEnvelope?.data?.scenes ??
        response?.data?.scenes ??
        [];

      const normalized = normalizeToScenes({
        ...storyboardEnvelope,
        scenes,
      });

      if (!normalized.moduleName) {
        normalized.moduleName = formData.moduleName || "Untitled Module";
      }

      if (!normalized || !Array.isArray(normalized.scenes) || normalized.scenes.length === 0) {
        console.error("No scenes found in storyboard:", normalized);
        throw new Error("No storyboard scenes were generated. Please try again with different content.");
      }

      const uiReady = normaliseStoryboardForUI(normalized);
      
      // Final validation before setting state
      if (!uiReady || !Array.isArray(uiReady.scenes) || uiReady.scenes.length === 0) {
        console.error("UI normalization failed:", uiReady);
        throw new Error("Failed to prepare storyboard for display. Please try again.");
      }
      
      const meta =
        response?.storyboard?.meta ||
        response?.meta ||
        response?.data?.meta ||
        storyboardEnvelope?.meta || {
          qaScore: response?.storyboard?.qa_score ?? storyboardEnvelope?.qa_score,
          sourceValid: response?.storyboard?.source_valid ?? storyboardEnvelope?.source_valid,
        };

      setStoryboardModule(uiReady);
      setMeta(meta || null);
      setAppState(AppState.Success);
      showToast("Storyboard generated successfully!");
      console.log("Scenes rendered:", uiReady.scenes.length);
    } catch (err: any) {
      if (err.name === "AbortError") {
        setError("Generation cancelled");
        setAppState(AppState.FormInput);
      } else {
        console.error(
          "🚨 Generation error:",
          err?.response?.status,
          err?.response?.data?.message || err.message,
          err?.response?.data?.details || err
        );
        setError(err.message || GENERIC_ERROR_MESSAGE);
        setAppState(AppState.Error);
      }
    } finally {
      setAbortController(null);
    }
  }, [formData, selectedFiles, imageFiles, endpoint, showToast]);

  const handleStartNew = useCallback(() => {
    setStoryboardModule(null);
    setMeta(null);
    setError(null);
    setAppState(AppState.FormInput);
    setSelectedFiles([]);
    setImageFiles([]);
  }, []);

  const downloadExactServerPdf = useCallback(async () => {
    if (!storyboardModule) return;

    setIsDownloading(true);
    try {
      await downloadStoryboardPdf(storyboardModule);
      showToast("PDF downloaded successfully!");
    } catch (err: any) {
      console.error("Download error:", err);
      showToast("Download failed. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  }, [storyboardModule, showToast]);

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Header logo={LearnoLogo} />
      
      <main className="container mx-auto px-4 py-8">
        {toastMsg && (
          <div className="fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50">
            {toastMsg}
          </div>
        )}

        {appState === AppState.FormInput && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-4">AI Storyboard Generator</h1>
              <p className="text-xl text-slate-300">
                Create interactive eLearning storyboards with AI
              </p>
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

            {error && <ErrorMessage message={error} />}

            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <Button
                onClick={handleGenerateStoryboard}
                variant="primary"
                className="w-full sm:w-auto text-xl px-8 py-4"
                disabled={appState === AppState.Loading}
              >
                {appState === AppState.Loading ? (
                  <>
                    <LoadingSpinner className="mr-2" />
                    Generating...
                  </>
                ) : "Generate Storyboard"}
              </Button>
            </div>
          </div>
        )}

        {/* Success State - Show input summary + storyboard */}
        {appState === AppState.Success && (
          <div className="max-w-6xl mx-auto">
            {/* Input Summary - Always visible after generation */}
            <InputSummary 
              formData={formData}
              selectedFiles={selectedFiles}
              imageFiles={imageFiles}
              className="mb-8"
            />

            {/* Storyboard Results */}
            {storyboardModule ? (
              <>
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-8">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">{storyboardModule.moduleName || "Untitled Storyboard"}</h2>
                    <p className="text-slate-300">
                      {storyboardModule.scenes?.length || 0} scenes • {formData.durationMins || 15} minutes
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      onClick={downloadExactServerPdf}
                      variant="primary"
                      className="w-full sm:w-auto text-xl px-8 py-4"
                      disabled={isDownloading}
                    >
                      {isDownloading ? (
                        <>
                          <LoadingSpinner className="mr-2" />
                          Downloading...
                        </>
                      ) : (
                        "📄 Download PDF"
                      )}
                    </Button>
                    
                    <Button onClick={handleStartNew} variant="ghost" className="w-full sm:w-auto text-xl px-8 py-4">
                      Start New Storyboard
                    </Button>
                  </div>
                </div>

                <ErrorBoundary>
                  <StoryboardDisplay storyboardModule={storyboardModule} />
                </ErrorBoundary>
              </>
            ) : (
              <div className="max-w-2xl mx-auto text-center">
                <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-yellow-400 mb-4">
                    No storyboard scenes generated
                  </h2>
                  <p className="text-slate-300 mb-4">
                    The storyboard generation completed but no scenes were created. This might be due to insufficient content or a processing error.
                  </p>
                  <Button onClick={handleStartNew} variant="primary" className="text-xl px-8 py-4">
                    Try Again
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}


        {appState === AppState.Error && (
          <div className="max-w-2xl mx-auto text-center">
            <ErrorMessage message={error || GENERIC_ERROR_MESSAGE} />
            <Button onClick={handleStartNew} variant="primary" className="mt-6 text-xl px-8 py-4">
              Try Again
            </Button>
          </div>
        )}

        {/* Loading State - Show input summary + progress */}
        {appState === AppState.Loading && (
          <div className="max-w-6xl mx-auto">
            {/* Input Summary - Always visible during and after generation */}
            <InputSummary 
              formData={formData}
              selectedFiles={selectedFiles}
              imageFiles={imageFiles}
              className="mb-8"
            />

            {/* Progress Animation */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold text-blue-400 mb-2">
                  Crafting your interactive storyboard
                </h2>
                <p className="text-slate-300">
                  Our AI is working through each step to create an engaging learning experience
                </p>
              </div>
              
              <StoryboardProgress isGenerating={true} className="mb-6" />
              
              <div className="flex justify-center">
                <Button
                  onClick={handleCancelGeneration}
                  variant="ghost"
                  className="text-lg px-6 py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/50"
                  disabled={appState === AppState.Cancelling}
                >
                  {appState === AppState.Cancelling ? "🛑 Stopping..." : "🛑 Cancel Generation"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default GeneratorApp;
