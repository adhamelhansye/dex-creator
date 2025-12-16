import { FC, useState, useEffect, useRef } from "react";
import {
  extractCSSVariablesFromElement,
  getElementPath,
  ElementCSSVariable,
} from "../utils/elementCSSInspector";
import { Button } from "./Button";
import { isAllowedCSSVariable } from "../utils/allowedCSSVariables";

export interface CSSVariableInspectorProps {
  element: HTMLElement | null;
  originalClickedElement: HTMLElement | null;
  elementPath?: HTMLElement[];
  currentTheme: string | null;
  defaultTheme: string;
  onVariableChange: (variableName: string, newValue: string) => void;
  onElementSelect?: (element: HTMLElement) => void;
  onClose: () => void;
}

const CSSVariableInspector: FC<CSSVariableInspectorProps> = ({
  element,
  originalClickedElement,
  elementPath: elementPathArray = [],
  currentTheme,
  defaultTheme: _defaultTheme,
  onVariableChange,
  onElementSelect,
  onClose,
}: CSSVariableInspectorProps) => {
  const [variables, setVariables] = useState<
    ReturnType<typeof extractCSSVariablesFromElement>
  >([]);
  const [elementPath, setElementPath] = useState<string>("");
  const [editingVariable, setEditingVariable] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [position, setPosition] = useState<{ x: number; y: number } | null>(
    null
  );
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (originalClickedElement && !position) {
      const rect = originalClickedElement.getBoundingClientRect();
      const viewportWidth = window.innerWidth;

      const shouldPlaceOnLeft = rect.left > viewportWidth / 2;

      const defaultX = shouldPlaceOnLeft ? 16 : viewportWidth - 400 - 16;
      const defaultY = 16;

      setPosition({ x: defaultX, y: defaultY });
    }
  }, [originalClickedElement, position]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (element && elementPathArray.length > 0) {
        const selectedIndex = elementPathArray.indexOf(element);

        const elementsToProcess =
          selectedIndex >= 0
            ? elementPathArray.slice(0, selectedIndex + 1)
            : [element];

        const allVariables = new Map<string, ElementCSSVariable>();

        elementsToProcess.forEach(el => {
          const extracted = extractCSSVariablesFromElement(el);
          extracted.forEach(v => {
            if (isAllowedCSSVariable(v.name)) {
              if (!allVariables.has(v.name)) {
                allVariables.set(v.name, v);
              }
            }
          });
        });

        setVariables(Array.from(allVariables.values()));

        const pathStrings = elementPathArray
          .slice()
          .reverse()
          .map(el => getElementPath(el).split(" > ").pop() || "");
        setElementPath(pathStrings.join(" > "));
      } else if (element) {
        const extracted = extractCSSVariablesFromElement(element);
        const filtered = extracted.filter(v => isAllowedCSSVariable(v.name));
        setVariables(filtered);
        setElementPath(getElementPath(element));
      } else {
        setVariables([]);
        setElementPath("");
      }
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [element, elementPathArray, currentTheme]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      if (position) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      if (window.getSelection) {
        window.getSelection()?.removeAllRanges();
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset, position]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (modalRef.current && position) {
      e.preventDefault();
      const rect = modalRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsDragging(true);
    }
  };

  const handleVariableClick = (varName: string, currentValue: string) => {
    setEditingVariable(varName);
    setEditValue(currentValue);
  };

  const handleSave = () => {
    if (editingVariable && editValue) {
      const fullVarName = editingVariable.startsWith("oui-")
        ? editingVariable
        : `oui-${editingVariable}`;
      onVariableChange(fullVarName, editValue);
      setEditingVariable(null);
      setEditValue("");
    }
  };

  const handleCancel = () => {
    setEditingVariable(null);
    setEditValue("");
  };

  const rgbToHex = (rgb: string): string => {
    const parts = rgb.trim().split(/\s+/);
    if (parts.length === 3) {
      const r = parseInt(parts[0], 10);
      const g = parseInt(parts[1], 10);
      const b = parseInt(parts[2], 10);
      return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }
    return "";
  };

  const hexToRgb = (hex: string): string => {
    hex = hex.replace("#", "");
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `${r} ${g} ${b}`;
  };

  const isColorVariable = (varName: string): boolean => {
    if (varName.includes("color") || varName.includes("fill")) {
      return true;
    }
    if (varName.includes("gradient")) {
      return !varName.includes("stop") && !varName.includes("angle");
    }
    return false;
  };

  if (!element || !originalClickedElement) {
    return null;
  }

  const pathSelectors =
    elementPathArray.length > 0
      ? elementPathArray
          .slice()
          .reverse()
          .slice(0, 5)
          .map(el => {
            const fullPath = getElementPath(el);
            return fullPath.split(" > ").pop() || fullPath;
          })
      : elementPath.split(" > ").slice(-5);

  return (
    <div
      ref={modalRef}
      className="fixed z-[51] bg-[rgb(var(--oui-color-base-7))] border border-light/20 rounded-lg shadow-xl p-4 max-h-[80vh] overflow-y-auto backdrop-blur-sm w-96"
      style={{
        backgroundColor: "rgba(var(--oui-color-base-7), 0.98)",
        left: position?.x !== undefined ? `${position.x}px` : undefined,
        right: position?.x === undefined ? "16px" : undefined,
        top: position?.y !== undefined ? `${position.y}px` : undefined,
        bottom: position?.y === undefined ? "16px" : undefined,
        cursor: isDragging ? "grabbing" : "default",
        userSelect: isDragging ? "none" : "auto",
        WebkitUserSelect: isDragging ? "none" : "auto",
      }}
    >
      <div
        className="flex items-center justify-between mb-4 cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
      >
        <h3 className="text-sm font-bold text-gray-200">CSS Variables</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-200 transition-colors"
          type="button"
        >
          <div className="i-mdi:close h-5 w-5"></div>
        </button>
      </div>

      <div className="mb-3">
        <div className="text-xs text-gray-400 font-mono bg-background-dark/50 p-2 rounded border border-light/10 break-all mb-2">
          {elementPath}
        </div>
        <div className="flex flex-wrap gap-1 text-xs">
          {pathSelectors.map((selector, index) => {
            const reversedIndex = pathSelectors.length - 1 - index;
            const pathElement =
              elementPathArray.length > 0 &&
              reversedIndex < elementPathArray.length
                ? elementPathArray[reversedIndex]
                : null;

            const isSelected = pathElement === element;

            return (
              <button
                key={index}
                onClick={() => {
                  if (pathElement && onElementSelect) {
                    onElementSelect(pathElement);
                  }
                }}
                className={`px-2 py-1 rounded transition-colors ${
                  isSelected
                    ? "bg-blue-500/20 text-blue-300 border border-blue-500/50 hover:bg-blue-500/30"
                    : "bg-gray-700/50 text-gray-400 border border-gray-600/50 hover:bg-gray-600/50"
                } ${pathElement ? "cursor-pointer" : "cursor-default"}`}
                type="button"
                disabled={!pathElement}
              >
                {selector}
              </button>
            );
          })}
        </div>
      </div>

      {variables.length === 0 ? (
        <div className="text-xs text-gray-400 text-center py-4">
          No CSS variables found for this element
        </div>
      ) : (
        <div className="space-y-2">
          {variables.map(variable => {
            const isEditing = editingVariable === variable.name;
            const isColor = isColorVariable(variable.name);
            const valueToUse = isEditing ? editValue : variable.value;
            const hexValue = isColor ? rgbToHex(valueToUse) : "";

            return (
              <div
                key={variable.name}
                className="bg-background-dark/50 p-2 rounded border border-light/10"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono text-gray-300">
                    --{variable.name}
                  </span>
                  {!isEditing && (
                    <button
                      onClick={() =>
                        handleVariableClick(variable.name, variable.value)
                      }
                      className="text-xs text-primary-light hover:text-primary-light/80 transition-colors"
                      type="button"
                    >
                      Edit
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <div className="mt-2 space-y-2">
                    {isColor ? (
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          value={hexValue || "#000000"}
                          onChange={e => setEditValue(hexToRgb(e.target.value))}
                          className="w-12 h-8 rounded border border-light/20 cursor-pointer"
                        />
                        <div
                          className="w-6 h-6 rounded border border-light/20 flex-shrink-0"
                          style={{
                            backgroundColor: `rgb(${editValue})`,
                          }}
                        />
                        <input
                          type="text"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          placeholder="R G B"
                          className="flex-1 bg-background-dark border border-light/20 rounded px-2 py-1 text-xs text-gray-200 font-mono"
                        />
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        className="w-full bg-background-dark border border-light/20 rounded px-2 py-1 text-xs text-gray-200 font-mono"
                      />
                    )}
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSave}
                        variant="primary"
                        size="xs"
                        type="button"
                      >
                        Save
                      </Button>
                      <Button
                        onClick={handleCancel}
                        variant="secondary"
                        size="xs"
                        type="button"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {isColor && hexValue && (
                      <div
                        className="w-6 h-6 rounded border border-light/20"
                        style={{
                          backgroundColor: `rgb(${variable.computedValue})`,
                        }}
                      />
                    )}
                    <span className="text-xs text-gray-400 font-mono">
                      {variable.computedValue || variable.value || "N/A"}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CSSVariableInspector;
