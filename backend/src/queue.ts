import { Queue, Worker, Job, QueueEvents } from "bullmq";
import IORedis from "ioredis";
import { logger } from "./lib/logger";
import { generateStoryboardFromOpenAI } from "./services/openaiService";

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";
export const connection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });

export const genQueueName = "storyboard-generation";
export const genQueue = new Queue(genQueueName, { connection });
export const genEvents = new QueueEvents(genQueueName, { connection });

export async function enqueueGenJob(payload: any) {
  return genQueue.add("generate", payload, {
    removeOnComplete: 1000,
    removeOnFail: 1000,
    attempts: 2,
    backoff: { type: "exponential", delay: 5000 },
  });
}

export async function getJobState(id: string) {
  const job = await Job.fromId(genQueue, id);
  if (!job) return { status: "not_found" as const };
  const state = await job.getState(); // waiting, active, completed, failed, delayed
  const result = state === "completed" ? job.returnvalue : undefined;
  const error = state === "failed" ? job.failedReason : undefined;
  return { status: state, result, error };
}

// Worker (run in a separate process in prod; okay in dev if you want)
export function startWorker() {
  const worker = new Worker(
    genQueueName,
    async (job) => {
      const { formData, ragContext } = job.data || {};
      const storyboard = await generateStoryboardFromOpenAI({ ...formData, ragContext });
      return storyboard; // becomes job.returnvalue
    },
    { connection, concurrency: Number(process.env.WORKER_CONCURRENCY || 2) }
  );

  worker.on("completed", (job) => logger.info({ jobId: job.id }, "job completed"));
  worker.on("failed", (job, err) =>
    logger.error({ jobId: job?.id, err: err?.message }, "job failed")
  );
  return worker;
}
