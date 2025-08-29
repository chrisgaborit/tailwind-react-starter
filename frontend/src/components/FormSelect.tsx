import type { StoryboardFormData } from "@/types";

// frontend/src/components/FormSelect.tsx

// ✅ UPDATED: The 'options' prop is now more flexible.
// It can accept a simple array of strings OR our new array of { value, label } objects.
type SelectOption = string | { value: string | undefined; label: string };

interface FormSelectProps {
  label: string;
  name: keyof StoryboardFormData | "aiModel";
  value: string | undefined;
  onChange: (fieldName: keyof StoryboardFormData | "aiModel", value: string | string[]) => void;
  options: SelectOption[];
  disabled?: boolean;
  required?: boolean;
}

const FormSelect: React.FC<FormSelectProps> = ({
  label,
  name,
  value,
  onChange,
  options,
  disabled = false,
  required = false
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(name as any, e.target.value);
  };

  return (
    <div className="w-full">
      <label htmlFor={name} className="block text-sm font-medium text-slate-300 mb-1">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        required={required}
        className="block w-full rounded-md border-0 bg-white/5 py-2.5 px-3 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-sky-500 sm:text-sm sm:leading-6 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {/* ✅ UPDATED: Smart rendering logic */}
        {options.map((option) => {
          // Check if the option is a simple string or a complex object
          const isObject = typeof option === 'object' && option !== null && 'value' in option;
          const optionValue = isObject ? (option as { value: string }).value : option as string;
          const optionLabel = isObject ? (option as { label: string }).label : option as string;
          
          return (
            <option key={optionValue} value={optionValue}>
              {optionLabel}
            </option>
          );
        })}
      </select>
    </div>
  );
};

export default FormSelect;