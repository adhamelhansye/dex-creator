export type TimePeriod = "daily" | "weekly" | "30d" | "90d";

export const getTimePeriodString = (period: TimePeriod) => {
  switch (period) {
    case "daily":
      return "24h";
    case "weekly":
      return "7d";
    case "30d":
      return "30d";
    case "90d":
      return "90d";
  }
};
