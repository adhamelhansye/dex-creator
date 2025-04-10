import React, {
  FormEvent,
  ReactNode,
  useState,
  useCallback,
  useMemo,
} from "react";
import { Button } from "./Button";
import FormInput from "./FormInput";

export type FormErrors = Record<string, string | null>;

interface FormProps {
  onSubmit: (e: FormEvent, errors: FormErrors) => void;
  children: ReactNode;
  submitText: string;
  isLoading?: boolean;
  loadingText?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * A form component that manages validation state for child inputs
 * and handles form submission with validation
 */
export default function Form({
  onSubmit,
  children,
  submitText,
  isLoading = false,
  loadingText = "Submitting",
  disabled = false,
  className = "",
}: FormProps) {
  const [errors, setErrors] = useState<FormErrors>({});

  // Function to register validation errors from child components
  // Using useCallback to prevent recreation on every render
  const registerError = useCallback(
    (fieldName: string, error: string | null) => {
      setErrors(prev => ({
        ...prev,
        [fieldName]: error,
      }));
    },
    []
  );

  // Handle form submission
  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();

      // Call the parent onSubmit handler with the current errors
      onSubmit(e, errors);
    },
    [onSubmit, errors]
  );

  // Add the error registration function to each child FormInput
  const childrenWithProps = useMemo(() => {
    return React.Children.map(children, child => {
      // Check if the child is a React element
      if (React.isValidElement(child)) {
        // Check if it's a FormInput by comparing with the imported component
        if (child.type === FormInput) {
          // Safely cast to known component props
          const inputProps = child.props as { id: string };

          // Only clone with onError if we can get the id
          if (inputProps.id) {
            return React.cloneElement(child, {
              onError: (error: string | null) =>
                registerError(inputProps.id, error),
            } as Partial<React.ComponentProps<typeof FormInput>>);
          }
        }
      }
      return child;
    });
  }, [children, registerError]);

  return (
    <form onSubmit={handleSubmit} className={className}>
      {childrenWithProps}

      <Button
        type="submit"
        variant="primary"
        size="md"
        disabled={disabled || isLoading}
        isLoading={isLoading}
        loadingText={loadingText}
      >
        {submitText}
      </Button>
    </form>
  );
}
