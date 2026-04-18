import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/users", async (_req, res): Promise<void> => {
  const users = await db.select().from(usersTable).orderBy(usersTable.id);
  res.json(users.map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role })));
});

export default router;
