import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import dexRoutes from "./routes/dex";
import authRoutes from "./routes/auth";
import adminRoutes from "./routes/admin";
import themeRoutes from "./routes/theme";
import graduationRoutes from "./routes/graduation";
import { leaderboard } from "./routes/leaderboard";
import { leaderboardService } from "./services/leaderboardService";
import { prisma } from "./lib/prisma";
import { authMiddleware, adminMiddleware } from "./lib/auth";
import {
  initializeBrokerCreation,
  checkBrokerCreationPermissions,
  checkGasBalances,
} from "./lib/brokerCreation";
import { getCurrentEnvironment } from "./models/dex";

declare module "hono" {
  interface ContextVariableMap {
    userId: string;
    isAdmin?: boolean;
  }
}

export const app = new Hono();

app.use("*", logger());
app.use("*", cors());

app.use("/api/dex/*", authMiddleware);
app.use("/api/theme/*", authMiddleware);
app.use("/api/graduation/*", authMiddleware);

app.use("/api/admin/*", async (c, next) => {
  if (c.req.path === "/api/admin/check") {
    return authMiddleware(c, next);
  } else {
    return adminMiddleware(c, next);
  }
});

app.get("/", c => c.json({ message: "Orderly One API is running" }));
app.route("/api/dex", dexRoutes);
app.route("/api/auth", authRoutes);
app.route("/api/admin", adminRoutes);
app.route("/api/theme", themeRoutes);
app.route("/api/graduation", graduationRoutes);
app.route("/api/leaderboard", leaderboard);

app.notFound(c => {
  return c.json(
    {
      message: "Not Found",
      status: 404,
    },
    404
  );
});

app.onError((err, c) => {
  console.error(`${err}`);
  return c.json(
    {
      message: "Internal Server Error",
      status: 500,
    },
    500
  );
});

if (process.env.NODE_ENV !== "test") {
  if (!process.env.ORDER_RECEIVER_ADDRESS) {
    console.error(
      "❌ Missing required environment variable: ORDER_RECEIVER_ADDRESS"
    );
    process.exit(1);
  }

  prisma
    .$connect()
    .then(async () => {
      console.log("Connected to the database");

      try {
        console.log("🚀 Initializing broker creation system...");
        await initializeBrokerCreation();
        console.log("✅ Broker creation system initialized successfully");
      } catch (error) {
        console.error("❌ Failed to initialize broker creation system:", error);
        process.exit(1);
      }

      try {
        console.log("🔍 Checking broker creation permissions on startup...");
        const environment = getCurrentEnvironment();
        const permissionData =
          await checkBrokerCreationPermissions(environment);
        console.log(
          "✅ Broker creation permissions check completed:",
          permissionData
        );
      } catch (error) {
        console.error("⚠️ Broker creation permissions check failed:", error);
        process.exit(1);
      }

      try {
        console.log("💰 Checking gas balances on all chains...");
        const environment = getCurrentEnvironment();
        const gasBalanceData = await checkGasBalances(environment);
        if (gasBalanceData.success) {
          console.log("✅ All chains have sufficient gas balances");
        } else {
          console.warn("⚠️ Gas balance warnings detected:");
          gasBalanceData.warnings.forEach(warning => console.warn(warning));
          console.warn(
            "This may affect broker creation functionality. Consider adding ETH to the wallet."
          );
        }
      } catch (error) {
        console.error("⚠️ Gas balance check failed:", error);
        process.exit(1);
      }
    })
    .catch((err: Error) => {
      console.error("Failed to connect to the database:", err);
      process.exit(1);
    });
}

if (process.env.NODE_ENV !== "test") {
  process.on("SIGINT", async () => {
    leaderboardService.stop();
    await prisma.$disconnect();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    leaderboardService.stop();
    await prisma.$disconnect();
    process.exit(0);
  });
}

if (process.env.NODE_ENV !== "test") {
  const port = process.env.PORT || 3001;
  console.log(`Server is running on port ${port}`);
  serve({
    fetch: app.fetch,
    port: Number(port),
  });
}
