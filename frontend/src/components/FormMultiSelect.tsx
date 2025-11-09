import React from "react";

interface FormMultiSelectProps {
  label: string;
  name: string;
  value: string[];
  onChange: (name: string, value: string[]) => void;
  options: string[];
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  className?: string;
}

const FormMultiSelect: React.FC<FormMultiSelectProps> = ({
  label,
  name,
  value = [],
  onChange,
  options,
  disabled = false,
  required = false,
  placeholder = "Select options...",
  className = "",
}) => {
  const handleOptionChange = (option: string, checked: boolean) => {
    if (checked) {
      onChange(name, [...value, option]);
    } else {
      onChange(name, value.filter((item) => item !== option));
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <label
        htmlFor={name}
        className="block text-slate-100 font-semibold mb-2"
      >
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      
      <div className="space-y-2 max-h-48 overflow-y-auto border border-slate-600 rounded-2xl p-4 bg-slate-700/80">
        {options.map((option) => (
          <label
            key={option}
            className="flex items-center space-x-3 cursor-pointer hover:bg-slate-600/50 p-2 rounded-lg transition-colors"
          >
            <input
              type="checkbox"
              checked={value.includes(option)}
              onChange={(e) => handleOptionChange(option, e.target.checked)}
              disabled={disabled}
              className="
                w-4 h-4
                text-sky-400
                bg-slate-700
                border-slate-500
                rounded
                focus:ring-sky-400
                focus:ring-2
              "
            />
            <span className="text-slate-100 text-sm">{option}</span>
          </label>
        ))}
      </div>
      
      {value.length > 0 && (
        <div className="mt-2">
          <p className="text-slate-300 text-sm">
            Selected: {value.length} option{value.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
};

export default FormMultiSelect;































