import React, { ChangeEvent, useState } from "react";
import { Button } from "./Button";
import { Card } from "./Card";
import FormInput from "./FormInput";
import PreviewButton from "./PreviewButton";
import ThemeColorSwatches from "./ThemeColorSwatches";
import ThemeRoundedControls from "./ThemeRoundedControls";
import ThemeSpacingControls from "./ThemeSpacingControls";
import TradingViewColorConfig from "./TradingViewColorConfig";

const Textarea = ({
  value,
  onChange,
  className,
  placeholder,
}: {
  value: string | null;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  className?: string;
  placeholder?: string;
}) => (
  <textarea
    value={value || ""}
    onChange={onChange}
    className={className}
    placeholder={placeholder}
  />
);

export type ThemeTabType = "colors" | "rounded" | "spacing" | "tradingview";

export interface ThemeCustomizationProps {
  currentTheme: string | null;
  defaultTheme: string;
  showThemeEditor: boolean;
  viewCssCode: boolean;
  activeThemeTab: ThemeTabType;
  themePrompt: string;
  isGeneratingTheme: boolean;
  brokerName: string;
  primaryLogo: Blob | null;
  secondaryLogo: Blob | null;
  themeApplied: boolean;
  tradingViewColorConfig: string | null;
  toggleThemeEditor: () => void;
  handleResetTheme: () => void;
  handleResetToDefault: () => void;
  handleResetSelectedColors?: (selectedColors: string[]) => void;
  handleResetSelectedColorsToDefault?: (selectedColors: string[]) => void;
  handleThemeEditorChange: (value: string) => void;
  setViewCssCode: (value: boolean) => void;
  ThemeTabButton: React.FC<{ tab: ThemeTabType; label: string }>;
  updateCssColor: (variableName: string, newColorHex: string) => void;
  updateCssValue: (variableName: string, newValue: string) => void;
  handleInputChange: (
    field: string
  ) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleGenerateTheme: () => void;
  setTradingViewColorConfig: (config: string | null) => void;
  idPrefix?: string;
}

const ThemeCustomizationSection: React.FC<ThemeCustomizationProps> = ({
  currentTheme,
  defaultTheme,
  showThemeEditor,
  viewCssCode,
  activeThemeTab,
  themePrompt,
  isGeneratingTheme,
  brokerName,
  primaryLogo,
  secondaryLogo,
  themeApplied,
  tradingViewColorConfig,
  toggleThemeEditor,
  handleResetTheme,
  handleResetToDefault,
  handleResetSelectedColors,
  handleResetSelectedColorsToDefault,
  handleThemeEditorChange,
  setViewCssCode,
  ThemeTabButton,
  updateCssColor,
  updateCssValue,
  handleInputChange,
  handleGenerateTheme,
  setTradingViewColorConfig,
  idPrefix = "",
}) => {
  const [selectedColors, setSelectedColors] = useState<string[]>([]);

  const handleResetSelected = () => {
    if (handleResetSelectedColors && selectedColors.length > 0) {
      handleResetSelectedColors(selectedColors);
      setSelectedColors([]);
    } else {
      handleResetTheme();
    }
  };

  const handleResetSelectedToDefault = () => {
    if (handleResetSelectedColorsToDefault && selectedColors.length > 0) {
      handleResetSelectedColorsToDefault(selectedColors);
      setSelectedColors([]);
    } else {
      handleResetToDefault();
    }
  };

  return (
    <>
      <div className="mt-4 rounded-lg overflow-hidden border border-light/10 p-4 bg-base-7/50">
        <div className="flex justify-between mb-2 flex-col sm:flex-row gap-2 sm:gap-0">
          <span className="text-sm font-medium mb-2 text-gray-300">
            Current Theme
          </span>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              onClick={toggleThemeEditor}
              variant="secondary"
              size="xs"
              className="w-full sm:w-auto"
              type="button"
            >
              <span className="flex items-center gap-1 justify-center sm:justify-start">
                <div
                  className={
                    showThemeEditor
                      ? "i-mdi:eye h-3.5 w-3.5"
                      : "i-mdi:pencil h-3.5 w-3.5"
                  }
                ></div>
                {showThemeEditor ? "Hide Editor" : "Edit CSS"}
              </span>
            </Button>
            <Button
              onClick={handleResetSelected}
              variant="danger"
              size="xs"
              className="w-full sm:w-auto"
              type="button"
            >
              {selectedColors.length > 0
                ? `Reset Selected (${selectedColors.length})`
                : "Reset"}
            </Button>
            <Button
              onClick={handleResetSelectedToDefault}
              variant="danger"
              size="xs"
              className="w-full sm:w-auto"
              type="button"
            >
              {selectedColors.length > 0
                ? `Reset Selected to Default (${selectedColors.length})`
                : "Reset to Default"}
            </Button>
          </div>
        </div>
        {showThemeEditor && (
          <div className="mt-4 slide-fade-in">
            <Textarea
              value={currentTheme || defaultTheme}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                handleThemeEditorChange(e.target.value)
              }
              className="w-full h-80 bg-black/80 text-xs text-gray-300 font-mono p-3 rounded border border-light/10"
              placeholder="Edit your CSS theme here..."
            />
          </div>
        )}
        {!showThemeEditor && (
          <div className="mt-2 text-xs mb-4">
            <div>
              <button
                onClick={() => setViewCssCode(!viewCssCode)}
                className="cursor-pointer text-gray-400 hover:text-gray-300 transition-colors flex items-center"
                type="button"
              >
                <span>{viewCssCode ? "Hide" : "View"} CSS code</span>
                <div
                  className={`i-mdi:chevron-down h-4 w-4 ml-1 transition-transform ${viewCssCode ? "rotate-180" : ""}`}
                ></div>
              </button>
              {viewCssCode && (
                <div className="bg-base-8/50 p-4 rounded-lg overflow-auto text-xs max-h-[300px] mt-2 slide-fade-in">
                  <pre className="language-css">
                    {currentTheme || defaultTheme}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
        <div className="border-b border-light/10 mt-4">
          <div className="flex">
            <ThemeTabButton tab="colors" label="Color Palette" />
            <ThemeTabButton tab="rounded" label="Border Radius" />
            <ThemeTabButton tab="spacing" label="Spacing" />
            <ThemeTabButton tab="tradingview" label="TradingView" />
          </div>
        </div>
        <div className="pt-4">
          {activeThemeTab === "colors" && (
            <div className="bg-background-dark/50 p-4 rounded-lg border border-light/10 slide-fade-in">
              <div className="flex items-center gap-1 mb-3 text-xs text-gray-400">
                <div className="i-mdi:information-outline h-3.5 w-3.5"></div>
                <span>
                  Click on any color swatch below to edit with a color picker
                </span>
              </div>
              <ThemeColorSwatches
                css={currentTheme || defaultTheme}
                onColorChange={updateCssColor}
                selectedColors={selectedColors}
                onSelectionChange={setSelectedColors}
              />
            </div>
          )}
          {activeThemeTab === "rounded" && (
            <div className="bg-background-dark/50 p-4 rounded-lg border border-light/10 slide-fade-in">
              <div className="flex items-center gap-1 mb-3 text-xs text-gray-400">
                <div className="i-mdi:information-outline h-3.5 w-3.5"></div>
                <span>
                  Adjust the rounded corners of your UI elements with the
                  sliders
                </span>
              </div>
              <ThemeRoundedControls
                css={currentTheme || defaultTheme}
                onValueChange={updateCssValue}
              />
            </div>
          )}
          {activeThemeTab === "spacing" && (
            <div className="bg-background-dark/50 p-4 rounded-lg border border-light/10 slide-fade-in">
              <div className="flex items-center gap-1 mb-3 text-xs text-gray-400">
                <div className="i-mdi:information-outline h-3.5 w-3.5"></div>
                <span>
                  Adjust the spacing values used throughout your DEX interface
                </span>
              </div>
              <ThemeSpacingControls
                css={currentTheme || defaultTheme}
                onValueChange={updateCssValue}
              />
            </div>
          )}
          {activeThemeTab === "tradingview" && (
            <div className="bg-background-dark/50 p-4 rounded-lg border border-light/10 slide-fade-in">
              <div className="flex items-center gap-1 mb-3 text-xs text-gray-400">
                <div className="i-mdi:information-outline h-3.5 w-3.5"></div>
                <span>Configure TradingView color settings</span>
              </div>
              <TradingViewColorConfig
                value={tradingViewColorConfig}
                onChange={setTradingViewColorConfig}
              />
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col space-y-4 mt-6">
        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-medium mb-1">AI Theme Generator</h4>
          <p className="text-xs text-gray-400 mb-2">
            Describe how you want your DEX theme to look and our AI will
            generate it for you.
          </p>
          <Card className="mb-3 p-3 slide-fade-in" variant="default">
            <div className="flex items-start gap-2">
              <div className="i-mdi:information-outline text-primary-light h-4 w-4 mt-0.5 flex-shrink-0"></div>
              <div>
                <p className="text-xs text-gray-300 mb-1">
                  <span className="text-primary-light font-medium">Note:</span>{" "}
                  AI-generated themes are a starting point and may not be
                  perfect. After generating:
                </p>
                <ul className="text-xs text-gray-300 list-disc pl-4 space-y-0.5">
                  <li>Review the theme in the preview modal</li>
                  <li>Make adjustments to colors as needed</li>
                  <li>
                    Use the DEX preview button to see your theme in context
                  </li>
                </ul>
              </div>
            </div>
          </Card>
          <FormInput
            id={`${idPrefix}themePrompt`}
            label="Theme Description"
            value={themePrompt}
            onChange={handleInputChange("themePrompt")}
            placeholder="e.g., A dark blue theme with neon green accents"
            helpText="Describe your desired color scheme and style"
            disabled={isGeneratingTheme}
          />
        </div>
        <div className="mt-1">
          <Button
            onClick={handleGenerateTheme}
            isLoading={isGeneratingTheme}
            loadingText="Generating..."
            disabled={!themePrompt.trim() || isGeneratingTheme}
            variant="secondary"
            size="sm"
            type="button"
          >
            <span className="flex items-center gap-1">
              <div className="i-mdi:magic-wand h-4 w-4"></div>Generate Theme
            </span>
          </Button>
        </div>
      </div>
      <div className="mt-6 pt-4 border-light/10">
        <h4 className="text-sm font-medium mb-2">Theme Preview</h4>
        <p className="text-xs text-gray-400 mb-4">
          See a visual preview of how your DEX will look with the current theme
          configuration.
        </p>
        <div className="flex justify-start">
          <PreviewButton
            brokerName={brokerName || "My DEX"}
            initialSymbol="PERP_BTC_USDC"
            primaryLogo={primaryLogo}
            secondaryLogo={secondaryLogo}
            themeCSS={themeApplied ? currentTheme : undefined}
            buttonText="Preview DEX Design"
          />
        </div>
      </div>
    </>
  );
};

export default ThemeCustomizationSection;
