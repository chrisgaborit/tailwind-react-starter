
import React from 'react';

interface TextInputAreaProps {
  id?: string;
  name?: string;
  value: string | string[] | undefined;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

const TextInputArea: React.FC<TextInputAreaProps> = ({
  id,
  name,
  value,
  onChange,
  placeholder,
  rows = 4,
  disabled = false,
  required = false,
  className = "w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
}) => {
  return (
    <textarea
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      disabled={disabled}
      required={required}
      className={className}
      aria-required={required}
    />
  );
};

export default TextInputArea;