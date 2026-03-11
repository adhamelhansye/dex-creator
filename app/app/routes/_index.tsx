import { useEffect } from "react";
import { useNavigate } from "@remix-run/react";
import { getPreferredLang } from "~/i18n";

export default function RootIndex() {
  const navigate = useNavigate();
  useEffect(() => {
    const lang = getPreferredLang();
    navigate(`/${lang}`, { replace: true });
  }, [navigate]);
  return null;
}
