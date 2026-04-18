import { Router, type IRouter } from "express";
import { getQuestionnaire } from "../lib/questionnaire";

const router: IRouter = Router();

router.get("/questionnaire/structure", (req, res): void => {
  const mode = req.query["mode"] === "external" ? "external" : "self";
  const structure = getQuestionnaire(mode);
  res.json(structure);
});

export default router;
