const "dotenv/config";
import { logger } = require('./lib/logger');
const { startWorker } = require('./queue');

logger.info("🧵 starting worker...");
startWorker();
