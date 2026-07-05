import "dotenv/config";
import { Worker } from "bullmq";
import { runAgent } from "../agent/runner.js";
import { logger } from "../observability/logger.js";
import type { AgentJob } from "./producer.js";

const connection = {
  host: "localhost",
  port: 6379,
};

const worker = new Worker<AgentJob>(
  "agent-tasks",
  async (job) => {
    logger.info({ taskId: job.data.taskId }, "processing job");

    const result = await runAgent(job.data.message, () => {});

    // Fire the webhook with the result
    await fetch(job.data.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskId: job.data.taskId,
        result,
        completedAt: new Date().toISOString(),
      }),
    });

    logger.info({ taskId: job.data.taskId }, "job complete, webhook fired");
    return result;
  },
  {
    connection,
    concurrency: 3, // process up to 3 jobs simultaneously
  },
);

worker.on("failed", (job, err) => {
  logger.error({ taskId: job?.data.taskId, err }, "job failed");
});

logger.info("Worker started, waiting for jobs...");
