import { Context, Hono } from "hono";
import { getAllAdmins, isUserAdmin } from "../models/admin";

// Define a type for the context with userId
type AdminContext = Context<{
  Variables: {
    userId: string;
  };
}>;

const adminRoutes = new Hono();

// Middleware to check if user is admin
async function checkAdminUser(c: AdminContext, next: () => Promise<void>) {
  const userId = c.get("userId");
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const isAdmin = await isUserAdmin(userId);
  if (!isAdmin) {
    return c.json({ error: "Forbidden: Admin access required" }, 403);
  }

  return next();
}

// Get all admins (requires admin)
adminRoutes.get("/users", checkAdminUser, async (c: AdminContext) => {
  try {
    const admins = await getAllAdmins();
    return c.json({ admins });
  } catch (error) {
    console.error("Error getting admins:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

// Check if current user is admin
adminRoutes.get("/check", async (c: AdminContext) => {
  const userId = c.get("userId");
  if (!userId) {
    return c.json({ isAdmin: false });
  }

  const isAdmin = await isUserAdmin(userId);
  return c.json({ isAdmin });
});

export default adminRoutes;
