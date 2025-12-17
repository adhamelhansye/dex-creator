import { FC, useState, useEffect } from "react";
import { Button } from "./Button";
import FormInput from "./FormInput";
import { Card } from "./Card";
import { post } from "../utils/apiClient";
import { toast } from "react-toastify";
import { useAuth } from "../context/useAuth";
import { useModal } from "../context/ModalContext";
import { DexPreviewProps } from "./DexPreview";

export interface AIFineTuneModalProps {
  isOpen: boolean;
  onClose: () => void;
  element: HTMLElement | null;
  currentTheme: string | null;
  onApplyOverrides: (overrides: string) => void;
  previewProps?: DexPreviewProps;
}

const AIFineTuneModal: FC<AIFineTuneModalProps> = ({
  isOpen,
  onClose,
  element,
  currentTheme: _currentTheme,
  onApplyOverrides,
  previewProps,
}) => {
  const { token: authToken } = useAuth();
  const { openModal } = useModal();
  const token = authToken;
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [htmlStructure, setHtmlStructure] = useState<string>("");
  const [computedStyles, setComputedStyles] = useState<Record<string, string>>(
    {}
  );
  const [elementSelector, setElementSelector] = useState<string>("");

  useEffect(() => {
    if (!isOpen || !element) {
      setPrompt("");
      setHtmlStructure("");
      setComputedStyles({});
      setElementSelector("");
      return;
    }

    const clone = element.cloneNode(true) as HTMLElement;
    const limitDepth = (el: HTMLElement, depth: number = 0): void => {
      if (depth >= 5) {
        el.innerHTML = "";
        return;
      }
      Array.from(el.children).forEach(child => {
        limitDepth(child as HTMLElement, depth + 1);
      });
    };
    limitDepth(clone);
    const html = clone.outerHTML;
    setHtmlStructure(html);

    const styles = window.getComputedStyle(element);
    const styleMap: Record<string, string> = {};
    for (let i = 0; i < styles.length; i++) {
      const prop = styles[i];
      const value = styles.getPropertyValue(prop);
      if (value && prop !== "cssText") {
        styleMap[prop] = value;
      }
    }
    setComputedStyles(styleMap);

    const getSelector = (el: HTMLElement): string => {
      if (el.id) return `#${el.id}`;
      if (el.className) {
        const classes = el.className
          .split(" ")
          .filter(c => c && !c.startsWith("orderly-"))
          .slice(0, 3)
          .join(".");
        if (classes) return `.${classes}`;
      }
      return el.tagName.toLowerCase();
    };
    setElementSelector(getSelector(element));
  }, [isOpen, element]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a description");
      return;
    }

    if (!token) {
      toast.error("Authentication required");
      return;
    }

    if (!element) {
      toast.error("No element selected");
      return;
    }

    setIsGenerating(true);

    try {
      let existingOverrides = "";
      if (_currentTheme) {
        const overrideMatch = _currentTheme.match(
          /\/\*\s*AI Fine-Tune Overrides\s*\*\/\s*([\s\S]*?)(?=\/\*|$)/
        );
        if (overrideMatch && overrideMatch[1]) {
          existingOverrides = overrideMatch[1].trim();
        }
      }
      console.log("existingOverrides", existingOverrides);

      const response = await post<{ overrides: string }>(
        "api/theme/fine-tune",
        {
          prompt: prompt.trim(),
          html: htmlStructure,
          computedStyles,
          elementSelector,
          existingOverrides: existingOverrides || undefined,
        },
        token
      );

      console.log("response", response);
      if (response && response.overrides) {
        let oldTheme = _currentTheme || "";
        if (oldTheme) {
          const overrideMatch = oldTheme.match(
            /\/\*\s*AI Fine-Tune Overrides\s*\*\/\s*([\s\S]*?)(?=\/\*|$)/
          );
          if (overrideMatch) {
            oldTheme = oldTheme
              .replace(
                /\/\*\s*AI Fine-Tune Overrides\s*\*\/\s*[\s\S]*?(?=\/\*|$)/,
                ""
              )
              .trim();
          }
        }

        console.log("previewProps", previewProps);
        if (previewProps) {
          console.log("Opening AIFineTunePreviewModal");
          openModal("aiFineTunePreview", {
            oldTheme,
            newOverrides: response.overrides,
            previewProps,
            onApply: (overrides: string) => {
              onApplyOverrides(overrides);
            },
            onReject: () => {},
          });
        } else {
          onApplyOverrides(response.overrides);
          toast.success("CSS overrides generated successfully!");
          onClose();
        }
      } else {
        toast.error("Failed to generate CSS overrides");
      }
    } catch (error) {
      console.error("Error fine-tuning element:", error);
      if (
        error &&
        typeof error === "object" &&
        "status" in error &&
        error.status === 429
      ) {
        toast.error(
          "Rate limit exceeded. Please wait 30 seconds before trying again."
        );
      } else {
        toast.error("Error generating CSS overrides. Please try again.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] bg-background-dark/95 flex items-center justify-center p-4"
      onClick={e => e.stopPropagation()}
      onKeyDown={e => e.stopPropagation()}
      onKeyUp={e => e.stopPropagation()}
      role="dialog"
      data-higher-modal="true"
    >
      <div className="bg-background-card border border-light/20 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-light/10">
          <h2 className="text-lg font-bold text-gray-200">
            AI Fine-Tune Element
          </h2>
          <Button onClick={onClose} variant="secondary" size="sm" type="button">
            Close
          </Button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <div className="flex flex-col gap-4">
            <p className="text-xs text-gray-400">
              Describe how you want this element and its children to look. The
              AI will generate CSS overrides for the entire HTML structure.
            </p>
            <Card className="p-3" variant="default">
              <div className="flex items-start gap-2">
                <div className="i-mdi:information-outline text-primary-light h-4 w-4 mt-0.5 flex-shrink-0"></div>
                <div>
                  <p className="text-xs text-gray-300 mb-1">
                    <span className="text-primary-light font-medium">
                      Note:
                    </span>{" "}
                    This will generate CSS overrides for the selected element
                    and all its child elements. The changes will be applied as
                    CSS classes or selectors targeting the structure.
                  </p>
                </div>
              </div>
            </Card>
            {elementSelector && (
              <div className="text-xs text-gray-400">
                <span className="font-medium">Element:</span>{" "}
                <code className="bg-background-dark/50 px-1.5 py-0.5 rounded">
                  {elementSelector}
                </code>
              </div>
            )}
            <FormInput
              id="fineTunePrompt"
              label="Description"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="e.g., Make this button bright neon green with rounded corners and a glow effect"
              helpText="Describe the visual changes you want for this element"
              maxLength={200}
              disabled={isGenerating}
            />
          </div>
        </div>
        <div className="flex items-center justify-end p-4 border-t border-light/10">
          <Button
            onClick={handleGenerate}
            isLoading={isGenerating}
            loadingText="Generating..."
            disabled={!prompt.trim() || isGenerating || !element}
            variant="primary"
            size="sm"
            type="button"
          >
            <span className="flex items-center gap-1">
              <div className="i-mdi:magic-wand h-4 w-4"></div>Generate Overrides
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AIFineTuneModal;
