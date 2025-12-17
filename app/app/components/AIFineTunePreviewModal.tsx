import { FC, useState } from "react";
import { Button } from "./Button";
import DexPreview, { DexPreviewProps } from "./DexPreview";

export interface AIFineTunePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (overrides: string) => void;
  onReject: () => void;
  oldTheme: string | null;
  newOverrides: string;
  previewProps: DexPreviewProps;
}

const AIFineTunePreviewModal: FC<AIFineTunePreviewModalProps> = ({
  isOpen,
  onClose,
  onApply,
  onReject,
  oldTheme,
  newOverrides,
  previewProps,
}) => {
  console.log("AIFineTunePreviewModal rendered", {
    isOpen,
    oldTheme,
    newOverrides,
    previewProps,
  });
  const [showNew, setShowNew] = useState(true);

  if (!isOpen) return null;

  const newTheme = oldTheme
    ? `${oldTheme}\n\n/* AI Fine-Tune Overrides */\n${newOverrides}`
    : `/* AI Fine-Tune Overrides */\n${newOverrides}`;

  const currentTheme = showNew ? newTheme : oldTheme || "";

  const handleApply = () => {
    onApply(newOverrides);
    onClose();
  };

  const handleReject = () => {
    onReject();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[10000] bg-background-dark/95 flex flex-col"
      onClick={e => e.stopPropagation()}
      onKeyDown={e => e.stopPropagation()}
      onKeyUp={e => e.stopPropagation()}
      role="dialog"
      data-higher-modal="true"
    >
      <div className="flex items-center justify-between p-4 border-b border-light/10">
        <h2 className="text-lg font-bold text-gray-200">
          Preview Fine-Tune Changes
        </h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-background-card border border-light/20 rounded-lg p-1">
            <button
              onClick={() => setShowNew(false)}
              className={`px-3 py-1.5 text-sm rounded transition-colors ${
                !showNew
                  ? "bg-primary text-white"
                  : "text-gray-400 hover:text-gray-200"
              }`}
              type="button"
            >
              Old
            </button>
            <button
              onClick={() => setShowNew(true)}
              className={`px-3 py-1.5 text-sm rounded transition-colors ${
                showNew
                  ? "bg-primary text-white"
                  : "text-gray-400 hover:text-gray-200"
              }`}
              type="button"
            >
              New
            </button>
          </div>
          <Button
            onClick={handleReject}
            variant="ghost"
            size="md"
            type="button"
          >
            Reject
          </Button>
          <Button
            onClick={handleApply}
            variant="primary"
            size="md"
            type="button"
          >
            Accept Changes
          </Button>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden min-h-0">
        <div className="h-full w-full">
          <DexPreview
            {...previewProps}
            customStyles={currentTheme}
            className="h-full w-full"
          />
        </div>
      </div>
    </div>
  );
};

export default AIFineTunePreviewModal;
