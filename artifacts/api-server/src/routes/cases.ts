import { Router, type IRouter } from "express";
import { db, casesTable, usersTable, assessmentInstancesTable, reportsTable, responseSetsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { generateToken } from "../lib/token";
import { computeReportData } from "../lib/questionnaire";

const router: IRouter = Router();

function requireAuth(req: import("express").Request, res: import("express").Response): number | null {
  const userId = (req.session as Record<string, unknown>)?.userId as number | undefined;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return null;
  }
  return userId;
}

async function enrichCase(c: typeof casesTable.$inferSelect) {
  const [targetPerson] = await db.select().from(usersTable).where(eq(usersTable.id, c.targetPersonId));
  const [createdBy] = await db.select().from(usersTable).where(eq(usersTable.id, c.createdById));
  const allAssessments = await db.select().from(assessmentInstancesTable).where(eq(assessmentInstancesTable.caseId, c.id));
  const externals = allAssessments.filter((a) => a.type === "external");
  const selfAssessment = allAssessments.find((a) => a.type === "self");
  return {
    id: c.id,
    title: c.title,
    targetPersonId: c.targetPersonId,
    targetPersonName: targetPerson?.name ?? "Unknown",
    status: c.status,
    createdById: c.createdById,
    createdByName: createdBy?.name ?? "Unknown",
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    respondentCount: externals.length,
    completedRespondentCount: externals.filter((a) => a.status === "submitted").length,
    selfAssessmentStatus: selfAssessment?.status ?? null,
  };
}

router.get("/cases", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const [currentUser] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  let rawCases;

  if (currentUser?.role === "participant") {
    rawCases = await db.select().from(casesTable).where(eq(casesTable.targetPersonId, userId));
  } else {
    rawCases = await db.select().from(casesTable).orderBy(casesTable.createdAt);
  }

  const enriched = await Promise.all(rawCases.map(enrichCase));
  res.json(enriched);
});

router.post("/cases", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const { title, targetPersonId, includeSelfAssessment } = req.body as {
    title?: string;
    targetPersonId?: number;
    includeSelfAssessment?: boolean;
  };

  if (!title || !targetPersonId) {
    res.status(400).json({ error: "title and targetPersonId required" });
    return;
  }

  const [newCase] = await db.insert(casesTable).values({
    title,
    targetPersonId,
    createdById: userId,
    status: "draft",
  }).returning();

  if (includeSelfAssessment) {
    await db.insert(assessmentInstancesTable).values({
      caseId: newCase.id,
      type: "self",
      status: "pending",
    });
    await db.update(casesTable).set({ status: "self_assessment_open", updatedAt: new Date() }).where(eq(casesTable.id, newCase.id));
    newCase.status = "self_assessment_open";
  }

  const enriched = await enrichCase(newCase);
  res.status(201).json(enriched);
});

router.get("/cases/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
  const id = parseInt(rawId ?? "", 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [caseRow] = await db.select().from(casesTable).where(eq(casesTable.id, id));
  if (!caseRow) { res.status(404).json({ error: "Case not found" }); return; }

  const [targetPerson] = await db.select().from(usersTable).where(eq(usersTable.id, caseRow.targetPersonId));
  const [createdBy] = await db.select().from(usersTable).where(eq(usersTable.id, caseRow.createdById));
  const assessments = await db.select().from(assessmentInstancesTable).where(eq(assessmentInstancesTable.caseId, id));
  const reports = await db.select().from(reportsTable).where(eq(reportsTable.caseId, id));

  res.json({
    id: caseRow.id,
    title: caseRow.title,
    targetPersonId: caseRow.targetPersonId,
    targetPersonName: targetPerson?.name ?? "Unknown",
    status: caseRow.status,
    createdById: caseRow.createdById,
    createdByName: createdBy?.name ?? "Unknown",
    createdAt: caseRow.createdAt,
    updatedAt: caseRow.updatedAt,
    assessments: assessments.map((a) => ({
      id: a.id,
      caseId: a.caseId,
      type: a.type,
      status: a.status,
      respondentName: a.respondentName,
      respondentEmail: a.respondentEmail,
      token: a.token,
      submittedAt: a.submittedAt,
      createdAt: a.createdAt,
    })),
    reports: reports.map((r) => ({
      id: r.id,
      caseId: r.caseId,
      type: r.type,
      generatedAt: r.generatedAt,
      releaseState: r.releaseState,
      data: r.data,
    })),
  });
});

router.patch("/cases/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
  const id = parseInt(rawId ?? "", 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { status, title } = req.body as { status?: string; title?: string };
  const updateData: Partial<{ status: string; title: string; updatedAt: Date }> = { updatedAt: new Date() };
  if (status) updateData.status = status;
  if (title) updateData.title = title;

  const [updated] = await db.update(casesTable).set(updateData as Parameters<typeof casesTable.$inferInsert>[0]).where(eq(casesTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Case not found" }); return; }

  const enriched = await enrichCase(updated);
  res.json(enriched);
});

router.post("/cases/:id/respondents", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
  const id = parseInt(rawId ?? "", 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { name, email } = req.body as { name?: string; email?: string };
  if (!name || !email) { res.status(400).json({ error: "name and email required" }); return; }

  const token = generateToken();
  const [assessment] = await db.insert(assessmentInstancesTable).values({
    caseId: id,
    type: "external",
    status: "pending",
    respondentName: name,
    respondentEmail: email,
    token,
  }).returning();

  await db.update(casesTable).set({ status: "external_assessment_open", updatedAt: new Date() }).where(
    and(eq(casesTable.id, id), sql`status = 'self_assessment_open' OR status = 'draft' OR status = 'external_assessment_open'`)
  );

  res.status(201).json({
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

router.post("/cases/:id/generate-report", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
  const id = parseInt(rawId ?? "", 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const assessments = await db.select().from(assessmentInstancesTable).where(
    and(eq(assessmentInstancesTable.caseId, id), eq(assessmentInstancesTable.status, "submitted"))
  );

  const responseSets = await Promise.all(
    assessments.map(async (a) => {
      const [rs] = await db.select().from(responseSetsTable).where(eq(responseSetsTable.assessmentInstanceId, a.id));
      return { type: a.type, answers: (rs?.answers ?? {}) as Record<string, number | null> };
    })
  );

  const hasSelf = responseSets.some((r) => r.type === "self");
  const hasExternal = responseSets.some((r) => r.type === "external");

  const reportData = computeReportData(responseSets);

  const insertedReports = [];

  if (hasSelf) {
    const selfData = computeReportData(responseSets.filter((r) => r.type === "self"));
    const [r] = await db.insert(reportsTable).values({ caseId: id, type: "self", data: selfData }).returning();
    insertedReports.push(r);
  }

  if (hasExternal) {
    const extData = computeReportData(responseSets.filter((r) => r.type === "external"));
    const [r] = await db.insert(reportsTable).values({ caseId: id, type: "external", data: extData }).returning();
    insertedReports.push(r);
  }

  if (hasSelf && hasExternal) {
    const [r] = await db.insert(reportsTable).values({ caseId: id, type: "comparison", data: reportData }).returning();
    insertedReports.push(r);
  }

  await db.update(casesTable).set({ status: "report_generated", updatedAt: new Date() }).where(eq(casesTable.id, id));

  const lastReport = insertedReports[insertedReports.length - 1];
  res.json({
    id: lastReport?.id ?? 0,
    caseId: id,
    type: lastReport?.type ?? "comparison",
    generatedAt: lastReport?.generatedAt ?? new Date(),
    releaseState: "draft",
    data: reportData,
  });
});

router.post("/cases/:id/release-report", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"];
  const id = parseInt(rawId ?? "", 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  await db.update(reportsTable).set({ releaseState: "released" }).where(eq(reportsTable.caseId, id));
  await db.update(casesTable).set({ status: "released", updatedAt: new Date() }).where(eq(casesTable.id, id));

  const [report] = await db.select().from(reportsTable).where(and(eq(reportsTable.caseId, id), eq(reportsTable.type, "comparison")));
  const fallback = await db.select().from(reportsTable).where(eq(reportsTable.caseId, id));

  const r = report ?? fallback[0];
  if (!r) { res.status(404).json({ error: "No report found" }); return; }

  res.json({ id: r.id, caseId: r.caseId, type: r.type, generatedAt: r.generatedAt, releaseState: r.releaseState, data: r.data });
});

export default router;
