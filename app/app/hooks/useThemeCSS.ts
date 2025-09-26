import { useCallback } from "react";
import { parseCSSVariables, generateThemeCSS } from "../utils/cssParser";

export function useThemeCSS(defaultTheme: string) {
  const updateCssValue = useCallback(
    (
      variableName: string,
      newValue: string,
      setCurrentTheme: (updater: (prev: string | null) => string) => void
    ) => {
      setCurrentTheme(prevTheme => {
        const baseTheme = prevTheme || defaultTheme;
        const cssVariables = parseCSSVariables(baseTheme);
        cssVariables[variableName] = newValue;
        return generateThemeCSS(cssVariables);
      });
    },
    [defaultTheme]
  );

  const updateCssColor = useCallback(
    (
      variableName: string,
      newColorHex: string,
      setCurrentTheme: (updater: (prev: string | null) => string) => void
    ) => {
      const hexToRgbSpaceSeparated = (hex: string) => {
        hex = hex.replace("#", "");
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        return `${r} ${g} ${b}`;
      };

      const newColorRgb = hexToRgbSpaceSeparated(newColorHex);

      setCurrentTheme(prevTheme => {
        const baseTheme = prevTheme || defaultTheme;
        const cssVariables = parseCSSVariables(baseTheme);

        if (variableName.startsWith("oui-color")) {
          cssVariables[variableName] = newColorRgb;
        } else if (variableName.startsWith("gradient")) {
          cssVariables[`oui-${variableName}`] = newColorRgb;
        }

        return generateThemeCSS(cssVariables);
      });
    },
    [defaultTheme]
  );

  return {
    updateCssValue,
    updateCssColor,
  };
}
