import type { StoryboardFormData } from "@/types";

// src/components/FormInput.tsx

interface FormInputProps {
  label: string;
  name: keyof StoryboardFormData | "aiModel";
  hint?: string;
  value: string | number | undefined;
  onChange: (fieldName: keyof StoryboardFormData, value: string) => void;
  placeholder?: string;
  disabled: boolean;
  required?: boolean;
}

const FormInput: React.FC<FormInputProps> = ({ label, name, value, onChange, placeholder, disabled, required }) => (
  <div className="flex flex-col">
    <label htmlFor={name} className="mb-2 font-medium text-slate-300">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    <input
      type="text"
      id={name}
      name={name}
      value={value}
      onChange={(e) => onChange(name, e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      className="p-3 bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-shadow duration-200 disabled:opacity-50"
    />
  </div>
);

export default FormInput;
