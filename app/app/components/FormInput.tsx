import { useState, ChangeEvent, FocusEvent, ReactNode, useEffect } from "react";

export type ValidationFunction = (value: string) => string | null;

export interface FormInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
  helpText?: string | ReactNode;
  className?: string;
  required?: boolean;
  validator?: ValidationFunction;
  minLength?: number;
  maxLength?: number;
  onError?: (error: string | null) => void;
}

export default function FormInput({
  id,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  helpText,
  className = "",
  required = false,
  validator,
  minLength,
  maxLength,
  onError,
}: FormInputProps) {
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  // Notify parent form about validation errors when they change
  useEffect(() => {
    if (onError) {
      onError(error);
    }
  }, [error, onError]);

  const validateInput = (value: string): string | null => {
    // Check required first
    if (required && value.trim() === "") {
      return `${label} is required`;
    }

    // Check min length
    if (minLength && value.trim().length < minLength) {
      return `${label} must be at least ${minLength} characters`;
    }

    // Check max length
    if (maxLength && value.trim().length > maxLength) {
      return `${label} cannot exceed ${maxLength} characters`;
    }

    // Run custom validator if provided
    if (validator) {
      return validator(value);
    }

    return null;
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    setTouched(true);
    const validationError = validateInput(e.target.value);
    setError(validationError);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e);

    // If field has been touched, validate on change too
    if (touched) {
      const validationError = validateInput(e.target.value);
      setError(validationError);
    }
  };

  return (
    <div className={`mb-4 ${className}`}>
      <label htmlFor={id} className="block text-sm font-medium mb-1 md:mb-2">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>

      <input
        id={id}
        type={type}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={`w-full px-3 md:px-4 py-2 bg-dark/50 border ${
          error ? "border-red-500/50" : "border-light/10"
        } rounded-lg focus:ring-1 focus:ring-primary focus:border-primary text-sm md:text-base`}
        minLength={minLength}
        maxLength={maxLength}
        required={required}
      />

      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}

      {helpText && !error && (
        <p className="mt-1 text-xs text-gray-400">{helpText}</p>
      )}
    </div>
  );
}
