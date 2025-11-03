import { Router } from "express";
import storyboardRoute from "./storyboardRoute";
import { storyboardGenRoute } from "./storyboardGenRoute";
import assetsRouter from "./assets";
import legacyRoute from "./legacyRoute";

const router = Router();

// mount existing sub-routes
router.use("/storyboard", storyboardRoute);
router.use("/storyboard-gen", storyboardGenRoute);
router.use("/assets", assetsRouter);
router.use("/v1", legacyRoute);

export default router;
