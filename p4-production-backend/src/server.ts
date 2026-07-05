import "dotenv/config";
import express from "express";
import { logger } from "./observability/logger.js";
import { auth } from "./middleware/auth.js";
import { agentRouter } from "./routes/agent.js";
import { rateLimit } from "./middleware/rate-limit.js";
import { costGuard } from "./middleware/cost-guard.js";

const app = express();

// Parse incoming JSON request bodies into req.body
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

const PORT = Number(process.env.PORT ?? 3000);

app.listen(PORT, () => {
  logger.info(`Server listening on http://localhost:${PORT}`);
});

// Everything under /agent requires a valid API key
app.use("/agent", auth, rateLimit, costGuard, agentRouter);
