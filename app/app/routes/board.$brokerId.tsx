import { Navigate, useLocation, useParams } from "@remix-run/react";
import { getPreferredLang } from "~/i18n";

// Redirect legacy /board/:brokerId route to localized /:lang/board/:brokerId path
export default function BoardBrokerIdRedirect() {
  const { brokerId } = useParams();
  const { search } = useLocation();

  const preferredLang = getPreferredLang();

  if (brokerId) {
    return (
      <Navigate to={`/${preferredLang}/board/${brokerId}${search}`} replace />
    );
  }

  return <Navigate to={`/${preferredLang}/board${search}`} replace />;
}
