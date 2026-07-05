import type { Request, Response, NextFunction } from "express";
import { redis } from "../observability/redis.js";
import { logger } from "../observability/logger.js";

const LIMIT = 2; // max requests
const WINDOW_SECONDS = 60; // per this many seconds

export async function rateLimit(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const apiKey = req.header("x-api-key") ?? "anonymous";

  // One counter key per API key per fixed time window.
  const windowId = Math.floor(Date.now() / 1000 / WINDOW_SECONDS);
  const redisKey = `ratelimit:${apiKey}:${windowId}`;

  // Atomically increment this window's counter.
  const count = await redis.incr(redisKey);

  // First request in this window? Set the key to expire when the window ends.
  if (count === 1) {
    await redis.expire(redisKey, WINDOW_SECONDS);
  }

  if (count > LIMIT) {
    const ttl = await redis.ttl(redisKey);
    logger.warn({ apiKey: "***", count }, "rate limit exceeded");
    res.setHeader("Retry-After", String(ttl));
    return res
      .status(429)
      .json({ error: "Too Many Requests", retryAfterSeconds: ttl });
  }

  next();
}
