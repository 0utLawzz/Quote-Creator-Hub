import { Router, type IRouter } from "express";
import healthRouter from "./health";
import reelsRouter from "./reels";
import templatesRouter from "./templates";
import schedulesRouter from "./schedules";
import quotesRouter from "./quotes";

const router: IRouter = Router();

router.use(healthRouter);
router.use(reelsRouter);
router.use(templatesRouter);
router.use(schedulesRouter);
router.use(quotesRouter);

export default router;
