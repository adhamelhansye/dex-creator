import React from "react";
import NavigationMenuEditor from "./NavigationMenuEditor";
import CustomMenuEditor from "./CustomMenuEditor";

export interface NavigationMenuProps {
  enabledMenus: string;
  setEnabledMenus: (value: string) => void;
  customMenus: string;
  setCustomMenus: (value: string) => void;
}

const NavigationMenuSection: React.FC<NavigationMenuProps> = ({
  enabledMenus,
  setEnabledMenus,
  customMenus,
  setCustomMenus,
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
  </div>
);

export default NavigationMenuSection;
