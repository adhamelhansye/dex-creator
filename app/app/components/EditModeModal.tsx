import { FC, useState, useRef, useEffect, useCallback } from "react";
import DexPreview, { DexPreviewProps } from "./DexPreview";
import CSSVariableInspector from "./CSSVariableInspector";
import { parseCSSVariables, generateThemeCSS } from "../utils/cssParser";
import { Button } from "./Button";
import { useModal } from "../context/ModalContext";

export interface EditModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  previewProps: DexPreviewProps;
  currentTheme: string | null;
  defaultTheme: string;
  onThemeChange: (newTheme: string) => void;
  viewMode: "desktop" | "mobile";
  isGeneratingTheme?: boolean;
  onGenerateTheme?: (prompt: string) => void;
  updateCssColor?: (variableName: string, newColorHex: string) => void;
  updateCssValue?: (variableName: string, newValue: string) => void;
  tradingViewColorConfig?: string | null;
  setTradingViewColorConfig?: (config: string | null) => void;
}

const EditModeModal: FC<EditModeModalProps> = ({
  isOpen,
  onClose,
  previewProps,
  currentTheme,
  defaultTheme,
  onThemeChange,
  viewMode,
  isGeneratingTheme = false,
  onGenerateTheme,
  updateCssColor,
  updateCssValue,
  tradingViewColorConfig,
  setTradingViewColorConfig,
}) => {
  const { openModal } = useModal();
  const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(
    null
  );
  const [selectedElementPath, setSelectedElementPath] = useState<HTMLElement[]>(
    []
  );
  const [originalClickedElement, setOriginalClickedElement] =
    useState<HTMLElement | null>(null);
  const [isCtrlHeld, setIsCtrlHeld] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const originalMatchMediaRef = useRef<typeof window.matchMedia | null>(null);

  const handleVariableChange = useCallback(
    (variableName: string, newValue: string) => {
      const baseTheme = currentTheme || defaultTheme;
      const cssVariables = parseCSSVariables(baseTheme);
      cssVariables[variableName] = newValue;
      const newTheme = generateThemeCSS(cssVariables);
      onThemeChange(newTheme);
    },
    [currentTheme, defaultTheme, onThemeChange]
  );

  useEffect(() => {
    if (viewMode === "mobile" && isOpen) {
      const originalMatchMedia = window.matchMedia.bind(window);
      originalMatchMediaRef.current = originalMatchMedia;
      window.matchMedia = (query: string) => {
        if (query === "(max-width: 768px)") {
          return {
            matches: true,
            media: query,
            onchange: null,
            addListener: () => {},
            removeListener: () => {},
            addEventListener: () => {},
            removeEventListener: () => {},
            dispatchEvent: () => true,
          } as MediaQueryList;
        }
        return originalMatchMedia(query);
      };
    } else if (originalMatchMediaRef.current) {
      window.matchMedia = originalMatchMediaRef.current;
      originalMatchMediaRef.current = null;
    }

    return () => {
      if (originalMatchMediaRef.current) {
        window.matchMedia = originalMatchMediaRef.current;
        originalMatchMediaRef.current = null;
      }
    };
  }, [viewMode, isOpen]);

  useEffect(() => {
    if (!selectedElement) {
      return;
    }

    const rect = selectedElement.getBoundingClientRect();

    const highlight = document.createElement("div");
    highlight.style.position = "fixed";
    highlight.style.left = `${rect.left}px`;
    highlight.style.top = `${rect.top}px`;
    highlight.style.width = `${rect.width}px`;
    highlight.style.height = `${rect.height}px`;
    highlight.style.pointerEvents = "none";
    highlight.style.zIndex = "10000";
    highlight.style.border = "2px solid #3b82f6";
    highlight.style.backgroundColor = "rgba(59, 130, 246, 0.1)";
    highlight.style.boxSizing = "border-box";
    highlight.setAttribute("data-element-highlight", "selected");
    document.body.appendChild(highlight);

    const updateHighlight = () => {
      const newRect = selectedElement!.getBoundingClientRect();
      highlight.style.left = `${newRect.left}px`;
      highlight.style.top = `${newRect.top}px`;
      highlight.style.width = `${newRect.width}px`;
      highlight.style.height = `${newRect.height}px`;
    };

    window.addEventListener("scroll", updateHighlight, true);
    window.addEventListener("resize", updateHighlight);

    return () => {
      document
        .querySelectorAll("[data-element-highlight]")
        .forEach(el => el.remove());
      window.removeEventListener("scroll", updateHighlight, true);
      window.removeEventListener("resize", updateHighlight);
    };
  }, [selectedElement]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedElement(null);
      setSelectedElementPath([]);
      setOriginalClickedElement(null);
      setIsCtrlHeld(false);
      return;
    }

    const isWithinHigherModal = (element: HTMLElement | null): boolean => {
      if (!element) return false;
      return !!element.closest('[data-higher-modal="true"]');
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        isWithinHigherModal(target) ||
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA"
      ) {
        return;
      }
      if (e.key === "Control" || e.key === "Meta") {
        setIsCtrlHeld(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        isWithinHigherModal(target) ||
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA"
      ) {
        return;
      }
      if (e.key === "Control" || e.key === "Meta") {
        setIsCtrlHeld(false);
      }
    };

    const handleSubmit = (e: Event) => {
      const target = e.target as HTMLElement;
      if (isWithinHigherModal(target)) {
        return;
      }
      if (modalRef.current && modalRef.current.contains(target)) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      }
    };

    const handleButtonClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      if (target.closest("[data-modal-header-button]")) {
        return;
      }

      if (isWithinHigherModal(target)) {
        return;
      }
      if (e.ctrlKey || e.metaKey) {
        return;
      }

      if (modalRef.current && modalRef.current.contains(target)) {
        const button = target.closest("button");
        if (button && button.type === "submit") {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
        }
      }
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      if (target.closest("[data-modal-header-button]")) {
        return;
      }

      if (isWithinHigherModal(target)) {
        return;
      }

      const isCtrlHeld = e.ctrlKey || e.metaKey;

      if (!isCtrlHeld) {
        return;
      }

      if (!target || !previewRef.current) {
        return;
      }

      if (previewRef.current.contains(target)) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        const clickableElements = [
          "button",
          "a",
          "input",
          "select",
          "textarea",
        ];
        const isClickable =
          clickableElements.includes(target.tagName.toLowerCase()) ||
          target.closest("button, a, input, select, textarea");

        const elementToSelect = isClickable
          ? (target.closest(
              "button, a, input, select, textarea"
            ) as HTMLElement) || target
          : target;

        const path: HTMLElement[] = [];
        let current: HTMLElement | null = elementToSelect;
        const MAX_PATH_LENGTH = 5;

        while (current && path.length < MAX_PATH_LENGTH) {
          if (
            current === document.body ||
            current.hasAttribute("data-preview-container") ||
            current.classList.contains("orderly-app-container")
          ) {
            break;
          }
          path.push(current);
          current = current.parentElement;
        }

        const limitedPath = path.slice(0, MAX_PATH_LENGTH);

        const middleIndex = Math.floor((limitedPath.length - 1) / 2);
        const defaultSelectedElement =
          limitedPath[middleIndex] || elementToSelect;

        setOriginalClickedElement(elementToSelect);
        setSelectedElement(defaultSelectedElement);
        setSelectedElementPath(limitedPath);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        isWithinHigherModal(target) ||
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA"
      ) {
        return;
      }
      if (e.key === "Escape") {
        setSelectedElement(null);
        setSelectedElementPath([]);
        setOriginalClickedElement(null);
      }
    };

    const timeout = setTimeout(() => {
      document.addEventListener("submit", handleSubmit, true);
      document.addEventListener("click", handleButtonClick, true);
      document.addEventListener("click", handleClick, true);
      document.addEventListener("keydown", handleEscape);
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("keyup", handleKeyUp);
    }, 100);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener("submit", handleSubmit, true);
      document.removeEventListener("click", handleButtonClick, true);
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 z-[50] bg-background-dark/95 flex flex-col"
      onClick={e => {
        e.stopPropagation();
      }}
      onMouseDown={e => {
        e.stopPropagation();
      }}
      onMouseUp={e => {
        e.stopPropagation();
      }}
      onSubmit={e => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <div className="flex items-center justify-between p-4 border-b border-light/10 bg-background-card">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold text-gray-200">
            {viewMode === "desktop" ? "Desktop" : "Mobile"} Preview
          </h2>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background-dark/50 border border-light/20">
            <div className="i-mdi:cursor-pointer h-4 w-4 text-gray-400"></div>
            <span className="text-xs text-gray-400">
              Hold{" "}
              <kbd className="px-1.5 py-0.5 bg-background-dark rounded text-xs font-mono">
                Ctrl
              </kbd>{" "}
              + Click to inspect CSS variables
            </span>
          </div>
        </div>
        <div
          className="flex items-center gap-2"
          data-modal-header-button="true"
        >
          <Button
            onClick={e => {
              e.stopPropagation();
              openModal("themeEditor", {
                currentTheme,
                defaultTheme,
                onThemeChange,
              });
            }}
            variant="secondary"
            size="sm"
            type="button"
            data-modal-header-button="true"
          >
            <span className="flex items-center gap-1">
              <div className="i-mdi:pencil h-4 w-4"></div>
              Edit CSS
            </span>
          </Button>
          <Button
            onClick={e => {
              e.stopPropagation();
              if (
                !updateCssColor ||
                !updateCssValue ||
                !setTradingViewColorConfig
              ) {
                return;
              }
              openModal("currentTheme", {
                currentTheme,
                defaultTheme,
                updateCssColor,
                updateCssValue,
                tradingViewColorConfig,
                setTradingViewColorConfig,
              });
            }}
            variant="secondary"
            size="sm"
            type="button"
            data-modal-header-button="true"
            disabled={
              !updateCssColor || !updateCssValue || !setTradingViewColorConfig
            }
          >
            <span className="flex items-center gap-1">
              <div className="i-mdi:palette h-4 w-4"></div>
              Current Theme
            </span>
          </Button>
          <Button
            onClick={e => {
              e.stopPropagation();
              if (!onGenerateTheme) return;
              openModal("aiThemeGenerator", {
                isGeneratingTheme,
                onGenerateTheme,
              });
            }}
            variant="secondary"
            size="sm"
            type="button"
            disabled={!onGenerateTheme}
            data-modal-header-button="true"
          >
            <span className="flex items-center gap-1">
              <div className="i-mdi:magic-wand h-4 w-4"></div>
              AI Generator
            </span>
          </Button>
          <Button onClick={onClose} variant="secondary" size="sm" type="button">
            Close
          </Button>
        </div>
      </div>

      <div
        className={`flex-1 relative ${
          viewMode === "mobile"
            ? "overflow-y-auto overflow-x-hidden"
            : "overflow-hidden"
        }`}
      >
        {isCtrlHeld && (
          <style>{`
            [data-preview-container] * {
              cursor: crosshair !important;
            }
          `}</style>
        )}
        <div
          ref={previewRef}
          data-preview-container
          className={`${
            viewMode === "mobile" ? "max-w-md mx-auto min-h-full" : "h-full"
          } w-full`}
          style={
            isCtrlHeld
              ? {
                  cursor: "crosshair",
                }
              : undefined
          }
        >
          <DexPreview
            {...previewProps}
            customStyles={currentTheme || undefined}
            className="h-full w-full"
          />
        </div>

        {selectedElement && originalClickedElement && (
          <CSSVariableInspector
            element={selectedElement}
            originalClickedElement={originalClickedElement}
            elementPath={selectedElementPath}
            currentTheme={currentTheme}
            defaultTheme={defaultTheme}
            onVariableChange={handleVariableChange}
            onElementSelect={el => {
              setSelectedElement(el);
            }}
            onClose={() => {
              setSelectedElement(null);
              setSelectedElementPath([]);
              setOriginalClickedElement(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default EditModeModal;
