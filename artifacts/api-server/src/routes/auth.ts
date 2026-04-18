import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/auth/me", async (req, res): Promise<void> => {
  const userId = (req.session as Record<string, unknown>)?.userId as number | undefined;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const { userId } = req.body as { userId?: number };
  if (!userId || typeof userId !== "number") {
    res.status(400).json({ error: "userId required" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  (req.session as Record<string, unknown>).userId = user.id;
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

export default router;
