import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  // In dev, pretty-print. In prod, raw JSON (faster, machine-readable).
  transport:
    process.env.NODE_ENV === "production"
      ? undefined
      : {
          target: "pino-pretty",
          options: { colorize: true },
        },
});
