import { z } from "@hono/zod-openapi";

export const ThemeErrorResponseSchema = z
  .object({
    error: z.string().openapi({
      description: "Error message",
      example: "Failed to modify theme",
    }),
    message: z.string().optional().openapi({
      description: "Additional error details",
      example: "CSS validation failed",
    }),
  })
  .openapi("ThemeErrorResponse");

export const ThemePromptSchema = z.object({
  prompt: z.string().min(3).max(100).openapi({
    description: "Description of the desired theme modifications",
    example: "Make it more purple with gold accents",
  }),
  currentTheme: z.string().optional().openapi({
    description: "Current CSS theme to base modifications on",
    example: ":root { --oui-color-primary: 176 132 233; }",
  }),
});

export const ThemeModifyResponseSchema = z
  .object({
    themes: z.array(z.string()).openapi({
      description: "Array of 3 generated CSS theme variants",
      example: [
        ":root { --oui-color-primary: 147 51 234; }",
        ":root { --oui-color-primary: 168 85 247; }",
        ":root { --oui-color-primary: 192 132 252; }",
      ],
    }),
  })
  .openapi("ThemeModifyResponse");

export const ElementInfoSchema = z.object({
  elementSelector: z.string().openapi({
    description: "CSS selector for the element",
    example: ".custom-button",
  }),
  computedStyles: z.record(z.string(), z.string()).openapi({
    description: "Computed CSS styles for the element",
    example: {
      color: "rgb(255, 255, 255)",
      "background-color": "rgb(0, 0, 0)",
    },
  }),
});

export const FineTuneSchema = z.object({
  prompt: z.string().min(3).max(200).openapi({
    description: "Description of desired CSS modifications",
    example: "Make the button more rounded with a gradient background",
  }),
  html: z.string().min(1).openapi({
    description: "HTML structure of the element and its children",
    example: "<div class='custom-button'><span>Click me</span></div>",
  }),
  elements: z.array(ElementInfoSchema).openapi({
    description: "Array of element information with computed styles",
  }),
  cssVariables: z.record(z.string(), z.string()).openapi({
    description: "Current CSS variables",
    example: { "--oui-color-primary": "176 132 233" },
  }),
  existingOverrides: z.string().optional().openapi({
    description: "Existing CSS overrides to include",
    example: ".custom-button { color: white; }",
  }),
});

export const FineTuneResponseSchema = z
  .object({
    overrides: z.array(z.string()).openapi({
      description: "Array of 3 generated CSS override variants",
      example: [
        ".custom-button { border-radius: 8px; background: linear-gradient(...); }",
        ".custom-button { border-radius: 12px; background: linear-gradient(...); }",
        ".custom-button { border-radius: 16px; background: linear-gradient(...); }",
      ],
    }),
  })
  .openapi("FineTuneResponse");
