# 🚀 ReachInbox — Full-stack Email Job Scheduler & Dashboard

A production-grade, highly reliable email scheduler frontend and monitoring dashboard designed for **ReachInbox.ai**. Built with **React 19**, **TypeScript**, **Tailwind CSS**, and **Lucide Icons**, strictly matching ReachInbox's modern SaaS aesthetic.

---

## 📸 Key Features Implemented

### 1️⃣ Google Authentication
- **Real Google OAuth session support**: Displays logged-in user identity (Name, Email, Google Avatar).
- **Session management**: Persistent identity with quick-switch and logout capabilities.
- **Access control**: Ensures authenticated outreach scheduling across multi-sender domains.

### 2️⃣ Main Dashboard
- **Header**: User identity menu, real-time Slack connection status pill, live backend detector (`Live Backend Connected` vs `Local Demo Mode`), and 1-click shortcut to BullMQ Arena.
- **Analytics & Health Metrics**:
  - **Scheduled in Queue**: BullMQ delayed + waiting jobs counter.
  - **Emails Sent**: Successful delivery counter with fake SMTP preview verification.
  - **Worker Concurrency & Throughput**: Displays active worker count and email sending velocity.
  - **Rate Limit & Slack Status**: Real-time hourly limiter status indicator.
- **BullMQ Live Engine Widget**: Real-time breakdown of queue states: **Waiting**, **Active**, **Delayed**, **Completed**, and **Failed**.

### 3️⃣ Outbound Campaign Compose & Lead Parser
- **Multi-Sender Support**: Choose from authorized company domains (`outreach@reachinbox.ai`, `growth@outboxlabs.com`, etc.).
- **Dynamic Email Body**: Insert personalized tags like `{{firstName}}`, `{{company}}`, and `{{email}}`.
- **CSV & TXT Lead Uploader**:
  - Drag-and-drop or file browse.
  - Automatic parsing & validation with instant counter: `X valid email addresses detected`.
  - Removes duplicates, filters malformed entries, and previews leads with 1-click removal.
  - Quick-load 8 sample leads button for instant testing.
- **Advanced Throttling & Scheduling Controls**:
  - **Start Time**: Datetime-local picker with quick helpers (`+5m`, `+1h`, `Tomorrow 9 AM`).
  - **Delay Between Sends**: Configurable minimum delay (e.g. 2s, 3s) to avoid email provider throttling.
  - **Hourly Limit / Sender**: Enforces max emails/hour per sender.
  - **BullMQ Timeline Estimator**: Calculates exact start and finish times, showing rollover across consecutive 1-hour windows if batch exceeds hourly limit.

### 4️⃣ Scheduled Emails Queue Table
- Searchable in real-time via **Elasticsearch** debounced search query.
- Filterable by sender and status (`scheduled`, `delayed`, `processing`).
- Detailed metadata: Recipient, Subject, Sender, Scheduled Time, Relative Time (`in 15m`), and Rollover Badges.
- **Actions**:
  - **Inspect**: Open detailed Job Inspector modal with JSON/body/window inspection.
  - **Cancel**: 1-click removal from the persistent BullMQ queue.
- Skeleton loading and empty states.

### 5️⃣ Sent Emails Delivery Table
- Searchable and filterable by sender and status (`sent`, `failed`).
- Shows recipient, subject, sender, exact sent timestamp, and delivery status.
- **Ethereal Mail Direct Preview**: 1-click link to view the rendered email on Ethereal fake SMTP.
- **Error Inspector**: Visual error explanation for bounced or rejected emails.
- Skeleton loading and empty states.

### 6️⃣ Slack Rate-Limit Integration
- Connect Slack with OAuth or direct Incoming Webhook URL.
- **Live Test Alert**: Dispatches rate-limit alerts with verifiable real-time notifications.
- **Graceful Disconnect**: Disconnecting Slack silences alerts without interrupting email jobs.

---

## 📁 Clean Folder Structure

```
email scheduler/
├── src/
│   ├── api/                      # Backend API client & service layer
│   │   ├── client.ts             # Fetch wrapper with timeout & offline fallback
│   │   ├── emailApi.ts           # Email scheduling, list queries, cancellation, queue stats
│   │   └── slackApi.ts           # Slack status, configuration, & rate-limit alerts
│   ├── components/
│   │   ├── auth/                 # Google OAuth authentication & profile
│   │   │   ├── GoogleLoginModal.tsx
│   │   │   └── UserProfileDropdown.tsx
│   │   ├── common/               # Modular UI component library
│   │   │   ├── Badge.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   └── Tabs.tsx
│   │   ├── compose/              # Campaign scheduling & CSV lead upload
│   │   │   ├── ComposeModal.tsx
│   │   │   ├── CsvUploader.tsx
│   │   │   └── SchedulePreview.tsx
│   │   └── dashboard/            # Dashboard views, tables, and widgets
│   │       ├── EmailDetailsModal.tsx
│   │       ├── Header.tsx
│   │       ├── QueueHealthWidget.tsx
│   │       ├── ScheduledTable.tsx
│   │       ├── SearchFilterBar.tsx
│   │       ├── SentTable.tsx
│   │       ├── SlackIntegrationModal.tsx
│   │       └── StatsOverview.tsx
│   ├── context/                  # Global state providers
│   │   ├── AuthContext.tsx       # User session state & Google auth
│   │   └── ToastContext.tsx      # System toast notifications
│   ├── hooks/                    # Reusable custom hooks
│   │   ├── useDebounce.ts        # Debounced search for Elasticsearch
│   │   └── useEmails.ts          # Email fetching, filtering, and job management
│   ├── types/                    # Strict TypeScript type definitions
│   │   └── index.ts
│   ├── utils/                    # Utility helpers
│   │   ├── csvParser.ts          # CSV & TXT email extraction & regex validation
│   │   ├── dateFormatter.ts      # Relative & formatted date utilities
│   │   └── mockData.ts           # Realistic ReachInbox sample dataset
│   ├── App.tsx                   # Main dashboard view orchestration
│   ├── index.css                 # Tailwind CSS styles & modern dark theme
│   └── main.tsx
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🛠️ Setup & Running Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration (Optional)
Create a `.env` file in the `email scheduler` directory:
```env
VITE_API_URL=http://localhost:5000/api
```
*(If the backend is not yet running, the frontend automatically activates high-fidelity demo mode with persistent local storage, so you can test all features right away without crashes!)*

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) (or the port Vite outputs) in your browser.

### 4. Build for Production
```bash
npm run build
```
Builds the optimized production bundle with zero TypeScript or ESLint errors.
