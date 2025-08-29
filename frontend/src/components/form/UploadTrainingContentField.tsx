import React from "react";

type Props = {
  name?: string;
  value?: File[]; // optional if you’re controlling state elsewhere
  onChange?: (files: FileList | null) => void;
  disabled?: boolean;
  accept?: string;
};

const DEFAULT_ACCEPT =
  [
    ".pdf", ".doc", ".docx", ".txt", ".md",
    ".ppt", ".pptx", ".key", ".odp",
    ".xlsx", ".csv",
    ".png", ".jpg", ".jpeg", ".gif", ".svg",
    ".mp4", ".mov", ".mp3", ".wav",
    ".zip"
  ].join(",");

export default function UploadTrainingContentField({
  name = "trainingContent",
  value,
  onChange,
  disabled,
  accept = DEFAULT_ACCEPT,
}: Props) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={name}
        className="block text-sky-300 font-semibold"
      >
        Upload Training Content (Optional)
      </label>

      {/* Keep this minimal per your request (no extra helper block) */}
      <div className="flex items-center gap-3">
        <label
          htmlFor={name}
          className={`inline-flex cursor-pointer items-center rounded-md px-4 py-2 shadow-sm bg-sky-700/70 hover:bg-sky-700 text-white text-sm ${
            disabled ? "opacity-60 cursor-not-allowed" : ""
          }`}
        >
          Choose Files
        </label>
        <input
          id={name}
          name={name}
          type="file"
          className="sr-only"
          multiple
          accept={accept}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.files)}
          aria-label="Upload training content files"
        />
        <span className="text-sm text-slate-300">
          {value && value.length > 0 ? `${value.length} file(s) selected` : "no files selected"}
        </span>
      </div>
    </div>
  );
}
