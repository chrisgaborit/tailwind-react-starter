// components/InternalPage.tsx
import React from "react";

export default function InternalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-100 rounded-xl shadow-md p-6 border border-gray-300 mb-6">
      <div className="bg-purple-200 text-purple-800 text-xs font-bold uppercase tracking-wide px-4 py-2 rounded-t-lg">
        INTERNAL USE ONLY — Not Learner-Facing
      </div>
      <h2 className="text-sm font-semibold text-gray-700 mt-4 mb-2">[INTERNAL] {title}</h2>
      <div className="text-sm text-gray-700 leading-relaxed">
        {children}
      </div>
      <div className="mt-4 text-xs text-gray-500 italic border-t pt-2">
        🔒 Internal Reference — Do Not Share With Learners
      </div>
    </div>
  );
}
