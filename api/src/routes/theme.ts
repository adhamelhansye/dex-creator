import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { OpenAI } from "openai";

// Create a router for theme-related routes
const themeRoutes = new Hono();

// Define the schema for the theme modification request
const themePromptSchema = z.object({
  prompt: z.string().min(3).max(1000),
  currentTheme: z.string().optional(),
});

// Helper function to create the OpenAI client
function createOpenAIClient() {
  const apiKey = process.env.CEREBRAS_API_KEY;
  if (!apiKey) {
    throw new Error("CEREBRAS_API_KEY environment variable is not set");
  }

  return new OpenAI({
    apiKey,
    baseURL: process.env.CEREBRAS_API_URL || "https://api.cerebras.ai/v1",
  });
}

// Endpoint to modify theme based on user prompt
themeRoutes.post("/modify", zValidator("json", themePromptSchema), async c => {
  try {
    const { prompt, currentTheme } = c.req.valid("json");

    // Create OpenAI client with Cerebras endpoint
    const openai = createOpenAIClient();

    // Default theme content
    const defaultTheme = `:root {
  --oui-font-family: 'Manrope', sans-serif;

  /* colors */
  --oui-color-primary: 176 132 233;
  --oui-color-primary-light: 213 190 244;
  --oui-color-primary-darken: 137 76 209;
  --oui-color-primary-contrast: 255 255 255;

  --oui-color-link: 189 107 237;
  --oui-color-link-light: 217 152 250;

  --oui-color-secondary: 255 255 255;
  --oui-color-tertiary: 218 218 218;
  --oui-color-quaternary: 218 218 218;

  --oui-color-danger: 245 97 139;
  --oui-color-danger-light: 250 167 188;
  --oui-color-danger-darken: 237 72 122;
  --oui-color-danger-contrast: 255 255 255;

  --oui-color-success: 41 233 169;
  --oui-color-success-light: 101 240 194;
  --oui-color-success-darken: 0 161 120;
  --oui-color-success-contrast: 255 255 255;

  --oui-color-warning: 255 209 70;
  --oui-color-warning-light: 255 229 133;
  --oui-color-warning-darken: 255 152 0;
  --oui-color-warning-contrast: 255 255 255;

  --oui-color-fill: 36 32 47;
  --oui-color-fill-active: 40 46 58;

  --oui-color-base-1: 93 83 123;
  --oui-color-base-2: 81 72 107;
  --oui-color-base-3: 68 61 69;
  --oui-color-base-4: 57 52 74;
  --oui-color-base-5: 51 46 66;
  --oui-color-base-6: 43 38 56;
  --oui-color-base-7: 36 32 47;
  --oui-color-base-8: 29 26 38;
  --oui-color-base-9: 22 20 28;
  --oui-color-base-10: 14 13 18;

  --oui-color-base-foreground: 255 255 255;
  --oui-color-line: 255 255 255;

  --oui-color-trading-loss: 245 97 139;
  --oui-color-trading-loss-contrast: 255 255 255;
  --oui-color-trading-profit: 41 233 169;
  --oui-color-trading-profit-contrast: 255 255 255;

  /* gradients */
  --oui-gradient-primary-start: 40 0 97;
  --oui-gradient-primary-end: 189 107 237;

  --oui-gradient-secondary-start: 81 42 121;
  --oui-gradient-secondary-end: 176 132 233;

  --oui-gradient-success-start: 1 83 68;
  --oui-gradient-success-end: 41 223 169;

  --oui-gradient-danger-start: 153 24 76;
  --oui-gradient-danger-end: 245 97 139;

  --oui-gradient-brand-start: 231 219 249;
  --oui-gradient-brand-end: 159 107 225;
  --oui-gradient-brand-stop-start: 6.62%;
  --oui-gradient-brand-stop-end: 86.5%;
  --oui-gradient-brand-angle: 17.44deg;

  --oui-gradient-warning-start: 152 58 8;
  --oui-gradient-warning-end: 255 209 70;

  --oui-gradient-neutral-start: 27 29 24;
  --oui-gradient-neutral-end: 38 41 46;

  /* rounded */
  --oui-rounded-sm: 2px;
  --oui-rounded: 4px;
  --oui-rounded-md: 6px;
  --oui-rounded-lg: 8px;
  --oui-rounded-xl: 12px;
  --oui-rounded-2xl: 16px;
  --oui-rounded-full: 9999px;

  /* spacing */
  --oui-spacing-xs: 20rem;
  --oui-spacing-sm: 22.5rem;
  --oui-spacing-md: 26.25rem;
  --oui-spacing-lg: 30rem;
  --oui-spacing-xl: 33.75rem;
}`;

    // Use the provided currentTheme or fall back to the default theme
    const baseTheme = currentTheme || defaultTheme;

    // System prompt to guide the AI
    const systemPrompt = `You are an expert CSS designer specializing in theme creation for trading platforms. 
Your task is to modify the provided CSS theme based on the user's description.

THIS IS A DARK THEME: All backgrounds must be dark and all foreground/text elements must be light for proper contrast and readability.

The CSS theme uses RGB color values in the format "R G B" (space-separated values).
For example, "176 132 233" represents RGB(176, 132, 233).

Guidelines:
1. NEVER add new CSS variables that don't exist in the original theme
2. NEVER remove any existing CSS variables from the original theme
3. Maintain the EXACT SAME variable names and structure as the original theme
4. NEVER change the rem values for spacing variables (--oui-spacing-xs, --oui-spacing-sm, etc.) as these are container sizes, not spacing between elements
5. Maintain the same RGB format with space-separated values (e.g., "176 132 233")
6. DARK THEME REQUIREMENT: All backgrounds should be dark, all text/foreground elements should be light:
   - Base colors (base-1 through base-10) MUST be dark shades, as they are background colors
   - Foreground colors like base-foreground, primary-contrast, etc. MUST be light (e.g., white or near-white)
   - Even the lightest background (base-1) should still be dark enough that white text is clearly readable on it
   - NEVER create a light theme - all backgrounds must remain dark and all text must remain light
7. CRITICALLY IMPORTANT: Ensure proper contrast between text and background colors:
   - The --oui-color-base-foreground (text color) must be LIGHT (like white "255 255 255") for contrast with dark backgrounds
   - The base colors (base-1 through base-10) are DARK BACKGROUND colors for different UI elements
   - The trading profit/loss colors (--oui-color-trading-profit and --oui-color-trading-loss) are FOREGROUND/TEXT colors, not backgrounds
   - Trading profit/loss colors must be BRIGHT/LIGHT enough to be clearly visible on dark backgrounds
   - Both trading profit AND trading loss must be bright - profit should be bright green, loss should be bright red
   - Never make trading colors dark or muted as they must have good contrast against dark backgrounds
   - Without proper contrast, text becomes unreadable in the UI
8. ABSOLUTELY CRITICAL: Base colors MUST progress from LIGHTEST (base-1) to DARKEST (base-10):
   - base-1 is the LIGHTEST background color (highest RGB values) but still DARK enough for white text to be readable
   - base-10 is the DARKEST background color (lowest RGB values)
   - Each step from base-1 to base-10 should get progressively darker
   - Example of correct progression: 
     base-1: "93 83 123" (lighter, but still dark enough for white text)
     base-2: "81 72 107" (slightly darker)
     ...and so on...
     base-9: "22 20 28" (very dark)
     base-10: "14 13 18" (darkest)
   - This progression is NON-NEGOTIABLE
9. For status colors (danger, success, warning):
   - Danger should be a red/orange hue that clearly indicates errors/problems
   - Success should be a green hue that clearly indicates positive outcomes
   - Warning should be an amber/yellow hue that clearly indicates caution
   - Ensure these colors have consistent saturation levels and make visual sense
10. Maintain visual consistency with gradients:
   - --oui-gradient-brand-start should be visually similar to --oui-color-primary-light
   - --oui-gradient-brand-end should be visually similar to --oui-color-primary
   - This ensures a consistent visual language throughout the interface
11. DO NOT modify the --oui-font-family property value
12. Do not add any comments or explanations in your response
13. Return ONLY the complete, modified CSS theme with all original variables intact

IMPORTANT EXAMPLES:
1. For --oui-color-danger, use colors like "245 97 139" (red/pink) NOT "41 233 169" (green)
2. For --oui-color-success, use colors like "41 233 169" (green) NOT "245 97 139" (red/pink) 
3. For --oui-color-warning, use colors like "255 209 70" (amber/yellow) NOT blues or purples
4. DO NOT CHANGE any spacing values (--oui-spacing-xs: 20rem must remain exactly 20rem)
5. For a dark theme, always use a LIGHT --oui-color-base-foreground like "255 255 255" (white) or similar
6. For trading colors (both shown on dark backgrounds):
   - --oui-color-trading-profit should be a BRIGHT GREEN like "41 233 169" (NOT dark green like "0 100 0")
   - --oui-color-trading-loss should be a BRIGHT RED like "245 97 139" (NOT dark red like "139 0 0")
   - Both colors need to be bright/vivid to be visible on dark backgrounds
7. If primary is "176 132 233" (purple), then gradient-brand-end should be similar, like "159 107 225" (also purple)
8. CORRECT base color progression (from lightest to darkest) - ALL STILL DARK ENOUGH FOR WHITE TEXT:
   --oui-color-base-1: 93 83 123 (LIGHTEST but still dark enough for white text)
   --oui-color-base-2: 81 72 107
   --oui-color-base-3: 68 61 90
   --oui-color-base-4: 57 52 74
   --oui-color-base-5: 51 46 66
   --oui-color-base-6: 43 38 56
   --oui-color-base-7: 36 32 47
   --oui-color-base-8: 29 26 38
   --oui-color-base-9: 22 20 28
   --oui-color-base-10: 14 13 18 (DARKEST)

Current theme structure (ALL of these must be preserved with the same names):
- Primary colors (primary, primary-light, primary-darken, primary-contrast)
  - primary-contrast should be LIGHT (like "255 255 255" white) for use on dark backgrounds
- Link colors (link, link-light)
- Status colors (success, warning, danger with their variants)
  - status-contrast colors should be LIGHT for readability on dark backgrounds
- Base colors (base-1 through base-10) - THESE ARE DARK BACKGROUND COLORS for the UI:
  - base-1 is the LIGHTEST (highest RGB values) but still dark enough for white text
  - base-10 is the DARKEST (lowest RGB values)
  - All base colors must maintain this strict lightness progression
  - All base colors must remain DARK enough for white text to be readable
- Base foreground (--oui-color-base-foreground) - THIS MUST BE LIGHT (like white) for contrast on dark backgrounds
- Trading-specific colors (trading-loss, trading-profit) - THESE ARE TEXT COLORS for displaying values:
  - BOTH must be BRIGHT enough for good visibility on dark backgrounds
  - trading-profit must be bright green (not dark green)
  - trading-loss must be bright red (not dark red)
- Gradients (primary, secondary, success, danger, brand, warning, neutral)
  - Note: gradient-brand-start should be similar to primary-light, gradient-brand-end similar to primary
- Spacing values (--oui-spacing-xs through --oui-spacing-xl)

IMPORTANT: Return ONLY the complete, modified CSS theme with no additional text or variables.`;

    const response = await openai.chat.completions.create({
      model: "llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `Please modify this CSS theme based on the following description: ${prompt}\n\nCurrent theme:\n${baseTheme}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    // Extract the modified theme from the response
    const modifiedTheme = response.choices[0]?.message.content?.trim();

    if (!modifiedTheme) {
      return c.json({ error: "Failed to generate theme" }, { status: 500 });
    }

    return c.json({ theme: modifiedTheme }, { status: 200 });
  } catch (error) {
    console.error("Error modifying theme:", error);
    let message = "Failed to modify theme";

    if (error instanceof Error) {
      message = error.message;
    }

    return c.json({ error: message }, { status: 500 });
  }
});

export default themeRoutes;
