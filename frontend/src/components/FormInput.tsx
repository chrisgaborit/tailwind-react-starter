// @ts-nocheck
import React from "react";

interface Props {
  label: string;
  name: string;
  value?: string | number;
  onChange: (field: string, value: any) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  required?: boolean;
  autoComplete?: string;
}

export default function FormInput({
  label,
  name,
  value = "",
  onChange,
  placeholder,
  type = "text",
  disabled = false,
  required = false,
  autoComplete,
}: Props) {
  return (
    <div className="w-full">
      <label
        htmlFor={name}
        className="mb-2 block font-semibold text-slate-100 text-base lg:text-lg"
      >
        {label} {required && <span className="text-red-400">*</span>}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={value as any}
        onChange={(e) => onChange(name, e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        required={required}
        className="
          block w-full rounded-2xl
          border border-slate-600 bg-slate-700/80
          px-5 py-4
          text-slate-100 text-lg lg:text-xl
          shadow-sm
          placeholder:text-slate-400
          focus:border-sky-400 focus:ring-2 focus:ring-sky-400
          disabled:opacity-60 disabled:cursor-not-allowed
        "
      />
    </div>
  );
}