// frontend/src/components/QualityPanel.tsx
import React from "react";

type Issue = {
  sceneIndex?: number;
  kind: string;
  message: string;
  severity: "info" | "warn" | "error";
};

type Props = {
  score: number;
  issues: Issue[];
};

const sevColor = (s: Issue["severity"]) =>
  s === "error" ? "text-red-700 bg-red-50 border-red-200" : s === "warn" ? "text-amber-700 bg-amber-50 border-amber-200" : "text-slate-700 bg-slate-50 border-slate-200";

const QualityPanel: React.FC<Props> = ({ score, issues }) => {
  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div className="font-semibold text-slate-800">Quality Report</div>
        <div className="rounded bg-emerald-100 px-2 py-1 text-sm font-medium text-emerald-700">Score: {score}/100</div>
      </div>
      <div className="max-h-56 overflow-auto p-3">
        {issues.length === 0 ? (
          <div className="text-sm text-slate-600">No issues detected.</div>
        ) : (
          <ul className="space-y-2">
            {issues.map((it, i) => (
              <li key={i} className={`rounded border px-2 py-1 text-sm ${sevColor(it)}`}>
                {it.sceneIndex !== undefined && <span className="mr-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700">p{String(it.sceneIndex + 1).padStart(2, "0")}</span>}
                <strong className="mr-1">{it.kind}:</strong>
                <span>{it.message}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default QualityPanel;