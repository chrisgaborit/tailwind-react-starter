// src/components/ui/Button.tsx
import React from "react";

type Variant = "primary" | "secondary" | "ghost";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  isLoading?: boolean;
  className?: string;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-sky-600 text-white hover:bg-sky-700 focus:ring-sky-500 disabled:bg-sky-600/60",
  secondary:
    "bg-slate-200 text-slate-900 hover:bg-slate-300 focus:ring-slate-400 disabled:bg-slate-200/60",
  ghost:
    "bg-transparent text-slate-200 hover:bg-slate-800/50 focus:ring-slate-500 disabled:opacity-60",
};

const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  isLoading = false,
  className = "",
  children,
  disabled,
  ...rest
}) => {
  const base =
    "inline-flex items-center justify-center rounded-xl px-4 py-2 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed";
  const style = VARIANT_CLASSES[variant];

  return (
    <button
      className={`${base} ${style} ${className}`}
      disabled={disabled || isLoading}
      {...rest}
    >
      {isLoading && (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="mr-2 h-5 w-5 animate-spin">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" className="opacity-25" />
          <path d="M22 12a10 10 0 0 1-10 10" className="opacity-75" fill="currentColor" />
        </svg>
      )}
      <span>{children}</span>
    </button>
  );
};

export default Button;
