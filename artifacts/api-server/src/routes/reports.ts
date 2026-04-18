import { Router, type IRouter } from "express";
import { db, reportsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/reports/case/:caseId", async (req, res): Promise<void> => {
  const rawCaseId = Array.isArray(req.params["caseId"]) ? req.params["caseId"][0] : req.params["caseId"];
  const caseId = parseInt(rawCaseId ?? "", 10);
  if (isNaN(caseId)) { res.status(400).json({ error: "Invalid caseId" }); return; }

  const reports = await db.select().from(reportsTable).where(eq(reportsTable.caseId, caseId));
  res.json(reports.map((r) => ({
    id: r.id,
    caseId: r.caseId,
    type: r.type,
    generatedAt: r.generatedAt,
    releaseState: r.releaseState,
    data: r.data,
  })));
});

export default router;
