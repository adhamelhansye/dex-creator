import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { OpenAI } from "openai";
import {
  themeRateLimiter,
  createDeploymentRateLimit,
} from "../lib/rateLimiter";

const themeRoutes = new Hono();

const themeRateLimit = createDeploymentRateLimit(themeRateLimiter);

const themePromptSchema = z.object({
  prompt: z.string().min(3).max(100),
  currentTheme: z.string().optional(),
});

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

themeRoutes.post(
  "/modify",
  themeRateLimit,
  zValidator("json", themePromptSchema),
  async c => {
    try {
      const { prompt, currentTheme } = c.req.valid("json");

      const openai = createOpenAIClient();

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

      const baseTheme = currentTheme || defaultTheme;

      const systemPrompt = `You are a CSS theme designer for dark trading platforms. Modify the provided CSS theme based on the user's description.

FORMAT: Use RGB values with spaces (e.g., "176 132 233" for RGB(176,132,233)).

CORE REQUIREMENTS:
- Preserve ALL existing variables - don't add or remove any
- Keep EXACT variable names and structure
- Don't change spacing values (--oui-spacing-xs: 20rem, etc.)
- No comments in response, return ONLY the complete CSS

COLOR GUIDELINES:
1. DARK BACKGROUNDS / LIGHT TEXT - This is non-negotiable:
   • Base colors (base-1 through base-10): Dark backgrounds progressing from lightest (base-1) to darkest (base-10)
   • All foreground/text elements (base-foreground, etc.): Light colors for readability

2. CONTRAST REQUIREMENTS:
   • Text vs Background: White/light text on dark backgrounds
   • Trading colors: Bright green for profit, bright red for loss - MUST be visible on dark backgrounds
   • SCROLLBARS: Critical - Base-7 (scrollbar track) must be VISIBLY DIFFERENT from base-10 (background)
     - Make base-7 at least 3 shades lighter than base-10
     - Primary color (scrollbar thumb) must be bright against the track
     - Example: If base-10 is "14 13 18", base-7 should be "51 46 66" or lighter (NOT "36 32 47")

3. COLOR PROGRESSION:
   • Base-1 (lightest background): Like "93 83 123" - light but still dark enough for white text
   • Base-2 through Base-9: Each step progressively darker
   • Base-10 (darkest): Like "14 13 18"

4. SPECIAL COLORS:
   • Primary: Main accent color (affects scrollbar thumbs)
   • Success: Bright green like "41 233 169"
   • Danger: Bright red like "245 97 139"
   • Warning: Amber/yellow like "255 209 70"
   • Trading-profit: Bright green (visible on dark backgrounds)
   • Trading-loss: Bright red (visible on dark backgrounds)

5. GRADIENT CONSISTENCY:
   • Gradient-brand-start: Similar to primary-light
   • Gradient-brand-end: Similar to primary`;

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
  }
);

export default themeRoutes;
