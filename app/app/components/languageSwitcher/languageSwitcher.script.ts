import { useState } from "react";
import { useNavigate, useLocation } from "@remix-run/react";
import { defaultLanguages, i18n, removeLangPrefix, generatePath } from "~/i18n";

export type LanguageSwitcherScriptReturn = ReturnType<
  typeof useLanguageSwitcherScript
>;

export const useLanguageSwitcherScript = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedLang, setSelectedLang] = useState(i18n.language);
  const languages = defaultLanguages;
  const navigate = useNavigate();
  const location = useLocation();

  const onLangChange = async (lang: string, _displayName: string) => {
    setLoading(true);
    setSelectedLang(lang);
    await i18n.changeLanguage(lang);
    const pathWithoutLang = removeLangPrefix(location.pathname);
    const newPath = generatePath({
      path: pathWithoutLang,
      locale: lang,
      search: location.search,
    });
    navigate(newPath, { replace: true });
    setLoading(false);
    setOpen(false);
  };

  return {
    open,
    onOpenChange: setOpen,
    languages,
    selectedLang,
    onLangChange,
    loading,
  };
};
