import type { KolmoPdfClient, StatusResult } from "./client.js";
import { KolmoPdfError } from "./errors.js";
import { type ProgressReporter, humanizeStatus } from "./progress.js";

export interface PollOptions {
  pollIntervalMs: number;
  maxPollMinutes: number;
}

/** v1 success; legacy `completed` still accepted */
export const TERMINAL_OK = new Set(["succeeded", "completed"]);
export const TERMINAL_FAIL = new Set(["failed", "cancelled"]);
export const IN_FLIGHT_STATUSES = new Set([
  "queued",
  "pending",
  "waiting",
  "processing",
]);

export const RETRY_POLICY = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  factor: 2,
} as const;

export function backoffDelayMs(attempt: number): number {
  return RETRY_POLICY.baseDelayMs * RETRY_POLICY.factor ** (attempt - 1);
}

export function isRetryable(err: { httpStatus?: number | null; code?: string }): boolean {
  const transientCodes = ["ECONNRESET", "ETIMEDOUT", "ECONNREFUSED", "EAI_AGAIN"];
  if (err.code && transientCodes.includes(err.code)) return true;
  if (typeof err.httpStatus === "number" && err.httpStatus >= 500) return true;
  return false;
}

export interface PollContext {
  client: KolmoPdfClient;
  taskId: string;
  options: PollOptions;
  progress?: ProgressReporter;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchStatusWithRetry(client: KolmoPdfClient, taskId: string): Promise<StatusResult> {
  for (let attempt = 1; attempt <= RETRY_POLICY.maxAttempts; attempt++) {
    try {
      return await client.getStatus(taskId);
    } catch (err) {
      const retryable =
        err instanceof KolmoPdfError
          ? isRetryable(err)
          : isRetryable({ code: (err as NodeJS.ErrnoException).code });
      if (!retryable || attempt === RETRY_POLICY.maxAttempts) throw err;
      await sleep(backoffDelayMs(attempt));
    }
  }
  throw new KolmoPdfError("client_network_error");
}

export async function pollUntilComplete(ctx: PollContext): Promise<StatusResult> {
  const { client, taskId, options, progress } = ctx;
  const deadline = Date.now() + options.maxPollMinutes * 60_000;

  while (true) {
    if (Date.now() > deadline) {
      throw new KolmoPdfError("client_polling_timeout");
    }

    const result = await fetchStatusWithRetry(client, taskId);
    const status = String(result.status || "");

    if (TERMINAL_OK.has(status)) {
      await progress?.report(`[completed] Task ${taskId} done`);
      return result;
    }

    if (TERMINAL_FAIL.has(status)) {
      throw new KolmoPdfError(result.error_code || "api_task_error", {
        message: result.message || "Task failed",
      });
    }

    const aheadTasks = result.queue_info?.ahead_tasks;
    await progress?.report(humanizeStatus(result.status as string, aheadTasks));
    await sleep(options.pollIntervalMs);
  }
}
