import type { StoryboardFormData } from "@/types";

interface FormTextAreaProps {
  label: string;
  name: keyof StoryboardFormData;
  value: string | string[] | undefined;
  onChange: (fieldName: keyof StoryboardFormData, value: string) => void;
  placeholder?: string;
  rows?: number;
  disabled: boolean;
  required?: boolean;
}

const FormTextArea: React.FC<FormTextAreaProps> = ({ label, name, value, onChange, placeholder, rows = 5, disabled, required }) => (
  <div className="flex flex-col">
    <label htmlFor={name} className="mb-2 font-medium text-slate-300">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    <textarea
      id={name}
      name={name}
      value={value}
      onChange={(e) => onChange(name, e.target.value)}
      placeholder={placeholder}
      rows={rows}
      disabled={disabled}
      required={required}
      className="p-3 bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-shadow duration-200 disabled:opacity-50"
    />
  </div>
);

export default FormTextArea;