# M5 - First Real Deployment

Status: **Not started**

Full curriculum source:
`../../AI-Engineering-Advanced-Mastery-Plan.md`

This README is the practical guide for completing M5. It explains how to approach the first real deployment and what evidence proves the module is complete.

---

## 1. What This Module Is About

M5 teaches that deployment is not a final polish step. An AI engineer needs to understand triggers, runtime, secrets, observability, cost limits, and notification paths early.

You will deploy an agent to a real public server with:

- one push trigger
- one pull trigger
- spend or step caps
- completion notification
- basic host hardening

The core lesson: a useful agent is a deployed system, not just a local script.

---

## 2. What You Are Building

Deploy either:

- the M4-hardened agent, or
- the P4 production backend

The deployed service should expose:

```text
POST /webhook/run
```

It should also run on a schedule through cron or an external scheduled trigger.

On completion, it should send a Slack or Discord notification.

---

## 3. Concepts To Understand Before Starting

- **Trigger**: what starts the agent, such as webhook, cron, queue, or manual command.
- **Runtime**: where the agent process runs.
- **Logic**: the actual agent code.
- **Notification**: how humans learn the run completed or stopped.
- **Hard cap**: a non-negotiable limit on tool calls, steps, or spend.

Deployment work is security work. Secrets, user permissions, firewall rules, and restart behavior are part of the module, not extras.

---

## 4. Recommended File Structure

```text
m05-first-deployment/
  README.md
  HANDOFF.md
  DECISION.md
  Dockerfile
  docker-compose.yml
  .env.example
  src/
    server.ts
    webhook.ts
    caps.ts
    notify.ts
  deployment/
    server-hardening-checklist.md
    curl-examples.md
    cron-example.txt
```

File responsibilities:

- `DECISION.md`: why you picked the host.
- `Dockerfile` and `docker-compose.yml`: repeatable runtime.
- `src/caps.ts`: step or spend hard-stop logic.
- `src/notify.ts`: Slack or Discord webhook notification.
- `deployment/`: operational notes and commands.

---

## 5. Setup Path

### Step 1 - Choose the deployment target

Pick one:

- Hetzner
- DigitalOcean
- Oracle Free Tier
- another VPS you can explain clearly

Write `DECISION.md` before deploying. Include price, region, free-tier limits, and why it is enough for a CPU-based agent.

### Step 2 - Harden the server first

Before running the app:

- use SSH key-only authentication
- disable password login
- create a non-root user
- allow only ports `22`, `80`, and `443`
- enable unattended upgrades

Record the checklist in `deployment/server-hardening-checklist.md`.

### Step 3 - Containerize the app

Create a `Dockerfile` and `docker-compose.yml`. Use:

```yaml
restart: unless-stopped
```

Add Redis only if your selected agent needs queues or spend tracking.

### Step 4 - Add the webhook trigger

Expose `POST /webhook/run`. It should start an agent run and return a run id or basic status.

### Step 5 - Add the scheduled trigger

Use either:

- server cron
- scheduled GitHub Action hitting the webhook
- another scheduler you can explain

Save the exact schedule in `deployment/cron-example.txt`.

### Step 6 - Add hard caps

At minimum, enforce one cap:

- max tool calls per run
- max steps per run
- max daily spend estimate

The cap must stop execution with a logged reason.

### Step 7 - Add completion notification

Send a Slack or Discord incoming webhook when the run finishes, fails, or hard-stops.

---

## 6. Verification Checklist

M5 is complete only when:

- `DECISION.md` explains the host choice
- server hardening checklist is completed
- app runs through Docker or Docker Compose
- public `POST /webhook/run` works from your laptop
- scheduled trigger produces a fresh log entry
- a deliberately tiny cap stops a run
- completion notification arrives in Slack or Discord
- secrets are not committed
- `HANDOFF.md` explains how to redeploy and debug

---

## 7. What To Put In HANDOFF.md

Include:

- public URL or redacted endpoint shape
- host selected
- deploy command
- webhook test command
- scheduler details
- cap tested and result
- notification proof
- where logs live
- how to restart or roll back

---

## 8. Explain-It-Back Questions

Before moving to M6, answer:

1. What are the four layers of a deployed agent?
2. Why does this not need a GPU?
3. What is the difference between push and pull triggers?
4. Why should caps be enforced outside the model's judgment?
5. Where are secrets stored and why?
