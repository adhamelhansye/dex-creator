import { Outlet, useParams, useLocation, Navigate } from "@remix-run/react";
import { useEffect } from "react";
import { LocaleEnum, defaultLng, i18n, getPreferredLang } from "~/i18n";

const SUPPORTED_LOCALES = Object.values(LocaleEnum) as string[];

/**
 * Top-level app routes that should get a language prefix when visited without one
 * (e.g. /board => /en/board, /dex/config => /en/dex/config). Only these paths are
 * redirected; others fall back to defaultLng. Child routes (e.g. /board/:dexId,
 * /dex/card, /dex/config, /dex/graduation) are matched via prefix (route or route/).
 */
const LOCALIZED_ROUTE_WHITELIST = [
  "/dex",
  "/dex/card",
  "/dex/config",
  "/dex/graduation",
  "/board",
  "/case-studies",
  "/distributor",
  "/points",
  "/referral",
  "/admin",
];

function isWhitelistedRoute(pathname: string): boolean {
  return LOCALIZED_ROUTE_WHITELIST.some(
    route => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export default function LangLayout() {
  const params = useParams();
  const location = useLocation();
  const lang = params.lang;
  const isValidLang = !!lang && SUPPORTED_LOCALES.includes(lang);

  if (!isValidLang) {
    const { pathname, search } = location;

    if (isWhitelistedRoute(pathname)) {
      const preferredLang = getPreferredLang();
      return <Navigate to={`/${preferredLang}${pathname}${search}`} replace />;
    }

    return <Navigate to={`/${defaultLng}`} replace />;
  }

  useEffect(() => {
    if (i18n.language !== lang) {
      i18n.changeLanguage(lang!);
    }
  }, [lang]);

  return <Outlet />;
}
