// src/lib/pdf.ts
// Thin wrapper that preserves the legacy import path while delegating
// to the shared API helper.
import { downloadStoryboardPdf as downloadPdfViaApi } from "./api";

export const downloadStoryboardPdf = downloadPdfViaApi;
