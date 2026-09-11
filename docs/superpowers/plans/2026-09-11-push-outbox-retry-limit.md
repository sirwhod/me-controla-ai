# Push Outbox Retry Limit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop failed push notifications from being retried indefinitely and generating avoidable Firebase reads, writes, and Function invocations.

**Architecture:** Keep the existing Firestore outbox and event-driven delivery flow, but make retry policy explicit in the Firebase Function. Jobs with no active device or repeated delivery failures become terminal `failed` jobs after a bounded number of attempts; successful jobs remain `sent`.

**Tech Stack:** Firebase Functions v2, Firebase Admin Firestore, TypeScript, pnpm.

**Spec:** User request to correct the validated notification-cost issue caused by indefinite `_pushOutbox` retries.

## Global Constraints

- Preserve successful FCM delivery behavior.
- Do not expose credentials or change authentication behavior.
- Use the existing `southamerica-east1` region and `maxInstances: 1` setting.
- Verify with the Functions TypeScript build and the application production build.

---

### Task 1: Bound outbox retries

**Files:**
- Modify: `functions/src/index.ts`

**Interfaces:**
- `sendJob(jobId, job)` continues to process one outbox job.
- `retryPushOutbox` continues to select pending jobs, but terminal failures are no longer left pending.

- [ ] **Step 1: Add a maximum-attempt constant and preserve the existing `attempts` value when reading jobs.**
- [ ] **Step 2: Mark jobs with no active devices as `failed` instead of `pending`.**
- [ ] **Step 3: Mark delivery failures as `failed` once the maximum attempt count is reached; retain `pending` only for retryable failures below the limit.**
- [ ] **Step 4: Compile the Functions package.**

### Task 2: Verify application and production preview

**Files:**
- No additional source files.

- [ ] **Step 1: Run the relevant repository tests.**
- [ ] **Step 2: Run `pnpm build`.**
- [ ] **Step 3: Start exactly one `pnpm start` process from the fresh build and confirm it responds.**
- [ ] **Step 4: Inspect the diff and commit only the scoped correction after user-confirmed commit preference.**
