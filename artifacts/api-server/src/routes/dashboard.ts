import { Router, type IRouter } from "express";
import { db, casesTable, assessmentInstancesTable, reportsTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

function requireAuth(req: import("express").Request, res: import("express").Response): number | null {
  const userId = (req.session as Record<string, unknown>)?.userId as number | undefined;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return null;
  }
  return userId;
}

router.get("/dashboard/summary", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const allCases = await db.select().from(casesTable);
  const activeCases = allCases.filter((c) => !["closed", "released"].includes(c.status));
  const completedCases = allCases.filter((c) => ["released", "closed"].includes(c.status));

  const allAssessments = await db.select().from(assessmentInstancesTable);
  const externals = allAssessments.filter((a) => a.type === "external");
  const completed = allAssessments.filter((a) => a.status === "submitted");

  const reports = await db.select().from(reportsTable);
  const pendingReports = reports.filter((r) => r.releaseState === "draft");

  res.json({
    totalCases: allCases.length,
    activeCases: activeCases.length,
    completedCases: completedCases.length,
    pendingReports: pendingReports.length,
    totalRespondents: externals.length,
    completedAssessments: completed.length,
  });
});

router.get("/dashboard/my-cases", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const myCases = await db.select().from(casesTable).where(eq(casesTable.targetPersonId, userId));

  const result = await Promise.all(myCases.map(async (c) => {
    const assessments = await db.select().from(assessmentInstancesTable).where(eq(assessmentInstancesTable.caseId, c.id));
    const selfAssessment = assessments.find((a) => a.type === "self");
    const reports = await db.select().from(reportsTable).where(eq(reportsTable.caseId, c.id));
    const releasedReport = reports.find((r) => r.releaseState === "released");

    return {
      id: c.id,
      title: c.title,
      status: c.status,
      selfAssessmentStatus: selfAssessment?.status ?? null,
      selfAssessmentId: selfAssessment?.id ?? null,
      reportReleased: !!releasedReport,
      reportId: releasedReport?.id ?? null,
    };
  }));

  res.json(result);
});

export default router;
