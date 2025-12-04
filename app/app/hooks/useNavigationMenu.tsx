import { useMemo } from "react";
import { useDistributor } from "../context/DistributorContext";
import { navigationItems } from "../utils/navigation";

export function useNavigationMenu() {
  const { isAmbassador } = useDistributor();

  const menuItems = useMemo(() => {
    if (isAmbassador) {
      return navigationItems.filter(item => item.path !== "/dex");
    }
    return navigationItems;
  }, [isAmbassador]);

  return menuItems;
}
