import { i18n } from "~/i18n";

/**
 * Format distributor tier name for display.
 * Maps known tier keys (public, silver, gold, platinum, diamond) to localized labels;
 * falls back to title-case for unknown tiers.
 *
 * @param tier - Raw tier string (e.g. "PUBLIC", "gold") or null/undefined
 * @returns Localized tier label, title-cased fallback, or "--" when empty
 */
export const formatTier = (tier: string | null | undefined): string => {
  if (!tier) return "--";
  const normalized = tier.toLowerCase();

  const tierKeyMap: Record<string, string> = {
    public: i18n.t("distributor.public"),
    silver: i18n.t("distributor.silver"),
    gold: i18n.t("distributor.gold"),
    platinum: i18n.t("distributor.platinum"),
    diamond: i18n.t("distributor.diamond"),
  };

  return (
    tierKeyMap[normalized] ||
    tier.charAt(0).toUpperCase() + tier.slice(1).toLowerCase()
  );
};
