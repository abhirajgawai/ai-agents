import { Router } from "express";
import { runAgent } from "../agent/runner.js";
import { logger } from "../observability/logger.js";
import { classifySentiment } from "../agent/structured-output.js";
import { detectInjection } from "../safety/prompt-injection.js";
import { redactPii } from "../safety/pii.js";
import { agentQueue } from "../queue/producer.js";
import { randomUUID } from "crypto";

export const agentRouter = Router();

agentRouter.post("/run", async (req, res) => {
  const { message } = req.body ?? {};

  if (!message || typeof message !== "string") {
    return res
      .status(400)
      .json({ error: "Body must include a 'message' string" });
  }

  if (detectInjection(message)) {
    logger.warn({ path: req.path }, "prompt injection attempt blocked");
    return res.status(400).json({ error: "Invalid input detected." });
  }

  logger.info({ message: redactPii(message) }, "agent run started");

  // --- SSE handshake: tell the client this is an event stream ---
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  try {
    const full = await runAgent(message, (chunk) => {
      // Each token chunk → one SSE "token" event
      res.write(`event: token\ndata: ${JSON.stringify(chunk)}\n\n`);
    });

    // Signal completion with a final event carrying the full text
    res.write(`event: done\ndata: ${JSON.stringify({ full })}\n\n`);
    res.end();
  } catch (err) {
    logger.error({ err }, "agent run failed");
    res.write(
      `event: error\ndata: ${JSON.stringify({ error: "agent failed" })}\n\n`,
    );
    res.end();
  }
});

agentRouter.post("/classify", async (req, res) => {
  const { text } = req.body ?? {};

  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Body must include a 'text' string" });
  }

  if (detectInjection(text)) {
    logger.warn({ path: req.path }, "prompt injection attempt blocked");
    return res.status(400).json({ error: "Invalid input detected." });
  }

  logger.info({ text: redactPii(text) }, "classify started");

  try {
    const result = await classifySentiment(text);
    res.json(result);
  } catch (err) {
    logger.error({ err }, "classify failed");
    res.status(500).json({ error: "classification failed" });
  }
});

agentRouter.post("/task", async (req, res) => {
  const { message, webhookUrl } = req.body ?? {};

  if (!message || typeof message !== "string") {
    return res
      .status(400)
      .json({ error: "Body must include a 'message' string" });
  }

  if (!webhookUrl || typeof webhookUrl !== "string") {
    return res
      .status(400)
      .json({ error: "Body must include a 'webhookUrl' string" });
  }

  if (detectInjection(message)) {
    logger.warn({ path: req.path }, "prompt injection attempt blocked");
    return res.status(400).json({ error: "Invalid input detected." });
  }

  const taskId = randomUUID();

  await agentQueue.add("run", { message, webhookUrl, taskId });

  logger.info({ taskId }, "task queued");

  res.status(202).json({ taskId, status: "queued" });
});
