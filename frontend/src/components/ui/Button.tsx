// @ts-nocheck
import * as React from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  fullWidth?: boolean;
}

/**
 * Learno-branded Button
 *  - primary   -> Brilliant Blue
 *  - secondary -> Bright Purple outline / subtle fill
 *  - danger    -> Vivid Red
 *  - ghost     -> Neutral, low-emphasis
 *
 * Defaults:
 *   - size: "lg" (bigger by default to match the enlarged UI)
 *   - variant: "primary"
 */
export default function Button({
  variant = "primary",
  size = "lg",
  isLoading = false,
  fullWidth = false,
  className = "",
  children,
  disabled,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-2xl font-semibold transition " +
    "focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-60 disabled:cursor-not-allowed " +
    "select-none";

  // Scaled up across the board
  const sizes: Record<Size, string> = {
    sm: "text-base px-4 py-2.5",
    md: "text-lg px-6 py-3",
    lg: "text-xl px-7 py-4",
  };

  const variants: Record<Variant, string> = {
    primary:
      "bg-[#0387E6] hover:bg-[#0a74c2] text-white shadow-lg shadow-[#0387E6]/20",
    secondary:
      "bg-[#BC57CF]/15 text-[#BC57CF] border border-[#BC57CF]/50 hover:bg-[#BC57CF]/25",
    danger:
      "bg-[#E63946] hover:bg-[#c92c39] text-white shadow-lg shadow-[#E63946]/20",
    ghost:
      "bg-slate-800/50 hover:bg-slate-700/70 text-slate-100 border border-slate-700/70",
  };

  // Loading spinner scales with button size
  const spinnerBySize: Record<Size, string> = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const classes = [
    base,
    sizes[size],
    variants[variant],
    fullWidth ? "w-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      className={classes}
      disabled={disabled || isLoading}
      aria-busy={isLoading ? "true" : "false"}
      {...props}
    >
      {isLoading && (
        <span
          className={`mr-3 inline-block animate-spin rounded-full border-2 border-current/70 border-t-transparent ${spinnerBySize[size]}`}
          aria-hidden
        />
      )}
      <span>{children}</span>
    </button>
  );
}