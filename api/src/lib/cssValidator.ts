import { parse } from "css-tree";

export interface CSSValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateCSS(cssString: string): CSSValidationResult {
  const result: CSSValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  if (!cssString || cssString.trim() === "") {
    return result;
  }

  try {
    parse(cssString, {
      onParseError: error => {
        result.isValid = false;
        result.errors.push(`Parse error: ${error.formattedMessage}`);
      },
    });

    validateThemeStructure(cssString, result);
  } catch (error) {
    result.isValid = false;
    if (error instanceof Error) {
      result.errors.push(`CSS parsing failed: ${error.message}`);
    } else {
      result.errors.push("CSS parsing failed with unknown error");
    }
  }

  return result;
}

function validateThemeStructure(
  cssString: string,
  result: CSSValidationResult
): void {
  if (!cssString.includes(":root")) {
    result.warnings.push(
      "Theme CSS should contain a :root selector with CSS custom properties"
    );
  }

  const requiredProperties = [
    "--oui-color-primary",
    "--oui-color-base-1",
    "--oui-color-base-10",
    "--oui-color-base-foreground",
  ];

  const missingProperties = requiredProperties.filter(
    prop => !cssString.includes(prop)
  );
  if (missingProperties.length > 0) {
    result.warnings.push(
      `Missing recommended theme properties: ${missingProperties.join(", ")}`
    );
  }

  const dangerousPatterns = [
    /@import/i,
    /javascript:/i,
    /expression\s*\(/i,
    /behavior\s*:/i,
    /vbscript:/i,
    /data:.*script/i,
  ];

  dangerousPatterns.forEach((pattern, index) => {
    if (pattern.test(cssString)) {
      result.isValid = false;
      result.errors.push(
        `Potentially dangerous CSS detected: ${getDangerousPatternName(index)}`
      );
    }
  });

  const braceCount = (cssString.match(/{/g) || []).length;
  if (braceCount > 100) {
    result.warnings.push(
      "CSS appears to be very complex. Consider simplifying for better performance."
    );
  }

  validateRGBColorFormat(cssString, result);
}

function validateRGBColorFormat(
  cssString: string,
  result: CSSValidationResult
): void {
  const colorPropertyRegex = /--(oui-color-[^:]+):\s*([^;]+);/g;
  let match;

  while ((match = colorPropertyRegex.exec(cssString)) !== null) {
    const propertyName = match[1];
    const value = match[2].trim();

    if (
      propertyName.includes("gradient") ||
      propertyName.includes("angle") ||
      propertyName.includes("stop")
    ) {
      continue;
    }

    const rgbPattern = /^\d{1,3}\s+\d{1,3}\s+\d{1,3}$/;
    if (!rgbPattern.test(value)) {
      result.warnings.push(
        `Property ${propertyName} should use RGB format with space-separated values (e.g., "255 0 0")`
      );
    } else {
      const rgbValues = value.split(/\s+/).map(v => parseInt(v, 10));
      const invalidValues = rgbValues.filter(v => v < 0 || v > 255);
      if (invalidValues.length > 0) {
        result.errors.push(
          `Property ${propertyName} contains invalid RGB values. Values must be between 0 and 255.`
        );
        result.isValid = false;
      }
    }
  }
}

function getDangerousPatternName(index: number): string {
  const names = [
    "@import declarations",
    "javascript: URLs",
    "CSS expressions",
    "behavior properties",
    "vbscript: URLs",
    "data URLs with scripts",
  ];
  return names[index] || "unknown dangerous pattern";
}

export function sanitizeCSS(cssString: string): string {
  if (!cssString) return "";

  let sanitized = cssString;

  sanitized = sanitized.replace(/@import[^;]*;/gi, "");

  sanitized = sanitized.replace(/javascript\s*:/gi, "");
  sanitized = sanitized.replace(/vbscript\s*:/gi, "");

  sanitized = sanitized.replace(/expression\s*\([^)]*\)/gi, "");

  sanitized = sanitized.replace(/behavior\s*:[^;]*;/gi, "");

  sanitized = sanitized.replace(/data:[^;]*script[^;]*;/gi, "");

  return sanitized.trim();
}
