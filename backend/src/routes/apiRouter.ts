import { Router } from "express";
import storyboardRoute from "./storyboardRoute";
import { storyboardGenRoute } from "./storyboardGenRoute";
import assetsRouter from "./assets";

const router = Router();

// mount existing sub-routes
router.use("/storyboard", storyboardRoute);
router.use("/storyboard-gen", storyboardGenRoute);
router.use("/assets", assetsRouter);

export default router;