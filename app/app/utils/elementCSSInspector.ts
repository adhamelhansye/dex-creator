export interface ElementCSSVariable {
  name: string;
  value: string;
  computedValue: string;
}

export function extractCSSVariablesFromElement(
  element: HTMLElement
): ElementCSSVariable[] {
  const finalComputedStyle = window.getComputedStyle(element);
  const rootStyle = window.getComputedStyle(document.documentElement);
  const allVarNames = new Set<string>();

  function processElement(el: HTMLElement) {
    const inlineStyle = el.getAttribute("style");
    if (inlineStyle) {
      const regex = /--([a-zA-Z0-9-]+):\s*([^;]+)/g;
      let match;
      while ((match = regex.exec(inlineStyle)) !== null) {
        const varName = match[1].trim();
        if (varName.startsWith("oui-")) {
          allVarNames.add(varName);
        }
      }
    }

    try {
      const stylesheets = Array.from(document.styleSheets);
      for (const sheet of stylesheets) {
        try {
          const rules = Array.from(sheet.cssRules || sheet.rules || []);
          for (const rule of rules) {
            if (rule instanceof CSSStyleRule) {
              try {
                const selector = rule.selectorText;
                if (
                  selector &&
                  (el.matches(selector) || el.querySelector(selector))
                ) {
                  const cssText = rule.cssText || rule.style?.cssText || "";
                  const varMatches = cssText.match(/var\(--[^)]+\)/g);
                  if (varMatches) {
                    varMatches.forEach(varMatch => {
                      const varNameMatch = varMatch.match(/var\(--([^),]+)/);
                      if (varNameMatch) {
                        const varName = varNameMatch[1].trim();
                        if (varName.startsWith("oui-")) {
                          allVarNames.add(varName);
                        }
                      }
                    });
                  }
                }
              } catch {
                // Invalid selector, skip
              }
            }
          }
        } catch {
          // Cross-origin stylesheet, skip
        }
      }
    } catch {
      // Stylesheet access failed
    }
  }

  processElement(element);

  const allChildren = element.querySelectorAll("*");
  allChildren.forEach(child => {
    processElement(child as HTMLElement);
  });

  const variables: ElementCSSVariable[] = [];

  for (const varName of allVarNames) {
    const fullVarName = `--${varName}`;
    const computedValue = finalComputedStyle
      .getPropertyValue(fullVarName)
      .trim();
    const rootValue = rootStyle.getPropertyValue(fullVarName).trim();

    let definedValue = rootValue;
    const inlineStyle = element.getAttribute("style");
    if (inlineStyle) {
      const regex = new RegExp(
        `--${varName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}:\\s*([^;]+)`
      );
      const match = inlineStyle.match(regex);
      if (match) {
        definedValue = match[1].trim();
      }
    }

    const finalComputed = computedValue || rootValue || definedValue;

    if (finalComputed) {
      variables.push({
        name: varName,
        value: definedValue || rootValue || computedValue,
        computedValue: finalComputed,
      });
    }
  }

  return variables.sort((a, b) => a.name.localeCompare(b.name));
}

export function getElementPath(element: HTMLElement): string {
  const path: string[] = [];
  let current: HTMLElement | null = element;

  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase();

    if (current.id) {
      selector += `#${current.id}`;
      path.unshift(selector);
      break;
    }

    if (current.className && typeof current.className === "string") {
      const classes = current.className
        .split(" ")
        .filter(c => c && !c.startsWith("orderly-"))
        .slice(0, 2)
        .join(".");
      if (classes) {
        selector += `.${classes}`;
      }
    }

    const parentElement: HTMLElement | null = current.parentElement;
    if (parentElement) {
      const currentTagName = current.tagName;
      const siblings = Array.from(parentElement.children).filter(
        (el): el is HTMLElement =>
          el instanceof HTMLElement && el.tagName === currentTagName
      );
      if (siblings.length > 1 && current) {
        const index = siblings.indexOf(current) + 1;
        selector += `:nth-of-type(${index})`;
      }
    }

    path.unshift(selector);
    current = parentElement;
  }

  return path.join(" > ");
}
