import { Router, type IRouter } from "express";
import { db, assessmentInstancesTable, responseSetsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/assessments/self/:caseId", async (req, res): Promise<void> => {
  const rawCaseId = Array.isArray(req.params["caseId"]) ? req.params["caseId"][0] : req.params["caseId"];
  const caseId = parseInt(rawCaseId ?? "", 10);
  if (isNaN(caseId)) { res.status(400).json({ error: "Invalid caseId" }); return; }

  const [assessment] = await db.select().from(assessmentInstancesTable).where(
    eq(assessmentInstancesTable.caseId, caseId)
  ).then((rows) => rows.filter((r) => r.type === "self"));

  if (!assessment) { res.status(404).json({ error: "Self-assessment not found" }); return; }

  res.json({
    id: assessment.id,
    caseId: assessment.caseId,
    type: assessment.type,
    status: assessment.status,
    respondentName: assessment.respondentName,
    respondentEmail: assessment.respondentEmail,
    token: assessment.token,
    submittedAt: assessment.submittedAt,
    createdAt: assessment.createdAt,
  });
});

router.get("/assessments/token/:token", async (req, res): Promise<void> => {
  const token = Array.isArray(req.params["token"]) ? req.params["token"][0] : req.params["token"];
  if (!token) { res.status(400).json({ error: "Token required" }); return; }

  const [assessment] = await db.select().from(assessmentInstancesTable).where(eq(assessmentInstancesTable.token, token));
  if (!assessment) { res.status(404).json({ error: "Assessment not found" }); return; }

  res.json({
    id: assessment.id,
    caseId: assessment.caseId,
    type: assessment.type,
    status: assessment.status,
    respondentName: assessment.respondentName,
    respondentEmail: assessment.respondentEmail,
    token: assessment.token,
    submittedAt: assessment.submittedAt,
    createdAt: assessment.createdAt,
  });
});

router.get("/assessments/:id/answers", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
  const id = parseInt(rawId ?? "", 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [rs] = await db.select().from(responseSetsTable).where(eq(responseSetsTable.assessmentInstanceId, id));
  if (!rs) {
    res.json({ assessmentInstanceId: id, answers: {}, comments: {}, savedAt: null });
    return;
  }
  res.json({
    assessmentInstanceId: rs.assessmentInstanceId,
    answers: rs.answers ?? {},
    comments: rs.comments ?? {},
    savedAt: rs.savedAt,
  });
});

router.post("/assessments/:id/answers", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
  const id = parseInt(rawId ?? "", 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { answers, comments } = req.body as { answers?: Record<string, number | null>; comments?: Record<string, string> };

  const existing = await db.select().from(responseSetsTable).where(eq(responseSetsTable.assessmentInstanceId, id));
  const now = new Date();

  if (existing.length === 0) {
    await db.insert(responseSetsTable).values({ assessmentInstanceId: id, answers: answers ?? {}, comments: comments ?? {}, savedAt: now });
  } else {
    await db.update(responseSetsTable).set({ answers: answers ?? {}, comments: comments ?? {}, savedAt: now }).where(eq(responseSetsTable.assessmentInstanceId, id));
  }

  await db.update(assessmentInstancesTable).set({ status: "in_progress" }).where(eq(assessmentInstancesTable.id, id));

  res.json({ assessmentInstanceId: id, answers: answers ?? {}, comments: comments ?? {}, savedAt: now });
});

router.post("/assessments/:id/submit", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
  const id = parseInt(rawId ?? "", 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { answers, comments } = req.body as { answers?: Record<string, number | null>; comments?: Record<string, string> };
  const now = new Date();

  const existing = await db.select().from(responseSetsTable).where(eq(responseSetsTable.assessmentInstanceId, id));
  if (existing.length === 0) {
    await db.insert(responseSetsTable).values({ assessmentInstanceId: id, answers: answers ?? {}, comments: comments ?? {}, savedAt: now });
  } else {
    await db.update(responseSetsTable).set({ answers: answers ?? {}, comments: comments ?? {}, savedAt: now }).where(eq(responseSetsTable.assessmentInstanceId, id));
  }

  const [updated] = await db.update(assessmentInstancesTable).set({ status: "submitted", submittedAt: now }).where(eq(assessmentInstancesTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Assessment not found" }); return; }

  res.json({
    id: updated.id,
    caseId: updated.caseId,
    type: updated.type,
    status: updated.status,
    respondentName: updated.respondentName,
    respondentEmail: updated.respondentEmail,
    token: updated.token,
    submittedAt: updated.submittedAt,
    createdAt: updated.createdAt,
  });
});

export default router;
