import { useState, useEffect } from "react";

interface ThemeSpacingControlsProps {
  css: string;
  onValueChange: (variableName: string, newValue: string) => void;
}

interface SpacingValues {
  [key: string]: string;
}

// The order in which we want to display the spacing variables
const SPACING_ORDER = ["xs", "sm", "md", "lg", "xl"];

// Map variable keys to display names
const SPACING_DISPLAY_NAMES: { [key: string]: string } = {
  xs: "Extra Small",
  sm: "Small",
  md: "Medium",
  lg: "Large",
  xl: "Extra Large",
};

export default function ThemeSpacingControls({
  css,
  onValueChange,
}: ThemeSpacingControlsProps) {
  const [spacingValues, setSpacingValues] = useState<SpacingValues>({});

  // Extract spacing values from CSS when component mounts or CSS changes
  useEffect(() => {
    const extractedValues = extractSpacingValues(css);
    setSpacingValues(extractedValues);
  }, [css]);

  // Extract spacing values from CSS string
  const extractSpacingValues = (cssString: string): SpacingValues => {
    const values: SpacingValues = {};
    const regex = /--oui-spacing-([^:]*)?:\s*([^;]+);/g;
    let match;

    while ((match = regex.exec(cssString)) !== null) {
      const suffix = match[1] ? match[1] : "";
      const value = match[2].trim();
      values[suffix] = value;
    }

    return values;
  };

  // Parse CSS value to get numeric value and unit
  const parseCssValue = (value: string): { value: number; unit: string } => {
    const match = value.match(/^([\d.]+)(.*)$/);
    if (match) {
      return {
        value: parseFloat(match[1]),
        unit: match[2],
      };
    }
    return { value: 0, unit: "rem" };
  };

  // Format CSS value
  const formatCssValue = (value: number, unit: string): string => {
    return `${value}${unit}`;
  };

  // Handle slider change
  const handleSliderChange = (
    key: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = parseFloat(e.target.value);
    const { unit } = parseCssValue(spacingValues[key]);
    const newValue = formatCssValue(value, unit);

    setSpacingValues({
      ...spacingValues,
      [key]: newValue,
    });

    onValueChange(`oui-spacing-${key}`, newValue);
  };

  // Handle direct input change
  const handleInputChange = (
    key: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const inputValue = e.target.value;
    const regex = /^[\d.]+[a-z%]*$/;

    if (regex.test(inputValue)) {
      setSpacingValues({
        ...spacingValues,
        [key]: inputValue,
      });

      onValueChange(`oui-spacing-${key}`, inputValue);
    }
  };

  // Get the maximum slider value based on the current value
  const getMaxSliderValue = (key: string): number => {
    const { value } = parseCssValue(spacingValues[key] || "0rem");

    // If value is already greater than 40, set max to value + 10
    if (value > 40) return Math.ceil(value + 10);

    // Otherwise use 40 as the default max
    return 40;
  };

  // Render a preview of the spacing
  const renderSpacingPreview = (_key: string, value: string) => {
    // Create a visual representation of the spacing
    const { value: numValue } = parseCssValue(value);

    // Use a logarithmic scale for better visualization
    // This gives smaller increments for small values and larger increments for big values
    // but keeps everything in a reasonable display range
    const scaledSize = Math.min(Math.max(Math.log2(numValue + 1) * 9, 6), 60);

    return (
      <div className="flex items-center justify-center w-full h-full">
        <div
          className="bg-primary/30 border border-primary transition-all duration-300"
          style={{
            width: `${scaledSize}px`,
            height: `${scaledSize}px`,
          }}
        ></div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {SPACING_ORDER.map(key => {
        const value = spacingValues[key] || "0rem";
        const { value: numValue } = parseCssValue(value);
        const variableName = `--oui-spacing-${key}`;
        const displayName = SPACING_DISPLAY_NAMES[key];

        return (
          <div
            key={key}
            className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 py-2 border-b border-light/5"
          >
            <div className="flex items-center gap-3">
              {/* Mobile-friendly preview box */}
              <div className="w-16 h-16 flex-shrink-0">
                {renderSpacingPreview(key, value)}
              </div>

              <div className="flex flex-col">
                <span className="text-sm font-medium">{displayName}</span>
                <span className="text-xs text-gray-400">{variableName}</span>
              </div>
            </div>

            <div className="flex-grow mt-2 sm:mt-0">
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max={getMaxSliderValue(key)}
                  value={numValue}
                  step="0.5"
                  onChange={e => handleSliderChange(key, e)}
                  className="flex-grow h-2 rounded-lg appearance-none cursor-pointer bg-background-dark/80 border border-light/20 relative 
                  hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />

                <input
                  type="text"
                  value={value}
                  onChange={e => handleInputChange(key, e)}
                  className="w-16 sm:w-20 px-2 py-1 bg-background-dark/80 border border-light/20 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  aria-label={`${displayName} value`}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
