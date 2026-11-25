# 🚀 ReachInbox — Production-Grade Email Job Scheduler & Dashboard

A high-throughput, fault-tolerant, and horizontally scalable full-stack email job scheduling system built for high-volume outbound campaigns. 

Built with **React 19**, **Node.js (TypeScript)**, **Express 5**, **BullMQ**, **Redis 7**, **PostgreSQL 16 (Prisma ORM)**, **Nodemailer (Ethereal Fake SMTP)**, and **Nginx**, fully containerized via **Docker Compose**.

---

## 📑 Table of Contents
1. [System Architecture](#-system-architecture)
2. [End-to-End Workflow](#-end-to-end-workflow)
3. [Concurrency & 1,000+ Concurrent Requests Handling](#-concurrency--1000-concurrent-requests-handling)
4. [Key Features](#-key-features)
5. [Tech Stack](#-tech-stack)
6. [Database Schema (Prisma)](#-database-schema-prisma)
7. [API Endpoints Reference](#-api-endpoints-reference)
8. [Docker Compose & VPS Deployment](#-docker-compose--vps-deployment)
9. [Local Development Setup](#-local-development-setup)
10. [Configuration & Environment Variables](#-configuration--environment-variables)
11. [Troubleshooting & Verification](#-troubleshooting--verification)

---

## 🏛️ System Architecture

```
                                 ┌──────────────────────────────────────────────┐
                                 │                CLIENT / WEB                  │
                                 │       React 19 + Tailwind CSS + Vite         │
                                 │   Google OAuth 2.0 / Email Authentication    │
                                 └──────────────────────┬───────────────────────┘
                                                        │
                                                        ▼ Port 80
                                 ┌──────────────────────────────────────────────┐
                                 │            NGINX REVERSE PROXY               │
                                 │   • Serves static React assets (gzip)        │
                                 │   • Reverse proxies `/api/*` ──► Backend     │
                                 │   • Enforces client_max_body_size (30MB)     │
                                 └──────────────────────┬───────────────────────┘
                                                        │
                                                        ▼ Port 5000
                                 ┌──────────────────────────────────────────────┐
                                 │        EXPRESS 5 / NODE.JS BACKEND           │
                                 │   • REST API Controllers                     │
                                 │   • Validation & Attachment Handler (25MB)   │
                                 │   • Rate-limit Calculator & Window Tracker   │
                                 └──────────────┬────────────────┬──────────────┘
                                                │                │
                        ┌───────────────────────┘                └────────────────────────┐
                        ▼                                                                 ▼
      ┌───────────────────────────────────┐                             ┌───────────────────────────────────┐
      │          REDIS 7 (BullMQ)         │                             │       POSTGRESQL 16 (PRISMA)      │
      │ • Message Broker & Delayed Queue  │                             │ • Persistent Storage of Jobs      │
      │ • Exponential Backoff & Retries   │                             │ • Hourly Rate Limit Counters      │
      │ • Zero-Loss Job Ingestion         │                             │ • Audit Logs & Ethereal URLs      │
      └─────────────────┬─────────────────┘                             └─────────────────▲─────────────────┘
                        │                                                                 │
                        ▼                                                                 │
      ┌───────────────────────────────────┐                                               │
      │         BULLMQ WORKERS            │                                               │
      │ • Configurable Concurrency (e.g. 5│───────────────────────────────────────────────┘
      │ • Parallel Safe & Atomic Checks   │       (Atomic State Updates: SCHEDULED ➔ PROCESSING ➔ SENT)
      │ • Spacing Delay (2s between sends)│
      └─────────────────┬─────────────────┘
                        │
                        ▼
      ┌───────────────────────────────────┐                             ┌───────────────────────────────────┐
      │       NODEMAILER SMTP ENGINE      │                             │         SLACK WEBHOOKS            │
      │ • RFC 2822 MIME & Base64 Attachments                             │ • Rate Limit Exceeded Alerts      │
      │ • Ethereal SMTP Live Web Previews │                             │ • Failure & Warning Notifications │
      └───────────────────────────────────┘                             └───────────────────────────────────┘
```

---

## 🔄 End-to-End Workflow

1. **Composition & Lead Ingestion**:
   - The user selects a sender address (e.g. `oliver.brown@domain.io`), inputs recipient(s) (or parses a multi-line list / CSV), enters subject & body (with variable tags like `{{firstName}}`), and optionally attaches documents/images.
   - User specifies **Delay between 2 emails** (e.g. 2s) and **Hourly Limit** (e.g. 50/hr).
2. **Scheduling Algorithm**:
   - The backend schedules jobs sequentially starting from `scheduledAt`.
   - If a batch exceeds the sender's hourly limit, remaining emails automatically rollover into subsequent consecutive 1-hour windows (e.g., jobs 1–50 send between 10:00–11:00 AM; jobs 51–100 automatically rollover to 11:00–12:00 PM).
3. **Queue Ingestion**:
   - The API records the job in PostgreSQL (`JobStatus: SCHEDULED`) and pushes it into the BullMQ delayed queue in Redis with a precision `delay = scheduledAt - Date.now()`.
4. **Worker Dispatch**:
   - When the scheduled timestamp arrives, a BullMQ worker picks up the job.
   - It performs an atomic DB concurrency check (`status === SENT || status === CANCELLED`). If already completed, it cleanly skips.
   - Updates status to `PROCESSING` and evaluates the atomic rate-limit tracker in PostgreSQL.
   - Nodemailer converts base64 attachment buffers into MIME parts and dispatches via SMTP.
5. **Completion & Telemetry**:
   - Upon success, the job is marked `SENT` with `sentTime`, `messageId`, and the Ethereal web preview URL.
   - If SMTP fails, BullMQ initiates exponential backoff (up to 3 retries) before updating to `FAILED` with detailed error logs.

---

## ⚡ Concurrency & 1,000+ Concurrent Requests Handling

When **1,000+ emails are triggered concurrently at the exact same moment**:

| Layer | Behavior Under 1,000 Concurrent Jobs |
|---|---|
| **API Ingestion** | Instant non-blocking ingestion. The HTTP response returns in <50ms while Redis buffers all 1,000 jobs in memory. |
| **Worker Concurrency** | Guarded by `WORKER_CONCURRENCY=5`. The worker consumes strictly 5 jobs at a time, completely preventing Node.js event-loop exhaustion and memory OOM crashes. |
| **Rate Limiting** | Evaluated atomically in PostgreSQL (`HourlyRateLimitTracker.upsert`). Even across parallel threads, hourly limits are enforced with zero race conditions. |
| **Duplicate Prevention** | State checks ensure that multiple worker instances never send the same email twice. |
| **Backpressure & Retries** | Automatic 3-attempt exponential backoff ensures network blips or SMTP socket limits do not lose messages. |

---

## ✨ Key Features

### 1. Modern Dashboard (Figma Faithful)
- **Pixel-perfect UI**: Built to exact Figma specifications with a clean, minimal aesthetic.
- **Dedicated Tabs**:
  - **Scheduled Tab**: Displays queued emails with formatted time badges and instant 1-click cancellation/delete confirmation modal.
  - **Sent Tab**: Displays successfully delivered emails with grey `[Sent]` badges and direct links to inspect the rendered message on Ethereal fake SMTP.
- **Live Search & Filter**: Real-time debounced query search across recipient, subject, and body, with sender filtering.

### 2. Multi-Format Email Attachments
- Full support for **PDFs, Word docs (.docx), images (PNG/JPG), spreadsheets (.xlsx, .csv)**.
- **Interactive UI**: Drag-and-drop or paperclip file upload, file size formatting, thumbnail/file icon previews, and 1-click removal.
- **Backend Stream Conversion**: Base64 payload decoding into Nodemailer MIME attachments up to 25MB.

### 3. Google OAuth 2.0 & Email Authentication
- **Native Google Identity Services (GSI)**: Directly integrated using official Google OAuth popups with your Client ID.
- Automatically retrieves user profile (Full Name, Email, Google Avatar).
- Fallback email sign-in for local development and private network setups.

### 4. Hourly Rate Limiting & Slack Webhook Alerts
- Configurable per-sender hourly limit and minimum delay between emails.
- Automatic Slack webhook notifications triggered when a sender exceeds the hourly threshold.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 + TypeScript
- **Styling**: Tailwind CSS v4 + Lucide React Icons
- **Bundler**: Vite 8
- **Web Server (Production)**: Nginx (Alpine) with gzip compression

### Backend
- **Runtime**: Node.js 22 LTS (TypeScript, ES Modules)
- **Framework**: Express 5
- **Task Queue**: BullMQ v6
- **Database ORM**: Prisma ORM v6
- **Database**: PostgreSQL 16
- **Cache & Message Broker**: Redis 7
- **Email Transport**: Nodemailer (Ethereal fake SMTP service)

---

## 🗄️ Database Schema (Prisma)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum JobStatus {
  SCHEDULED
  DELAYED
  PROCESSING
  SENT
  FAILED
  CANCELLED
}

model User {
  id            String             @id @default(uuid())
  email         String             @unique
  name          String
  avatar        String?
  googleId      String?            @unique
  createdAt     DateTime           @default(now())
  updatedAt     DateTime           @updatedAt
  emailJobs     EmailJob[]
  slackConfigs  SlackIntegration[]
}

model Sender {
  id          String     @id @default(uuid())
  email       String     @unique
  name        String?
  hourlyLimit Int        @default(50)
  isActive    Boolean    @default(true)
  emailJobs   EmailJob[]
}

model EmailJob {
  id             String     @id @default(uuid())
  senderEmail    String
  recipient      String
  subject        String
  body           String     @db.Text
  attachments    Json?
  status         JobStatus  @default(SCHEDULED)
  scheduledAt    DateTime
  hourWindow     String
  delaySeconds   Int        @default(2)
  hourlyLimit    Int        @default(50)
  sentTime       DateTime?
  etherealUrl    String?
  messageId      String?
  errorMessage   String?
  bullMqJobId    String?
  createdAt      DateTime   @default(now())
  updatedAt      DateTime   @updatedAt
}

model HourlyRateLimitTracker {
  id          String   @id @default(uuid())
  senderEmail String
  hourWindow  String
  count       Int      @default(0)
  limit       Int      @default(50)
  alertSent   Boolean  @default(false)
  updatedAt   DateTime @updatedAt

  @@unique([senderEmail, hourWindow])
}
```

---

## 📡 API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Server, PostgreSQL, and Redis health status |
| `POST` | `/api/schedule` | Schedule single or batch email campaigns |
| `GET` | `/api/jobs` | Retrieve all scheduled and sent email jobs (with filtering) |
| `GET` | `/api/jobs/:id` | Get detailed metadata & payload for a single job |
| `DELETE` | `/api/jobs/:id` | Cancel/delete an email job from BullMQ queue & PostgreSQL |
| `GET` | `/api/stats` | Queue metrics (waiting, active, delayed, completed, failed) |
| `POST` | `/api/slack/configure` | Configure Slack webhook URL and alert triggers |

---

## 🐳 Docker Compose & VPS Deployment

The entire project is pre-configured with a production-grade multi-container setup.

### 1. Start all services on your VPS
```bash
git clone <YOUR_REPO_URL> reachinbox
cd reachinbox
cp .env.example .env
docker compose up -d --build
```

### 2. Verify container statuses
```bash
docker compose ps
```
Output:
```
NAME                  SERVICE    STATUS                    PORTS
reachinbox-backend    backend    Up                        0.0.0.0:5000->5000/tcp
reachinbox-frontend   frontend   Up                        0.0.0.0:80->80/tcp
reachinbox-postgres   postgres   Up (healthy)              0.0.0.0:5432->5432/tcp
reachinbox-redis      redis      Up (healthy)              0.0.0.0:6379->6379/tcp
```

### 3. Useful Docker Commands
```bash
# View real-time BullMQ worker & API logs
docker compose logs -f backend

# View Redis logs
docker compose logs -f redis

# Restart all containers
docker compose restart

# Stop all containers
docker compose down
```

---

## 💻 Local Development Setup

### Prerequisites
- Node.js 20+
- PostgreSQL
- Redis (`redis-server`)

### Backend Setup
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev
```
API will start on `http://localhost:5000`.

### Frontend Setup
```bash
cd "email scheduler"
npm install
npm run dev
```
Frontend will start on `http://localhost:5173`.

---

## ⚙️ Configuration & Environment Variables

Create a `.env` file in the root directory (or use `.env.example`):

```env
# Frontend URL / Host
FRONTEND_URL=http://localhost

# PostgreSQL Database Connection
POSTGRES_USER=postgres
POSTGRES_PASSWORD=reachinbox_secret_2026
POSTGRES_DB=reachinbox_db
POSTGRES_PORT=5432

# Redis / BullMQ Connection
REDIS_PORT=6379
REDIS_PASSWORD=reachinbox_redis_pass

# SMTP Credentials (Ethereal test credentials)
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=dean.prosacco@ethereal.email
SMTP_PASS=pfyMsQUR5hzmPuPNAq

# Concurrency & Rate Limiter Defaults
WORKER_CONCURRENCY=5
MAX_EMAILS_PER_HOUR_DEFAULT=50
MIN_DELAY_BETWEEN_EMAILS_SECONDS=2

# Slack Notifications (Optional)
SLACK_WEBHOOK_URL=
```

---

## 🔍 Troubleshooting & Verification

1. **Google OAuth 400 invalid_request on VPS IP:**
   - Google OAuth strictly forbids naked IP addresses in Authorized JavaScript Origins.
   - Use a wildcard domain like `http://<YOUR_IP>.nip.io` in Google Cloud Console Credentials and access the dashboard through that URL.
2. **Checking Delivered Emails on Ethereal SMTP:**
   - Every email sent in development/test generates an Ethereal inspection URL printed to backend logs and linked directly in the **Sent** tab of the dashboard.
3. **Database Inspection:**
   - To inspect database records directly on the VPS:
     ```bash
     docker exec -it reachinbox-postgres psql -U postgres -d reachinbox_db
     SELECT id, recipient, subject, status, "scheduledAt" FROM email_jobs;
     ```
