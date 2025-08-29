// utils/downloadExactPdf.ts (or inside your component file)

export const downloadExactPdf = async (id: string) => {
  if (!id) throw new Error("No storyboard id provided.");

  // Use your backend base URL if you have one (Vite example shown).
  const base = import.meta.env.VITE_API_BASE || ""; // e.g. "http://localhost:8080"

  const res = await fetch(`${base}/api/storyboard/pdf?id=${encodeURIComponent(id)}`);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`PDF failed: ${res.status} ${text}`);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `storyboard_${id}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
};