import { Outlet } from "@remix-run/react";

/**
 * This is a minimal layout route for preview content.
 * It contains no app chrome, headers, footers, or providers.
 * It just renders the child route content directly.
 */
export default function PreviewLayout() {
  return <Outlet />;
}
