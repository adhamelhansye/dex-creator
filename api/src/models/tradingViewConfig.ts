import { z } from "zod";

export const ColorConfigSchema = z.object({
  upColor: z.string().optional(),
  downColor: z.string().optional(),
  pnlUpColor: z.string().optional(),
  pnlDownColor: z.string().optional(),
  chartBG: z.string().optional(),
});

export type ColorConfigInterface = z.infer<typeof ColorConfigSchema>;

export function validateTradingViewColorConfig(
  config: string
): ColorConfigInterface {
  try {
    const parsed = JSON.parse(config);
    return ColorConfigSchema.parse(parsed);
  } catch (error) {
    throw new Error(
      `Invalid TradingView color configuration: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

export function stringifyTradingViewColorConfig(
  config: ColorConfigInterface
): string {
  return JSON.stringify(config);
}
