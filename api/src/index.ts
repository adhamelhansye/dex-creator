import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import dexRoutes from "./routes/dex";
import authRoutes from "./routes/auth";
import adminRoutes from "./routes/admin";
import themeRoutes from "./routes/theme";
import graduationRoutes from "./routes/graduation";
import { prisma } from "./lib/prisma";
import { authMiddleware, adminMiddleware } from "./lib/auth";
import {
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

const app = new Hono();

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

const port = process.env.PORT || 3001;
console.log(`Server is running on port ${port}`);

prisma
  .$connect()
  .then(async () => {
    console.log("Connected to the database");

    try {
      console.log("🔍 Checking broker creation permissions on startup...");
      const environment = getCurrentEnvironment();
      const permissionData = await checkBrokerCreationPermissions(environment);
      console.log(
        "✅ Broker creation permissions check completed:",
        permissionData
      );
    } catch (error) {
      console.warn("⚠️ Broker creation permissions check failed:", error);
      console.warn(
        "This may affect broker creation functionality, but the server will continue to start."
      );
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
      console.warn("⚠️ Gas balance check failed:", error);
      console.warn(
        "Unable to verify gas balances. Monitor wallet balances manually."
      );
    }
  })
  .catch((err: Error) => {
    console.error("Failed to connect to the database:", err);
    process.exit(1);
  });

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

serve({
  fetch: app.fetch,
  port: Number(port),
});
