const { Router } = require('express');
const storyboardRoute = require('./storyboardRoute');
const { storyboardGenRoute } = require('./storyboardGenRoute');
const assetsRouter = require('./assets');

const router = Router();

// mount existing sub-routes
router.use("/storyboard", storyboardRoute);
router.use("/storyboard-gen", storyboardGenRoute);
router.use("/assets", assetsRouter);

module.exports = router;