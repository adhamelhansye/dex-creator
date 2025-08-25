import React from "react";
import NavigationMenuEditor from "./NavigationMenuEditor";
import CustomMenuEditor from "./CustomMenuEditor";

export interface NavigationMenuProps {
  enabledMenus: string;
  setEnabledMenus: (value: string) => void;
  customMenus: string;
  setCustomMenus: (value: string) => void;
  enableCampaigns: boolean;
  setEnableCampaigns: (value: boolean) => void;
}

const NavigationMenuSection: React.FC<NavigationMenuProps> = ({
  enabledMenus,
  setEnabledMenus,
  customMenus,
  setCustomMenus,
  enableCampaigns,
  setEnableCampaigns,
}) => (
  <div className="space-y-6">
    <NavigationMenuEditor
      value={enabledMenus}
      onChange={setEnabledMenus}
      className="slide-fade-in"
    />

    <CustomMenuEditor
      value={customMenus}
      onChange={setCustomMenus}
      className="slide-fade-in-delayed"
    />

    {/* ORDER Token Campaigns Section */}
    <div className="space-y-4 slide-fade-in">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          id="enableCampaigns"
          checked={enableCampaigns}
          onChange={e => setEnableCampaigns(e.target.checked)}
          className="mt-1 h-4 w-4 text-primary accent-primary bg-background-dark border-light/30 rounded focus:ring-primary/50"
        />
        <div className="flex-1">
          <label
            htmlFor="enableCampaigns"
            className="text-sm font-medium cursor-pointer"
          >
            Enable ORDER Token Campaigns
          </label>
          <p className="text-xs text-gray-400 mt-1">
            Enable ORDER token-related features and campaigns menu in your DEX
          </p>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="i-mdi:information-outline h-5 w-5 text-blue-300 mt-0.5"></div>
          <div>
            <h4 className="text-base font-bold text-blue-300 mb-2">
              About ORDER Token Campaigns
            </h4>
            <div className="text-xs text-gray-300 space-y-2">
              <p>
                When enabled, this feature adds ORDER token-related links and
                menu items to your DEX including:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>ORDER token campaigns navigation links</li>
                <li>Links to ORDER token-related pages</li>
              </ul>
              <p className="pt-2 text-blue-200">
                <strong>Note:</strong> This is an optional feature that adds
                navigation links for ORDER token campaigns.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default NavigationMenuSection;
