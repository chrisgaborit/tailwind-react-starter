// frontend/src/components/CompanyImagesUploader.tsx
// @ts-nocheck
import React, { useRef, useEffect } from "react";
import type { CompanyImage } from "@/types";

/**
 * DEPRECATED: This component is intentionally rendered as null to remove the
 * duplicate "Company Images" uploader at the bottom of the page.
 *
 * We keep the file/export to avoid breaking any existing imports.
 * If you later want to re-enable it, restore the previous implementation.
 */

type Props = {
  images?: CompanyImage[];
  onAdd?: (items: CompanyImage[]) => void;
  onRemove?: (name: string) => void;
  disabled?: boolean;
};

const warnedOnce = { current: false };

const CompanyImagesUploader: React.FC<Props> = () => {
  // Log once in dev so it's obvious why nothing renders
  useEffect(() => {
    if (import.meta.env?.DEV && !warnedOnce.current) {
      // eslint-disable-next-line no-console
      console.info("[CompanyImagesUploader] Deprecated component rendered as null (hidden).");
      warnedOnce.current = true;
    }
  }, []);

  // Render nothing: this removes the bottom uploader from the UI.
  return null;
};

export default CompanyImagesUploader;