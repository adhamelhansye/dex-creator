import FormInput from "./FormInput";
import { Card } from "./Card";
import ColorSwatch from "./ColorSwatch";

interface SEOConfigSectionProps {
  seoSiteName: string;
  seoSiteDescription: string;
  seoSiteLanguage: string;
  seoSiteLocale: string;
  seoTwitterHandle: string;
  seoThemeColor: string;
  seoKeywords: string;
  handleInputChange: (
    field: string
  ) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  updateCssColor?: (variableName: string, newColorHex: string) => void;
}

export default function SEOConfigSection({
  seoSiteName,
  seoSiteDescription,
  seoSiteLanguage,
  seoSiteLocale,
  seoTwitterHandle,
  seoThemeColor,
  seoKeywords,
  handleInputChange,
  updateCssColor,
}: SEOConfigSectionProps) {
  return (
    <div className="space-y-4">
      <Card className="mb-3 p-3 slide-fade-in" variant="default">
        <div className="flex items-start gap-2">
          <div className="i-mdi:information-outline text-primary-light h-4 w-4 mt-0.5 flex-shrink-0"></div>
          <div>
            <p className="text-xs text-primary-light font-medium mb-1">
              SEO Configuration
            </p>
            <p className="text-xs text-gray-300 mb-2">
              These settings help optimize how your DEX appears in search
              engines and when shared on social media platforms like Twitter,
              Facebook, and Discord.
            </p>
            <ul className="text-xs text-gray-300 space-y-1 list-disc ml-4">
              <li>
                <strong>Site Name & Description:</strong> Improve search engine
                visibility
              </li>
              <li>
                <strong>Site URL:</strong> Automatically derived from your
                custom domain or repository URL
              </li>
              <li>
                <strong>Twitter Handle:</strong> Credits your account in Twitter
                shares
              </li>
              <li>
                <strong>Theme Color:</strong> Customizes mobile browser
                appearance
              </li>
              <li>
                <strong>Keywords:</strong> Help search engines understand your
                content
              </li>
            </ul>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormInput
          label="Site Name"
          id="seoSiteName"
          value={seoSiteName}
          onChange={handleInputChange("seoSiteName")}
          placeholder="My DEX Platform"
          maxLength={100}
          helpText="The name of your DEX shown in browser titles and social media sharing"
        />

        <FormInput
          label="Site Description"
          id="seoSiteDescription"
          value={seoSiteDescription}
          onChange={handleInputChange("seoSiteDescription")}
          placeholder="A powerful decentralized exchange for seamless trading"
          maxLength={300}
          helpText="A brief description of your DEX shown in search results and social media"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormInput
          label="Site Language"
          id="seoSiteLanguage"
          value={seoSiteLanguage}
          onChange={handleInputChange("seoSiteLanguage")}
          placeholder="en"
          helpText="Language code for your site (e.g., 'en', 'zh', 'es')"
        />

        <FormInput
          label="Site Locale"
          id="seoSiteLocale"
          value={seoSiteLocale}
          onChange={handleInputChange("seoSiteLocale")}
          placeholder="en_US"
          helpText="Locale for social platforms (e.g., 'en_US', 'zh_CN')"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormInput
          label="Twitter Handle"
          id="seoTwitterHandle"
          value={seoTwitterHandle}
          onChange={handleInputChange("seoTwitterHandle")}
          placeholder="@mydex"
          helpText="Your Twitter handle for Twitter Card metadata (include @)"
        />

        <div className="space-y-2">
          <label
            htmlFor="seoThemeColor"
            className="block text-sm font-bold text-gray-300"
          >
            Theme Color
          </label>
          <div className="flex items-center gap-3">
            {updateCssColor ? (
              <div className="flex items-center gap-2">
                <ColorSwatch
                  name="theme-color"
                  displayName="Theme"
                  storedValue={
                    seoThemeColor && /^#[0-9A-Fa-f]{6}$/.test(seoThemeColor)
                      ? seoThemeColor
                          .replace("#", "")
                          .match(/.{2}/g)
                          ?.map(hex => parseInt(hex, 16).toString())
                          .join(" ") || null
                      : null
                  }
                  isValid={/^#[0-9A-Fa-f]{6}$/.test(seoThemeColor)}
                  commaRgb={
                    seoThemeColor && /^#[0-9A-Fa-f]{6}$/.test(seoThemeColor)
                      ? seoThemeColor
                          .replace("#", "")
                          .match(/.{2}/g)
                          ?.map(hex => parseInt(hex, 16).toString())
                          .join(" ") || "0,0,0"
                      : "0,0,0"
                  }
                  textColor="white"
                  needsShadow={true}
                  selectedColors={[]}
                  handleCheckboxChange={() => {}}
                  handleSwatchClick={e => {
                    e.preventDefault();
                    // Create a temporary color input to trigger the color picker
                    const input = document.createElement("input");
                    input.type = "color";
                    input.value = seoThemeColor || "#1a1b23";
                    input.onchange = e => {
                      const target = e.target as HTMLInputElement;
                      const syntheticEvent = {
                        target: { value: target.value },
                      } as React.ChangeEvent<HTMLInputElement>;
                      handleInputChange("seoThemeColor")(syntheticEvent);
                    };
                    input.click();
                  }}
                  onSelectionChange={undefined}
                />
                {seoThemeColor && (
                  <button
                    type="button"
                    onClick={() => {
                      const syntheticEvent = {
                        target: { value: "" },
                      } as React.ChangeEvent<HTMLInputElement>;
                      handleInputChange("seoThemeColor")(syntheticEvent);
                    }}
                    className="px-2 py-1 text-xs text-gray-400 hover:text-gray-300 transition-colors"
                    title="Clear theme color"
                  >
                    Clear
                  </button>
                )}
              </div>
            ) : (
              <input
                type="text"
                id="seoThemeColor"
                value={seoThemeColor}
                onChange={handleInputChange("seoThemeColor")}
                placeholder="#1a1b23"
                className="w-full px-3 py-2 bg-background-dark/50 border border-light/10 rounded-md text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent"
              />
            )}
          </div>
          <p className="text-xs text-gray-400">
            Hex color for mobile browser theme (e.g., #1a1b23)
          </p>
        </div>
      </div>

      <FormInput
        label="Keywords"
        id="seoKeywords"
        value={seoKeywords}
        onChange={handleInputChange("seoKeywords")}
        placeholder="dex, crypto, trading, defi, orderly"
        maxLength={500}
        helpText="Comma-separated keywords for search engines (max 500 characters)"
      />
    </div>
  );
}
