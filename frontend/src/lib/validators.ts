// frontend/src/lib/validators.ts
export function countWords(s?: string) {
  if (!s) return 0;
  return String(s).trim().split(/\s+/).filter(Boolean).length;
}

export function validateStoryboardScenes(scenes: any[], { ostLimit = 70 } = {}) {
  const warnings: string[] = [];
  (scenes || []).forEach((s, i) => {
    const title = s?.pageTitle || s?.title || `Screen ${i + 1}`;
    const n = countWords(s?.onScreenText);
    if (n > ostLimit) warnings.push(`Scene ${i + 1} "${title}": OST has ${n} words (> ${ostLimit}).`);
    const a11y = String(s?.accessibilityNotes || "");
    if (!/captions on/i.test(a11y)) warnings.push(`Scene ${i + 1} "${title}": add "Captions ON by default".`);
    if (!/keyboard path/i.test(a11y)) warnings.push(`Scene ${i + 1} "${title}": add keyboard path.`);
    if (!/focus order/i.test(a11y)) warnings.push(`Scene ${i + 1} "${title}": add focus order.`);
  });
  return warnings;
}
