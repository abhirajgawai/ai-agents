import type { Request, Response, NextFunction } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { redis } from "../observability/redis.js";
import { logger } from "../observability/logger.js";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const DAILY_TOKEN_BUDGET = 300; // tokens per API key per day

export async function costGuard(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { message, text } = req.body ?? {};
  const userContent = message ?? text;

  if (!userContent) return next();

  const apiKey = req.header("x-api-key") ?? "anonymous";
  const today = new Date().toISOString().slice(0, 10); // "2025-06-22"
  const redisKey = `tokens:${apiKey}:${today}`;

  // Count tokens this request will use
  const { input_tokens } = await client.messages.countTokens({
    model: "claude-haiku-4-5",
    messages: [{ role: "user", content: userContent }],
  });

  console.log("input tokens", input_tokens);

  // Check current usage
  const current = Number((await redis.get(redisKey)) ?? 0);

  if (current + input_tokens > DAILY_TOKEN_BUDGET) {
    logger.warn(
      { apiKey: "***", current, input_tokens },
      "daily token budget exceeded",
    );
    return res.status(429).json({
      error: "Daily token budget exceeded. Try again tomorrow.",
    });
  }

  // Reserve the tokens (expire key at end of day = 86400s max)
  await redis.incrby(redisKey, input_tokens);
  await redis.expire(redisKey, 86400);

  logger.info({ input_tokens, total: current + input_tokens }, "token usage");
  next();
}
