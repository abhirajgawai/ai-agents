import type { Request, Response, NextFunction } from "express";
import { logger } from "../observability/logger.js";

export function auth(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.header("x-api-key");

  if (!apiKey || apiKey !== process.env.API_KEY) {
    logger.warn({ path: req.path }, "unauthorized request");
    return res
      .status(401)
      .json({ error: "Unauthorized: invalid or missing x-api-key" });
  }

  next();
}
