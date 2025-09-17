{ StoryboardModuleV2 } from "../index";

export type ValidationOptions = {
  minScenes?: number;
  enforceAltText?: boolean;
  maxOstWords?: number; // Brandon Hall: ≤70
};

export function validateStoryboard(
  sb: StoryboardModuleV2,
  opts: ValidationOptions = {}
): { ok: true } | { ok: false; errors: string[]; fixed: StoryboardModuleV2 } {
  const minScenes = opts.minScenes ?? 12;
  const maxOstWords = opts.maxOstWords ?? 70;
  const enforceAlt = opts.enforceAltText ?? true;

  const errors: string[] = [];
  const fixed: StoryboardModuleV2 = JSON.parse(JSON.stringify(sb)); // deep clone

  if (!sb || !Array.isArray(sb.scenes) || sb.scenes.length === 0) {
    errors.push('Storyboard must contain a non-empty "scenes" array.');
    return { ok: false, errors, fixed };
  }
  if (sb.scenes.length < minScenes) {
    errors.push(`Scene count too low for level: got ${sb.scenes.length}, need ≥ ${minScenes}.`);
  }

  fixed.scenes = fixed.scenes.map((s, i) => {
    // OST ≤ 70 words
    const ost = s.onScreenText || "";
    const words = ost.trim() ? ost.trim().split(/\s+/) : [];
    if (words.length > maxOstWords) {
      errors.push(`Scene ${i + 1} "${s.pageTitle || ""}": OST ${words.length} words (> ${maxOstWords}).`);
      s.onScreenText = words.slice(0, maxOstWords).join(" ") + " …";
    }
    // Alt text present
    if (enforceAlt) {
      const title = s.pageTitle || `Screen ${i + 1}`;
      s.visual = s.visual || {};
      if (!s.visual.altText || !s.visual.altText.trim()) {
        s.visual.altText = `Illustration supporting "${title}".`;
        errors.push(`Scene ${i + 1} "${title}": missing altText (injected).`);
      }
    }
    return s;
  });

  return errors.length ? { ok: false, errors, fixed } : { ok: true };
}
