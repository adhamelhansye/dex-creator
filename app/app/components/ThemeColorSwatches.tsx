import React, { useState, useRef, useEffect } from "react";

interface ThemeColorSwatchesProps {
  css: string;
  onColorChange: (variableName: string, newColorHex: string) => void;
  selectedColors?: string[];
  onSelectionChange?: (selectedColors: string[]) => void;
}

export default function ThemeColorSwatches({
  css,
  onColorChange,
  selectedColors = [],
  onSelectionChange,
}: ThemeColorSwatchesProps) {
  const [selectedVariable, setSelectedVariable] = useState<string | null>(null);
  const [inputPosition, setInputPosition] = useState({ top: 0, left: 0 });
  const colorInputRef = useRef<HTMLInputElement>(null);
  const [syncBrandWithPrimary, setSyncBrandWithPrimary] = useState(true);

  // Reset the color picker when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setSelectedVariable(null);
    };

    window.addEventListener("click", handleClickOutside);
    return () => {
      window.removeEventListener("click", handleClickOutside);
    };
  }, []);

  // Extract all colors from the CSS - capturing ALL color variables even if format is invalid
  const extractRgbValues = (cssText: string) => {
    const colorVariables: Record<string, string | null> = {};

    // First, capture all --oui-color variable declarations
    const variableRegex = /--oui-color-([a-zA-Z0-9-]+):\s*([^;]+)/g;
    let variableMatch;

    while ((variableMatch = variableRegex.exec(cssText)) !== null) {
      const [, colorName, valueStr] = variableMatch;

      // Check if the value matches valid RGB format (3 numbers with spaces)
      const rgbRegex = /^\s*(\d+)\s+(\d+)\s+(\d+)\s*$/;
      const rgbMatch = valueStr.match(rgbRegex);

      if (rgbMatch) {
        // Valid RGB format
        colorVariables[colorName] = valueStr.trim().replace(/\s+/g, " ");
      } else {
        // Invalid format - store null but keep the variable
        colorVariables[colorName] = null;
      }
    }

    return colorVariables;
  };

  // Extract gradient values from CSS
  const extractGradientValues = (cssText: string) => {
    const gradientVariables: Record<string, string | null> = {};
    const gradientRegex = /--oui-gradient-([a-zA-Z0-9-]+):\s*([^;]+);/g;
    let match;

    while ((match = gradientRegex.exec(cssText)) !== null) {
      const [, name, value] = match;
      gradientVariables[name] = value.trim();
    }

    return gradientVariables;
  };

  // Convert rgb string to hex color
  const rgbToHex = (rgb: string) => {
    // Split the RGB string into individual values (handling both comma and space-separated)
    const [r, g, b] = rgb.replace(/,/g, " ").split(/\s+/).map(Number);

    // Convert to hex
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  };

  // Convert hex to RGB space-separated format
  const hexToRgbSpaceSeparated = (hex: string) => {
    // Remove the # if present
    hex = hex.replace("#", "");

    // Parse the hex values
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);

    return `${r} ${g} ${b}`;
  };

  // Handle color picker change
  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedVariable) return;

    const newColorHex = e.target.value;

    // Update the selected color
    onColorChange(`oui-color-${selectedVariable}`, newColorHex);

    // If the selected variable is a primary color and sync is enabled, update brand gradient too
    if (syncBrandWithPrimary && selectedVariable.includes("primary")) {
      const rgbValue = hexToRgbSpaceSeparated(newColorHex);

      // Update brand gradient based on which primary color was changed
      if (selectedVariable === "primary") {
        // Update brand gradient end with primary
        updateBrandGradient(null, rgbValue);
      } else if (selectedVariable === "primary-light") {
        // Update brand gradient start with primary-light
        updateBrandGradient(rgbValue, null);
      }
    }
  };

  // Update brand gradient
  const updateBrandGradient = (
    startRgb: string | null,
    endRgb: string | null
  ) => {
    if (startRgb) {
      setTimeout(() => {
        onColorChange("gradient-brand-start", rgbToHex(startRgb));
      }, 500);
    }

    if (endRgb) {
      onColorChange("gradient-brand-end", rgbToHex(endRgb));
    }
  };

  const handleCheckboxChange = (colorName: string, checked: boolean) => {
    if (!onSelectionChange) return;

    let newSelection: string[];
    if (checked) {
      newSelection = [...selectedColors, colorName];
    } else {
      newSelection = selectedColors.filter(color => color !== colorName);
    }
    onSelectionChange(newSelection);
  };

  const rgbColors = extractRgbValues(css);
  const gradientColors = extractGradientValues(css);
  const allColorKeys = Object.keys(rgbColors);

  // Define color categories for better organization with dynamic inclusion
  const colorCategories = [
    {
      title: "Primary Colors",
      colors: allColorKeys.filter(
        key =>
          key.includes("primary") ||
          key.includes("link") ||
          key === "secondary" ||
          key === "tertiary" ||
          key === "quaternary"
      ),
    },
    {
      title: "Status Colors",
      colors: allColorKeys.filter(
        key =>
          key.includes("success") ||
          key.includes("warning") ||
          key.includes("danger")
      ),
    },
    {
      title: "Base Colors",
      colors: allColorKeys.filter(key => key.includes("base")),
    },
    {
      title: "Trading Colors",
      colors: allColorKeys.filter(key => key.includes("trading")),
    },
    {
      title: "Fill Colors",
      colors: allColorKeys.filter(key => key.includes("fill")),
    },
    {
      title: "Line Colors",
      colors: allColorKeys.filter(
        key => key.includes("line") && !key.includes("trading")
      ),
    },
    {
      title: "Other Colors",
      colors: allColorKeys.filter(
        key =>
          !key.includes("primary") &&
          !key.includes("link") &&
          !key.includes("success") &&
          !key.includes("warning") &&
          !key.includes("danger") &&
          !key.includes("base") &&
          !key.includes("trading") &&
          !key.includes("fill") &&
          !key.includes("line") &&
          key !== "secondary" &&
          key !== "tertiary" &&
          key !== "quaternary"
      ),
    },
  ];

  // Filter out empty categories
  const nonEmptyCategories = colorCategories.filter(
    category => category.colors.length > 0
  );

  // Helper function to format the display name
  function formatDisplayName(name: string): string {
    return name
      .split("-")
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  // Helper function to determine if a color is dark (for text contrast)
  const isColorDark = (rgbStr: string) => {
    const [r, g, b] = rgbStr.split(",").map(Number);
    // Calculate relative luminance using the formula
    // 0.299*R + 0.587*G + 0.114*B
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.5;
  };

  const renderSwatch = (name: string) => {
    const displayName = formatDisplayName(name);
    // Get the stored RGB value (which might be null if invalid)
    const storedValue = rgbColors[name];
    const isValid = storedValue !== null;
    const commaRgb = isValid ? storedValue?.replace(/\s+/g, ",") : "255,0,0"; // Use red as fallback for invalid colors

    // Determine text color based on background brightness
    const isDark = isColorDark(commaRgb);
    const textColor = isDark ? "white" : "black";
    const needsShadow = isDark;

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      // Prevent the event from bubbling to window which would close the picker
      e.stopPropagation();

      // Get the position of the clicked element
      const rect = e.currentTarget.getBoundingClientRect();
      setInputPosition({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
      });

      // Set the selected variable for the color picker
      setSelectedVariable(name);

      // Set the current color value on the hidden input and open color picker
      // Allow color picker to open for both valid and invalid colors
      if (colorInputRef.current) {
        // Use fallback color #FF0000 for invalid colors
        colorInputRef.current.value = isValid ? rgbToHex(commaRgb) : "#FF0000";
        // Trigger the color picker
        setTimeout(() => {
          colorInputRef.current?.click();
        }, 10);
      }
    };

    const handleSwatchClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (
        e.target === e.currentTarget ||
        !(e.target as HTMLElement).closest('input[type="checkbox"]')
      ) {
        handleClick(e);
      }
    };

    return (
      <div key={name} className="relative">
        <div
          className={`h-16 w-full rounded-md flex items-center justify-between px-3 py-2 border ${!isValid ? "border-error/50" : "border-light/10"} cursor-pointer hover:ring-2 hover:ring-primary transition-all ${selectedColors.includes(name) ? "ring-2 ring-primary/50" : ""}`}
          style={{
            backgroundColor: isValid
              ? `rgb(${commaRgb})`
              : "rgba(255,0,0,0.15)",
          }}
          onClick={handleSwatchClick}
          title={
            isValid
              ? `Click to edit ${displayName} Color, use checkbox to select`
              : `Invalid CSS format for ${displayName}`
          }
        >
          {/* Left side: Color name and RGB value */}
          <div className="flex flex-col items-start">
            <span
              className="font-medium text-[0.8rem]"
              style={{
                color: isValid ? textColor : "white",
                textShadow:
                  needsShadow || !isValid ? "0 0 2px rgba(0,0,0,0.8)" : "none",
              }}
            >
              {displayName}
            </span>
            <span
              className="text-[0.65rem] opacity-80"
              style={{
                color: isValid ? textColor : "white",
                textShadow:
                  needsShadow || !isValid ? "0 0 2px rgba(0,0,0,0.8)" : "none",
              }}
            >
              {isValid
                ? `RGB(${storedValue?.replace(/\s+/g, ", ")})`
                : "Invalid format"}
            </span>
          </div>

          {/* Right side: Checkbox */}
          {onSelectionChange && (
            <div className="flex items-center ml-1">
              <input
                type="checkbox"
                checked={selectedColors.includes(name)}
                onChange={e => {
                  e.stopPropagation();
                  handleCheckboxChange(name, e.target.checked);
                }}
                className="w-5 h-5 rounded border-2 border-white bg-black/70 checked:bg-primary checked:border-primary focus:ring-2 focus:ring-primary/50 focus:ring-offset-0 shadow-lg"
                onClick={e => e.stopPropagation()}
              />
            </div>
          )}

          {/* Error indicator */}
          {!isValid && (
            <div className="absolute -right-3 -top-3 text-error bg-background-dark/90 rounded-full p-0.5 h-5 w-5 flex items-center justify-center">
              <span className="i-mdi:alert-circle text-xs"></span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render a gradient preview
  const renderGradientPreview = () => {
    // Get brand gradient values
    const brandStart = gradientColors["brand-start"];
    const brandEnd = gradientColors["brand-end"];
    const brandAngle = gradientColors["brand-angle"] || "17.44deg";
    const brandStopStart = gradientColors["brand-stop-start"] || "6.62%";
    const brandStopEnd = gradientColors["brand-stop-end"] || "86.5%";

    const hasValidGradient = brandStart && brandEnd;

    return (
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h5 className="text-sm font-medium text-gray-300">Brand Gradient</h5>
          <label className="flex items-center cursor-pointer relative">
            <input
              type="checkbox"
              checked={syncBrandWithPrimary}
              onChange={() => setSyncBrandWithPrimary(!syncBrandWithPrimary)}
              className="sr-only"
            />
            <div
              className={`w-10 h-5 rounded-full mr-2 flex items-center px-0.5 transition-colors duration-200 ease-in-out ${syncBrandWithPrimary ? "bg-primary/60" : "bg-background-dark/80"}`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ease-in-out ${syncBrandWithPrimary ? "transform translate-x-5" : "transform translate-x-0"}`}
              ></div>
            </div>
            <span className="text-xs text-gray-300">Sync with primary</span>
          </label>
        </div>

        {hasValidGradient ? (
          <div
            className="w-full h-16 rounded-md border border-light/10 overflow-hidden mb-2"
            style={{
              background: `linear-gradient(${brandAngle}, rgb(${brandStart.replace(/\s+/g, ",")}) ${brandStopStart}, rgb(${brandEnd.replace(/\s+/g, ",")}) ${brandStopEnd})`,
            }}
          ></div>
        ) : (
          <div className="w-full h-16 rounded-md border border-error/50 bg-background-dark/50 flex items-center justify-center">
            <span className="text-xs text-gray-400">
              Invalid gradient format
            </span>
          </div>
        )}

        <div className="text-xs text-gray-400 mt-1">
          Brand gradient is used for primary buttons and important UI elements
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Hidden color input that will be triggered programmatically */}
      <input
        ref={colorInputRef}
        type="color"
        className="fixed opacity-0 pointer-events-none h-8 w-8 z-50"
        style={{
          top: `${inputPosition.top + 8}px`,
          left: `${inputPosition.left + 8}px`,
        }}
        onChange={handleColorChange}
        aria-hidden="true"
        onClick={e => e.stopPropagation()}
      />

      {/* Selection Info */}
      {onSelectionChange && (
        <div className="bg-background-dark/30 p-3 rounded-lg border border-light/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="i-mdi:information-outline h-4 w-4 text-primary"></div>
              <span className="text-sm text-gray-300">
                {selectedColors.length > 0
                  ? `${selectedColors.length} color${selectedColors.length > 1 ? "s" : ""} selected`
                  : "No colors selected"}
              </span>
            </div>
            {selectedColors.length > 0 && (
              <button
                onClick={() => onSelectionChange([])}
                className="text-xs text-gray-400 hover:text-gray-300 transition-colors"
                type="button"
              >
                Clear selection
              </button>
            )}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            <span className="font-medium">Tips:</span> Click to edit colors, use
            checkboxes to select colors
          </div>
        </div>
      )}

      {/* Brand Gradient Preview */}
      {renderGradientPreview()}

      {nonEmptyCategories.map(category => (
        <div key={category.title} className="space-y-2">
          <h5 className="text-sm font-medium text-gray-300">
            {category.title} ({category.colors.length})
          </h5>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4">
            {category.colors.map(name => renderSwatch(name))}
          </div>
        </div>
      ))}
    </div>
  );
}
