import { Queue } from "bullmq";

export interface AgentJob {
  message: string;
  webhookUrl: string;
  taskId: string;
}

const connection = {
  host: "localhost",
  port: 6379,
};

export const agentQueue = new Queue<AgentJob>("agent-tasks", {
  connection,
});
