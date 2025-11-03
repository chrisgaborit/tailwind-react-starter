import "dotenv/config";
import { logger } from './lib/logger';
import { startWorker } from './queue';

logger.info("🧵 starting worker...");
startWorker();
