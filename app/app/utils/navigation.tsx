import { HTMLAttributeAnchorTarget, ReactNode } from "react";
import { CampaignIcon } from "../icons/CampaignIcon";

export interface NavItem {
  path: string;
  title: ReactNode;
  icon?: ReactNode;
  target?: HTMLAttributeAnchorTarget | undefined;
}

export const navigationItems: NavItem[] = [
  {
    path: "https://app.orderly.network/campaigns",
    title: (
      <div className="flex items-center gap-1">
        <span>UCC</span> <CampaignIcon />
      </div>
    ),
    target: "_blank",
  },
  {
    path: "/",
    title: "Home",
  },
  {
    path: "/board",
    title: "Board",
  },
  {
    path: "/case-studies",
    title: "Case Studies",
  },
  {
    path: "/distributor",
    title: "Distributor",
  },
  {
    path: "/dex",
    title: "My DEX",
  },
];

/**
 * Check if the given path is the currently active path
 * @param currentPath Current route path
 * @param targetPath Target path
 * @param target Target attribute of the link
 */
export function isPathActive(
  currentPath: string,
  targetPath: string,
  target: HTMLAttributeAnchorTarget | undefined
): boolean {
  // External links are not active
  if (target === "_blank") return false;

  // Exact match for home page
  if (targetPath === "/" && currentPath === "/") return true;

  // Other paths use prefix matching
  if (targetPath !== "/" && currentPath.startsWith(targetPath)) return true;

  return false;
}

/**
 * Get the complete path with query parameters
 */
export function getPathWithSearch(path: string, search: string): string {
  // External links do not add query parameters
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return `${path}${search}`;
}
