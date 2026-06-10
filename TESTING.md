# Handl - Test Automation Specifications & Guidelines

This document outlines the testing strategy, local emulator setup, database seeding commands, and CSS element locators for automated testing of the **Handl** application.

---

## 🛠️ 1. Test Environments & Configuration

All automated tests (UI, API, Security, Performance) are run locally against the **Supabase Docker Emulator** to ensure isolation and prevent polluting production data.

| Environment | Mode Flag | Configuration File | Target API Endpoint | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Development** | None | `.env.development` | `http://localhost:54321` | Local manual testing |
| **Testing** | `--mode test` | `.env.test` | `http://localhost:54321` | Playwright / Vitest automation |
| **Production** | `--mode production` | `.env.production.local` | `https://rpwneexotbictudjkcsv.supabase.co` | Vercel production |

### Local Test Credentials
* **Test User Email:** `test-user@handl.space`
* **Test User Password:** `Password123!`

---

## 🐳 2. Supabase Emulator Setup

The Supabase local development stack runs in Docker. 

### Commands
1. **Initialize CLI (if first time):**
   ```bash
   supabase init
   ```
2. **Start the Emulator:**
   ```bash
   supabase start
   ```
   *This spins up PostgreSQL (`54322`), GoTrue Auth (`54321/auth/v1`), and REST API (`54321/rest/v1`).*
3. **Stop the Emulator:**
   ```bash
   supabase stop
   ```
4. **Apply Schema & Seed Database:**
   Apply the SQL schema to the local database instance:
   ```bash
   supabase db execute < supabase_schema.sql
   ```
   Clear and populate the database with test data tasks:
   ```bash
   npm run db:seed
   ```
   *This executes the node script in `/scripts/seed-test-db.js` which signs in or registers the test user and inserts 5 standard tasks for test scenarios.*

---

## 🔍 3. CSS Selector & Element Locators Map

Use these standard selectors to target elements in UI tests. Do not use random text matches or class names that might change during styling updates.

### A. Authentication Pages
* **Email Input:** `input[type="email"]`
* **Password Input:** `input[type="password"]`
* **Submit Button:** `button[type="submit"]`
* **Auth Error Alert:** `div[role="alert"]`

### B. Task Creation & Editing Dialog (`TaskDialog.tsx`)
* **Dialog Content:** `div[role="dialog"]`
* **Task Title Input:** `input[placeholder*="Water the indoor"], input[placeholder*="Call Mom"], input[placeholder*="Read 10 pages"]`
* **Task Description Input:** `textarea[placeholder*="Add details"]`
* **"Handle Now" Toggle Switch:** `button[role="switch"]` (State verified via `aria-checked="true"`)
* **Due Date Popover Trigger:** `button:has(.lucide-calendar)`
* **Calendar Date Button:** `button[role="gridcell"]`
* **Tags Input:** `input[placeholder*="work, urgent"]`
* **Submit Button:** `button[type="submit"]` (Text: `"Create Handl"` or `"Update Handl"`)
* **Delete Button:** `button:has(.lucide-trash-2)`

### C. Dashboard View (`Dashboard.tsx`)
* **Handl Today Section:** `div:has-text("Handl Today")`
* **Cheklist Item Card:** `div.group:has(button)`
* **Task Checkbox:** `button.rounded-md:has(.lucide-check-circle-2)`
* **Alert Indicator Dot:** `span.rounded-full` (Check classes for state):
  * Overdue: `.bg-red-500.animate-soft-glow-red`
  * Due Today + Now: `.bg-orange-600.animate-soft-glow-orange`
  * Due Today + Later: `.bg-amber-500.animate-soft-glow-amber`
* **Priority Badge:** `span.rounded-full` (Checks: `"Now"`, `"Later"`, `"Due Today"`, `"Overdue"`)

### D. Table View (`TaskList.tsx`)
* **Task Row:** `tr[data-index]`
* **Drag Grip Handle:** `td:has(.lucide-grip-vertical)`
* **Row Checkbox:** `button:has(.lucide-check-circle-2), button:has(.lucide-circle)`
* **Priority Badge Column:** `td >> span.badge`
* **Due Date Column:** `td >> .lucide-clock`
* **Delete Button:** `button:has(.lucide-trash-2)`

---

## 🏃‍♂️ 4. Automated User Journeys (Test Scenarios)

### Scenario 1: Task Creation (Later vs. Now)
1. Open Task Dialog.
2. Enter Title `"Buy groceries"`.
3. Keep **"Handle Now"** toggle `OFF` (Later priority).
4. Click `"Create Handl"`.
5. **Verify:** Task appears in list with `"Later"` priority badge (Slate color).
6. Create another task `"Fix flat tire"`, toggle **"Handle Now"** `ON`.
7. **Verify:** Task appears in list with `"Now"` priority badge (Orange color).

### Scenario 2: Due Today Alert Triggering
1. Create a task, set due date to **Today**.
2. **Verify:** Priority badge changes to `"Due Today"`.
3. **Verify:** Blinking alert dot appears to the left of the checkbox.
   * If priority is `"Now"`, dot must be **Orange** (`bg-orange-600`).
   * If priority is `"Later"`, dot must be **Amber** (`bg-amber-500`).

### Scenario 3: Overdue Task Formatting
1. Create a task, set due date to **Yesterday** (requires custom database seed or date picker mock).
2. **Verify:** Priority badge is completely hidden (`showPriorityBadge === false`).
3. **Verify:** Red blinking dot (`bg-red-500 animate-soft-glow-red`) appears to the left of the checkbox.
4. **Verify:** Pulsing red `"Overdue"` label appears in the list.

### Scenario 4: Task Completion & State Clean Up
1. Click the checkbox on an active task.
2. **Verify:** Task receives line-through style and is marked complete.
3. **Verify:** Blinking alert dot disappears immediately.
4. **Verify:** Completed task displays `"Done"` badge (Green).

---

## 🤖 5. Multi-Agent Testing Team & Prompts

To run automated checks without context bloat, the testing suite uses a **Manager-Worker (Hub-and-Spoke)** pattern. In a new session, the Manager Agent can read these specs to instantly re-declare the subagents:

### 1. UI QA Agent (`ui-qa-agent`)
* **Description**: Specialized in E2E browser automation, functional flows, and UI alerts.
* **System Prompt**:
  > You are a UI QA Engineer specialist. Your job is to maintain, write, and execute functional and E2E UI test suites using Playwright. You read React components and page schemas, utilize the Page Object Models (POMs) under `tests/pages/`, write test specifications, run browser tests, and report results.

### 2. API QA Agent (`api-qa-agent`)
* **Description**: Focused on REST endpoint testing, status checks, and data verification.
* **System Prompt**:
  > You are an API QA Engineer specialist. Your job is to test REST APIs, endpoint payloads, schemas, and database RLS connections. You write and execute integration and endpoint test suites, read routing configurations and swagger specs, write tests under `tests/specs/api/`, run them, and report results.

### 3. Performance QA Agent (`perf-qa-agent`)
* **Description**: Specialized in load, stress, and latency testing using k6.
* **System Prompt**:
  > You are a Performance QA Engineer subagent. Your task is to inspect the project's API endpoints, create k6 performance testing scripts (for smoke, load, and stress scenarios), run them locally, analyze metrics (VUs, request duration, error rates), and write a summary of performance findings.

### 4. Security QA Agent (`security-qa-agent`)
* **Description**: Focuses on static analysis (SAST), dependencies (SCA), and RLS rules.
* **System Prompt**:
  > You are a Security QA Auditor subagent. Your task is to perform static analysis (SAST) and dependency auditing (SCA) on the codebase. Run scans using tools like Snyk, Semgrep, or npm audit, inspect Supabase database RLS/security boundaries, and generate a report identifying any vulnerability findings, severities, and recommendations.

