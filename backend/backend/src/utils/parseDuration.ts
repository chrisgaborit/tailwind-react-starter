// backend/src/utils/parseDuration.ts

/**
 * Parse loose duration inputs into minutes:
 *  "30" → 30
 *  "30 minutes" / "30 mins" / "30m" → 30
 *  "15–20 minutes" / "15-20" → 20  (use upper bound for planning)
 *  "1 hour" / "2 hrs" / "1h" → 60 / 120
 *  "1.5 hours" → 90
 * Unparseable → 20
 *
 * Always returns a non‑negative integer (minutes).
 */
export function parseDurationMins(input: unknown): number {
  const DEFAULT_MINUTES = 20;

  // Numbers pass through (rounded, clamped ≥ 0)
  if (typeof input === "number" && isFinite(input)) {
    return clampNonNegativeInt(input);
  }

  // Nullish → default
  if (input == null) return DEFAULT_MINUTES;

  // Normalise to a trimmed, lowercase string
  const str = String(input).toLowerCase().trim();
  if (!str) return DEFAULT_MINUTES;

  // Canonicalise punctuation and remove fluff
  const s = str
    .replace(/[，]/g, ",")
    .replace(/[–—]/g, "-") // en/em dashes → hyphen
    .replace(/\b(about|approx\.?|around|~|roughly|target|duration|mins\.)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();

  // 1) Pure integer like "30"
  const pureInt = s.match(/^(\d+)$/);
  if (pureInt) return clampNonNegativeInt(parseInt(pureInt[1], 10));

  // 2) Range (with or without units): "15-20", "15 - 20 minutes"
  const range = s.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
  if (range) {
    const upper = parseFloat(range[2]);
    const isHours = /\b(h|hr|hrs|hour|hours)\b/.test(s);
    const minutes = isHours ? upper * 60 : upper;
    return clampNonNegativeInt(Math.round(minutes));
  }

  // 3) Minutes variants: "30m", "30 min", "30 mins", "30 minute(s)"
  const mins = s.match(/(\d+(?:\.\d+)?)\s*(m|min|mins|minute|minutes)\b/);
  if (mins) return clampNonNegativeInt(Math.round(parseFloat(mins[1])));

  // 4) Hours variants: "1h", "1 hr", "1.5 hours"
  const hours = s.match(/(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours)\b/);
  if (hours) return clampNonNegativeInt(Math.round(parseFloat(hours[1]) * 60));

  // 5) Trailing number fallback: e.g. "duration 25" -> 25
  const trailingNum = s.match(/(\d+(?:\.\d+)?)(?!.*\d)/);
  if (trailingNum) return clampNonNegativeInt(Math.round(parseFloat(trailingNum[1])));

  // Fallback default
  return DEFAULT_MINUTES;
}

function clampNonNegativeInt(n: number): number {
  if (!isFinite(n)) return 0;
  const r = Math.round(n);
  return r < 0 ? 0 : r;
}