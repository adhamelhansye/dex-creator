import { Navigate, useLocation, useParams } from "@remix-run/react";
import { getPreferredLang } from "~/i18n";

const ALLOWED_PAGES = ["card", "config", "graduation"] as const;

// Redirect legacy /dex/:page route to localized /:lang/dex path
export default function DexPageRedirect() {
  const { page } = useParams();
  const { search } = useLocation();

  const preferredLang = getPreferredLang();

  if (page && ALLOWED_PAGES.includes(page as (typeof ALLOWED_PAGES)[number])) {
    return <Navigate to={`/${preferredLang}/dex/${page}${search}`} replace />;
  }

  return <Navigate to={`/${preferredLang}/dex${search}`} replace />;
}
