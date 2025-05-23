import React from "react";
import NavigationMenuEditor from "./NavigationMenuEditor";

export interface NavigationMenuProps {
  enabledMenus: string;
  setEnabledMenus: (value: string) => void;
}

const NavigationMenuSection: React.FC<NavigationMenuProps> = ({
  enabledMenus,
  setEnabledMenus,
}) => (
  <NavigationMenuEditor
    value={enabledMenus}
    onChange={value => setEnabledMenus(value)}
  />
);

export default NavigationMenuSection;
