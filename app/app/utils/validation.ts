import { ValidationFunction } from "../components/FormInput";

/**
 * Creates a required field validator
 * @param fieldName Name of the field to use in error message
 * @returns A validation function
 */
export const required =
  (fieldName: string): ValidationFunction =>
  (value: string) => {
    return value.trim() === "" ? `${fieldName} is required` : null;
  };

/**
 * Creates a URL validator
 * @param allowEmpty Whether empty values should pass validation
 * @returns A validation function
 */
export const validateUrl =
  (allowEmpty = true): ValidationFunction =>
  (value: string) => {
    if (allowEmpty && value.trim() === "") {
      return null;
    }

    try {
      // Check if URL is valid
      new URL(value);
      return null;
    } catch {
      return "Please enter a valid URL";
    }
  };

/**
 * Creates a minimum length validator
 * @param length Minimum required length
 * @param fieldName Name of the field to use in error message
 * @returns A validation function
 */
export const minLength =
  (length: number, fieldName: string): ValidationFunction =>
  (value: string) => {
    return value.trim().length < length
      ? `${fieldName} must be at least ${length} characters`
      : null;
  };

/**
 * Creates a maximum length validator
 * @param length Maximum allowed length
 * @param fieldName Name of the field to use in error message
 * @returns A validation function
 */
export const maxLength =
  (length: number, fieldName: string): ValidationFunction =>
  (value: string) => {
    return value.trim().length > length
      ? `${fieldName} cannot exceed ${length} characters`
      : null;
  };

/**
 * Creates an alphanumeric validator with allowed special characters
 * @param fieldName Name of the field to use in error message
 * @returns A validation function
 */
export const alphanumericWithSpecialChars =
  (fieldName: string): ValidationFunction =>
  (value: string) => {
    const regex = /^[a-zA-Z0-9 .\-_]*$/;
    return !regex.test(value.trim())
      ? `${fieldName} can only contain letters, numbers, spaces, dots, hyphens, and underscores`
      : null;
  };

/**
 * Creates a broker ID validator with length and format constraints
 * @param existingBrokerIds Array of existing broker IDs to check against
 * @returns A validation function for broker IDs
 */
export const validateBrokerId =
  (existingBrokerIds: string[] = []): ValidationFunction =>
  (value: string) => {
    const trimmedValue = value.trim();

    if (trimmedValue.length < 5) {
      return "Broker ID must be at least 5 characters";
    }

    if (trimmedValue.length > 15) {
      return "Broker ID cannot exceed 15 characters";
    }

    if (!/^[a-z0-9_-]+$/.test(trimmedValue)) {
      return "Broker ID must contain only lowercase letters, numbers, hyphens, and underscores";
    }

    if (existingBrokerIds.includes(trimmedValue)) {
      return "This broker ID is already taken. Please choose another one.";
    }

    return null;
  };

/**
 * Combines multiple validators into one
 * @param validators Array of validation functions
 * @returns A validation function that runs all validators and returns the first error
 */
export const composeValidators =
  (...validators: ValidationFunction[]): ValidationFunction =>
  (value: string) => {
    for (const validator of validators) {
      const error = validator(value);
      if (error) return error;
    }
    return null;
  };
