import { Link, useParams } from "@remix-run/react";
import type { LinkProps } from "@remix-run/react";
import { useCallback } from "react";
import { getLocalePathFromPathname, defaultLng } from "~/i18n";

/**
 * Builds a path with the current route's $lang prefix.
 * If path already has a valid locale prefix, returns it unchanged.
 */
function buildLocalizedPath(path: string, lang: string | undefined): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (getLocalePathFromPathname(normalized)) {
    return normalized;
  }
  const locale = lang || defaultLng;
  return `/${locale}${normalized}`;
}

/**
 * Hook to get a function that prefixes paths with the current $lang param.
 * Use for navigate() and href in components under the $lang layout.
 */
export function useLocalizedPath(): (path: string) => string {
  const params = useParams();
  const lang = params.lang as string | undefined;
  return useCallback((path: string) => buildLocalizedPath(path, lang), [lang]);
}

/**
 * Remix Link that automatically prepends the current $lang to the "to" path.
 * Use for in-app navigation; external URLs are left unchanged.
 */
export function LocalizedLink({ to, ...rest }: LinkProps & { to: string }) {
  const params = useParams();
  const lang = params.lang as string | undefined;
  const isExternal =
    typeof to === "string" && (to.startsWith("http") || to.startsWith("//"));
  const localizedTo = isExternal ? to : buildLocalizedPath(to as string, lang);
  return <Link to={localizedTo} {...rest} />;
}
