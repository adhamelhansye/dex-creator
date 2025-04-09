import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import dexRoutes from "./routes/dex";
import authRoutes from "./routes/auth";
import adminRoutes from "./routes/admin";
import { prisma } from "./lib/prisma";

// Custom types for Hono to support typed context variables
declare module "hono" {
  interface ContextVariableMap {
    userId: string;
  }
}

const app = new Hono();

// Middleware
app.use("*", logger());
app.use("*", cors());

// Authentication middleware for protected routes
app.use("/api/dex/*", async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized: No token provided" }, 401);
  }

  const token = authHeader.split(" ")[1];

  try {
    // Find the token in the database
    const tokenRecord = await prisma.token.findUnique({
      where: { token },
      include: { user: true },
    });

    // Check if token exists and is not expired
    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      return c.json({ error: "Unauthorized: Invalid or expired token" }, 401);
    }

    // Set user ID in context for routes to use
    c.set("userId", tokenRecord.userId);

    await next();
  } catch (error) {
    console.error("Authentication error:", error);
    return c.json({ error: "Authentication error" }, 500);
  }
});

// Same auth middleware for admin routes
app.use("/api/admin/*", async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized: No token provided" }, 401);
  }

  const token = authHeader.split(" ")[1];

  try {
    // Find the token in the database
    const tokenRecord = await prisma.token.findUnique({
      where: { token },
      include: { user: true },
    });

    // Check if token exists and is not expired
    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      return c.json({ error: "Unauthorized: Invalid or expired token" }, 401);
    }

    // Set user ID in context for routes to use
    c.set("userId", tokenRecord.userId);

    await next();
  } catch (error) {
    console.error("Authentication error:", error);
    return c.json({ error: "Authentication error" }, 500);
  }
});

// Routes
app.get("/", c => c.json({ message: "DEX Creator API is running" }));
app.route("/api/dex", dexRoutes);
app.route("/api/auth", authRoutes);
app.route("/api/admin", adminRoutes);

// Error handling
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

// Start the server
const port = process.env.PORT || 3001;
console.log(`Server is running on port ${port}`);

// Database connection check
prisma
  .$connect()
  .then(() => {
    console.log("Connected to the database");
  })
  .catch((err: Error) => {
    console.error("Failed to connect to the database:", err);
    process.exit(1);
  });

// Clean up database connection on shutdown
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
