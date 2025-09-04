// @ts-nocheck
import React from "react";

type Option = string | { label: string; value: string };

interface Props {
  label: string;
  name: string;
  value?: string;
  options: Option[];
  onChange: (field: string, value: any) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

export default function FormSelect({
  label,
  name,
  value = "",
  options,
  onChange,
  placeholder,
  disabled = false,
  required = false,
}: Props) {
  const normalised = options.map((opt) =>
    typeof opt === "string" ? { label: opt, value: opt } : opt
  );

  return (
    <div className="w-full">
      <label
        htmlFor={name}
        className="mb-2 block font-semibold text-slate-100 text-base lg:text-lg"
      >
        {label} {required && <span className="text-red-400">*</span>}
      </label>

      <div className="relative">
        <select
          id={name}
          name={name}
          value={value}
          onChange={(e) => onChange(name, e.target.value)}
          disabled={disabled}
          required={required}
          className="
            block w-full appearance-none rounded-2xl
            border border-slate-600 bg-slate-700/80
            px-5 py-4
            text-slate-100 text-lg lg:text-xl
            shadow-sm
            focus:border-sky-400 focus:ring-2 focus:ring-sky-400
            disabled:opacity-60 disabled:cursor-not-allowed
          "
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {normalised.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Chevron */}
        <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
          <svg
            className="h-6 w-6 text-slate-300"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden
          >
            <path
              fillRule="evenodd"
              d="M10 12a1 1 0 01-.707-.293l-4-4a1 1 0 111.414-1.414L10 9.586l3.293-3.293a1 1 0 111.414 1.414l-4 4A1 1 0 0110 12z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}