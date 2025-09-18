import { describe, expect, it } from "vitest";
import { validateCSS, sanitizeCSS } from "../../src/lib/cssValidator";

describe("CSS Validator", () => {
  describe("validateCSS", () => {
    it("should validate empty CSS as valid", () => {
      const result = validateCSS("");
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should validate basic theme CSS as valid", () => {
      const validCSS = `:root {
        --oui-color-primary: 176 132 233;
        --oui-color-base-1: 93 83 123;
        --oui-color-base-10: 14 13 18;
        --oui-color-base-foreground: 255 255 255;
      }`;

      const result = validateCSS(validCSS);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should detect invalid RGB color values", () => {
      const invalidCSS = `:root {
        --oui-color-primary: 300 132 233;
        --oui-color-base-1: 93 83 300;
      }`;

      const result = validateCSS(invalidCSS);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(
        result.errors.some(error => error.includes("invalid RGB values"))
      ).toBe(true);
    });

    it("should detect dangerous CSS patterns", () => {
      const dangerousCSS = `:root {
        --oui-color-primary: 176 132 233;
        background: url('javascript:alert("xss")');
      }`;

      const result = validateCSS(dangerousCSS);
      expect(result.isValid).toBe(false);
      expect(
        result.errors.some(error => error.includes("javascript: URLs"))
      ).toBe(true);
    });

    it("should warn about missing :root selector", () => {
      const cssWithoutRoot = `.my-class {
        color: red;
      }`;

      const result = validateCSS(cssWithoutRoot);
      expect(result.warnings.some(warning => warning.includes(":root"))).toBe(
        true
      );
    });

    it("should warn about missing theme properties", () => {
      const incompleteCSS = `:root {
        --oui-color-primary: 176 132 233;
      }`;

      const result = validateCSS(incompleteCSS);
      expect(
        result.warnings.some(warning =>
          warning.includes("Missing recommended theme properties")
        )
      ).toBe(true);
    });
  });

  describe("sanitizeCSS", () => {
    it("should remove @import statements", () => {
      const css = `@import url('malicious.css');
      :root {
        --oui-color-primary: 176 132 233;
      }`;

      const sanitized = sanitizeCSS(css);
      expect(sanitized).not.toContain("@import");
      expect(sanitized).toContain("--oui-color-primary");
    });

    it("should remove javascript: URLs", () => {
      const css = `:root {
        --oui-color-primary: 176 132 233;
        background: url('javascript:alert("xss")');
      }`;

      const sanitized = sanitizeCSS(css);
      expect(sanitized).not.toContain("javascript:");
      expect(sanitized).toContain("--oui-color-primary");
    });

    it("should remove CSS expressions", () => {
      const css = `:root {
        --oui-color-primary: 176 132 233;
        width: expression(alert('xss'));
      }`;

      const sanitized = sanitizeCSS(css);
      expect(sanitized).not.toContain("expression(");
      expect(sanitized).toContain("--oui-color-primary");
    });

    it("should handle empty CSS", () => {
      const sanitized = sanitizeCSS("");
      expect(sanitized).toBe("");
    });
  });
});
