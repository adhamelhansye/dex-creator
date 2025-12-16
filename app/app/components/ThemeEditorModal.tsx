import { FC, useState, ChangeEvent, useEffect } from "react";
import { Button } from "./Button";

export interface ThemeEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: string | null;
  defaultTheme: string;
  onThemeChange: (newTheme: string) => void;
}

const ThemeEditorModal: FC<ThemeEditorModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  defaultTheme,
  onThemeChange,
}) => {
  const [localTheme, setLocalTheme] = useState(currentTheme || defaultTheme);

  useEffect(() => {
    if (isOpen) {
      setLocalTheme(currentTheme || defaultTheme);
    }
  }, [isOpen, currentTheme, defaultTheme]);

  if (!isOpen) return null;

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setLocalTheme(e.target.value);
  };

  const handleApply = () => {
    onThemeChange(localTheme);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-background-dark/95 flex items-center justify-center p-4"
      onClick={e => e.stopPropagation()}
      onKeyDown={e => e.stopPropagation()}
      onKeyUp={e => e.stopPropagation()}
      role="dialog"
      data-higher-modal="true"
    >
      <div className="bg-background-card border border-light/20 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-light/10">
          <h2 className="text-lg font-bold text-gray-200">Edit CSS Theme</h2>
          <Button onClick={onClose} variant="secondary" size="sm" type="button">
            Close
          </Button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <textarea
            value={localTheme}
            onChange={handleChange}
            className="w-full h-full min-h-[400px] bg-black/80 text-xs text-gray-300 font-mono p-3 rounded border border-light/10"
            placeholder="Edit your CSS theme here..."
          />
        </div>
        <div className="flex items-center justify-between p-4 border-t border-light/10 gap-2">
          <div className="flex gap-2">
            <Button
              onClick={() => {
                onThemeChange("");
                onClose();
              }}
              variant="danger"
              size="sm"
              type="button"
            >
              Reset
            </Button>
            <Button
              onClick={() => {
                onThemeChange(defaultTheme);
                onClose();
              }}
              variant="danger"
              size="sm"
              type="button"
            >
              Reset to Default
            </Button>
          </div>
          <Button
            onClick={handleApply}
            variant="primary"
            size="sm"
            type="button"
          >
            Apply Changes
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ThemeEditorModal;
