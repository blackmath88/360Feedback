import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import casesRouter from "./cases";
import assessmentsRouter from "./assessments";
import reportsRouter from "./reports";
import dashboardRouter from "./dashboard";
import questionnaireRouter from "./questionnaire";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(casesRouter);
router.use(assessmentsRouter);
router.use(reportsRouter);
router.use(dashboardRouter);
router.use(questionnaireRouter);

export default router;
