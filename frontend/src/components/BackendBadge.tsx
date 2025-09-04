import React from "react";

function classify(url: string | undefined) {
  const u = (url || "").trim();
  if (!u) return { label: "No backend", tone: "bg-red-600", url: "—" };
  if (/localhost|127\.0\.0\.1|::1/i.test(u)) return { label: "Local Backend", tone: "bg-emerald-600", url: u };
  if (/run\.app|cloudrun|googleapis/i.test(u)) return { label: "Cloud Run", tone: "bg-sky-600", url: u };
  return { label: "Remote Backend", tone: "bg-indigo-600", url: u };
}

export default function BackendBadge() {
  const url = import.meta.env.VITE_BACKEND_URL as string | undefined;
  const meta = classify(url);

  return (
    <div className="fixed bottom-3 right-3 z-50">
      <div
        className={`group flex items-center gap-2 px-3 py-1.5 rounded-full text-white text-xs shadow ${meta.tone}`}
        title={meta.url}
      >
        <span>API:</span>
        <span className="font-semibold">{meta.label}</span>
        <span className="opacity-80 hidden sm:inline">•</span>
        <span className="opacity-80 hidden sm:inline max-w-[260px] truncate">{meta.url}</span>
      </div>
    </div>
  );
}