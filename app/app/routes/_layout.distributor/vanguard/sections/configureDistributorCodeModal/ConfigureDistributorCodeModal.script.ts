import { useCallback, useEffect, useMemo, useState } from "react";
import { useVerifyDistributorCode } from "../../hooks/useVanguard";
import type { ConfigureDistributorCodeModalUIProps } from "./ConfigureDistributorCodeModal.ui";
import { getDistributorUrl } from "../../utils";

export interface ConfigureDistributorCodeModalProps {
  open: boolean;
  onClose: () => void;
  currentCode: string;
  onSave: (code: string) => Promise<void>;
}

export const useConfigureDistributorCodeModalScript = (
  props: ConfigureDistributorCodeModalProps
): ConfigureDistributorCodeModalUIProps => {
  const { open, onClose, currentCode, onSave } = props;

  const [code, setCode] = useState(currentCode);
  const [validationCode, setValidationCode] = useState<string | null>(null);
  const [frontendError, setFrontendError] = useState<string | null>(null);

  const { exists, isLoading } = useVerifyDistributorCode(validationCode);

  useEffect(() => {
    if (!open) {
      return;
    }
    setCode(currentCode);
    setValidationCode(null);
    setFrontendError(null);
  }, [open, currentCode]);

  const validateFrontend = useCallback((value: string) => {
    if (!/^[a-zA-Z0-9]*$/.test(value)) {
      return "Please only input alphanumeric characters.";
    }
    if (value.length < 4 || value.length > 10) {
      return "Distributor code must be 4-10 characters long.";
    }
    return null;
  }, []);

  const handleBlur = useCallback(() => {
    if (code === currentCode) {
      return;
    }

    const error = validateFrontend(code);
    setFrontendError(error);

    if (!error) {
      setValidationCode(code);
    } else {
      setValidationCode(null);
    }
  }, [code, currentCode, validateFrontend]);

  const handleChange = useCallback((value: string) => {
    setCode(value);
    setFrontendError(null);
    setValidationCode(null);
  }, []);

  const isCodeAvailable = !isLoading && validationCode === code && !exists;
  const isBackendError = !isLoading && validationCode === code && !!exists;

  const hasError = !!frontendError || isBackendError;
  const errorMessage =
    frontendError ||
    (isBackendError ? "This distributor code is not available." : null);

  const isValid = !hasError && isCodeAvailable && code !== currentCode;

  const handleConfirm = useCallback(async () => {
    if (!isValid) {
      return;
    }
    await onSave(code);
    onClose();
  }, [code, isValid, onClose, onSave]);

  const urlPreviewText = useMemo(() => {
    if (hasError) {
      return "Invalid";
    }
    if (isBackendError) {
      return "Not available";
    }
    if (frontendError) {
      return "Invalid";
    }
    if (isLoading && validationCode) {
      return "Checking availability...";
    }
    return getDistributorUrl(code);
  }, [
    code,
    frontendError,
    hasError,
    isBackendError,
    isLoading,
    validationCode,
  ]);

  const isUrlInvalid =
    hasError || urlPreviewText === "Checking availability...";

  const showChecking = !!validationCode;

  return {
    open,
    onClose,
    onConfirm: handleConfirm,
    code,
    onCodeChange: handleChange,
    onCodeBlur: handleBlur,
    hasError,
    errorMessage,
    isLoading,
    showChecking,
    urlPreviewText,
    isUrlInvalid,
    isValid,
  };
};
