import React from "react";
import { cn } from "../utils";
import { CloseIcon } from "../icons";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  onOk?: () => void | Promise<void>;
  onCancel?: () => void;
  okText?: string;
  cancelText?: string;
  confirmDisable?: boolean;
  footer?: React.ReactNode;
  contentClassName?: string;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onOpenChange,
  title,
  children,
  onOk,
  onCancel,
  okText = "Confirm",
  cancelText = "Cancel",
  confirmDisable = false,
  footer,
  contentClassName,
}) => {
  if (!open) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onOpenChange(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div
        className={cn(
          "bg-purple-darker rounded-xl shadow-xl max-h-[90vh] overflow-auto mx-4",
          contentClassName || "w-full max-w-md"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-base-contrast-12">
          <h2 className="text-lg font-semibold text-base-contrast">{title}</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="text-base-contrast-54 hover:text-base-contrast transition-colors"
            aria-label="Close"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4">{children}</div>

        {/* Footer */}
        {footer !== null && (
          <div className="flex justify-end gap-[10px] px-6 pb-4">
            {footer ?? (
              <>
                {onCancel && (
                  <button
                    onClick={onCancel}
                    className="flex-1 h-[40px] px-[20px] rounded-full text-xs font-semibold border border-base-contrast-12 text-base-contrast-54 hover:text-base-contrast hover:border-base-contrast transition-colors inline-flex items-center justify-center"
                  >
                    {cancelText}
                  </button>
                )}
                {onOk && (
                  <button
                    onClick={onOk}
                    disabled={confirmDisable}
                    className={cn(
                      "flex-1 h-[40px] px-[20px] rounded-full text-xs font-semibold inline-flex items-center justify-center transition-colors",
                      confirmDisable
                        ? "bg-purple-light/20 text-base-contrast-36 cursor-not-allowed pointer-events-none"
                        : "bg-purple-light text-white hover:bg-purple-light/90"
                    )}
                  >
                    {okText}
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfirmDialog;
