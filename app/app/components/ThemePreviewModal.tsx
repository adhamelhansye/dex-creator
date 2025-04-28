import { useState, useEffect } from "react";
import { Button } from "./Button";
import ThemeColorSwatches from "./ThemeColorSwatches";
import ThemeRoundedControls from "./ThemeRoundedControls";
import ThemeSpacingControls from "./ThemeSpacingControls";
import { Card } from "./Card";

interface ThemePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (css: string) => void;
  onCancel?: () => void;
  css: string;
}

type TabType = "colors" | "rounded" | "spacing";

export default function ThemePreviewModal({
  isOpen,
  onClose,
  onApply,
  onCancel,
  css: initialCss,
}: ThemePreviewModalProps) {
  const [css, setCss] = useState(initialCss);
  const [activeTab, setActiveTab] = useState<TabType>("colors");

  // Update the internal CSS when prop changes
  useEffect(() => {
    setCss(initialCss);
  }, [initialCss]);

  if (!isOpen) return null;

  const handleCancel = () => {
    // Call onCancel if provided, otherwise fall back to onClose
    if (onCancel) {
      onCancel();
    }
    onClose();
  };

  const handleApply = () => {
    // Pass the modified CSS to the parent component
    onApply(css);
  };

  // Convert hex color to space-separated RGB format
  const hexToRgbSpaceSeparated = (hex: string) => {
    // Remove the # if present
    hex = hex.replace("#", "");

    // Parse the hex values
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);

    return `${r} ${g} ${b}`;
  };

  // Update the CSS with a new color
  const updateCssColor = (variableName: string, newColorHex: string) => {
    const newColorRgb = hexToRgbSpaceSeparated(newColorHex);

    // Use functional setState to ensure we're working with the latest state
    setCss(prevCss => {
      let updatedCss = prevCss;

      // Handle different variable prefixes - color or gradient
      if (variableName.startsWith("oui-color")) {
        const regex = new RegExp(
          `(--${variableName}:\\s*)(\\d+\\s+\\d+\\s+\\d+)`,
          "g"
        );
        updatedCss = updatedCss.replace(regex, `$1${newColorRgb}`);
      } else if (variableName.startsWith("gradient")) {
        const regex = new RegExp(
          `(--oui-${variableName}:\\s*)(\\d+\\s+\\d+\\s+\\d+)`,
          "g"
        );
        updatedCss = updatedCss.replace(regex, `$1${newColorRgb}`);
      }

      return updatedCss;
    });
  };

  // Update the CSS with a new value (for non-color properties)
  const updateCssValue = (variableName: string, newValue: string) => {
    // Use functional setState to ensure we're working with the latest state
    setCss(prevCss => {
      const regex = new RegExp(`(--${variableName}:\\s*)([^;]+)`, "g");
      return prevCss.replace(regex, `$1${newValue}`);
    });
  };

  const TabButton = ({ tab, label }: { tab: TabType; label: string }) => (
    <button
      className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
        activeTab === tab
          ? "bg-background-dark/50 text-white border-t border-l border-r border-light/10"
          : "bg-transparent text-gray-400 hover:text-white"
      }`}
      onClick={() => setActiveTab(tab)}
    >
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center h-screen">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background-dark/80 backdrop-blur-sm z-[1001]"
        onClick={handleCancel}
      ></div>

      {/* Modal */}
      <div className="relative z-[1002] w-full max-w-3xl p-6 rounded-xl bg-background-light border border-light/10 shadow-2xl slide-fade-in max-h-[90vh] overflow-auto">
        <h3 className="text-xl font-bold mb-4">Theme Preview</h3>

        {/* AI Disclaimer Info Card */}
        <Card className="mb-4 p-3 slide-fade-in" variant="default">
          <div className="flex items-start gap-3">
            <div className="i-mdi:robot text-primary-light h-5 w-5 mt-0.5 flex-shrink-0"></div>
            <div>
              <h4 className="text-sm font-medium mb-1">AI-Generated Theme</h4>
              <p className="text-xs text-gray-300 mb-2">
                This theme was created by an AI based on your description. While
                we strive for quality results:
              </p>
              <ul className="text-xs text-gray-300 list-disc pl-4 space-y-1 mb-2">
                <li>Colors may not always perfectly match your description</li>
                <li>Contrast ratios between elements might need adjustment</li>
                <li>
                  Some color combinations might not look ideal in all contexts
                </li>
              </ul>
              <p className="text-xs text-gray-300">
                <span className="text-primary-light font-medium">
                  Recommendation:
                </span>{" "}
                Use the preview functionality to see how your theme looks in a
                real DEX environment, and make adjustments as needed using the
                color editor below.
              </p>
            </div>
          </div>
        </Card>

        <div className="mb-6 space-y-4">
          {/* Tabs */}
          <div className="border-b border-light/10">
            <div className="flex">
              <TabButton tab="colors" label="Color Palette" />
              <TabButton tab="rounded" label="Border Radius" />
              <TabButton tab="spacing" label="Spacing" />
            </div>
          </div>

          {/* Tab Content */}
          <div className="pt-2">
            {activeTab === "colors" && (
              <div className="bg-background-dark/50 p-4 rounded-lg border border-light/10">
                <h4 className="font-semibold mb-2 flex justify-between items-center">
                  <span>Color Palette</span>
                  <span className="text-xs text-gray-400">
                    Click on any color to edit
                  </span>
                </h4>

                <ThemeColorSwatches css={css} onColorChange={updateCssColor} />
              </div>
            )}

            {activeTab === "rounded" && (
              <div className="bg-background-dark/50 p-4 rounded-lg border border-light/10">
                <h4 className="font-semibold mb-2 flex justify-between items-center">
                  <span>Border Radius</span>
                  <span className="text-xs text-gray-400">
                    Adjust values with the sliders
                  </span>
                </h4>

                <ThemeRoundedControls
                  css={css}
                  onValueChange={updateCssValue}
                />
              </div>
            )}

            {activeTab === "spacing" && (
              <div className="bg-background-dark/50 p-4 rounded-lg border border-light/10">
                <h4 className="font-semibold mb-2 flex justify-between items-center">
                  <span>Spacing</span>
                  <span className="text-xs text-gray-400">
                    Adjust spacing values with the sliders
                  </span>
                </h4>

                <ThemeSpacingControls
                  css={css}
                  onValueChange={updateCssValue}
                />
              </div>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold">CSS</h4>
            </div>
            <pre className="bg-background-dark/95 p-4 rounded-lg text-sm border-2 border-primary/20 overflow-x-auto text-gray-200 shadow-inner max-h-[300px] overflow-y-auto">
              {css}
            </pre>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleApply}>
            Apply Theme
          </Button>
        </div>
      </div>
    </div>
  );
}
