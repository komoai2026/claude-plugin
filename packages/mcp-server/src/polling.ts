import type { KolmoPdfClient, StatusResult } from "./client.js";
import { KolmoPdfError } from "./errors.js";
import { type ProgressReporter, humanizeStatus } from "./progress.js";

export interface PollOptions {
  pollIntervalMs: number;
  maxPollMinutes: number;
  signal?: AbortSignal;
}

/** v1 success; legacy `completed` still accepted */
export const TERMINAL_OK = new Set(["succeeded", "completed"]);
export const TERMINAL_FAIL = new Set(["failed", "cancelled"]);
export const IN_FLIGHT_STATUSES = new Set(["queued", "pending", "waiting", "processing"]);

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

function nextSseFrame(buf: string): { frame: string; rest: string } | null {
  const lf = buf.indexOf("\n\n");
  const crlf = buf.indexOf("\r\n\r\n");
  if (lf < 0 && crlf < 0) return null;
  if (crlf >= 0 && (lf < 0 || crlf < lf)) {
    return { frame: buf.slice(0, crlf), rest: buf.slice(crlf + 4) };
  }
  return { frame: buf.slice(0, lf), rest: buf.slice(lf + 2) };
}

function eventNameFromFrame(raw: string): string {
  let eventName = "message";
  for (const line of raw.split(/\r?\n/)) {
    if (line.startsWith("event:")) eventName = line.slice(6).trim();
  }
  return eventName;
}

async function waitViaSse(ctx: PollContext, deadline: number): Promise<StatusResult | null> {
  const { client, taskId, progress, options } = ctx;
  const remaining = Math.max(1_000, deadline - Date.now());
  const timeout = AbortSignal.timeout(remaining);
  const parent = options.signal;
  const combined = parent === undefined ? timeout : AbortSignal.any([parent, timeout]);
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  try {
    const res = await client.openEvents(taskId, combined);
    const body = res.body;
    if (!body) return null;
    reader = body.getReader();
    const decoder = new TextDecoder();
    let buf = "";

    const handleEvent = async (eventName: string): Promise<StatusResult | "continue"> => {
      if (eventName === "job.succeeded") {
        const status = await fetchStatusWithRetry(client, taskId);
        if (TERMINAL_OK.has(String(status.status || ""))) {
          await progress?.report(`[completed] Task ${taskId} done`);
          return status;
        }
        return "continue";
      }
      if (eventName === "job.failed" || eventName === "job.cancelled") {
        const failed = await fetchStatusWithRetry(client, taskId);
        throw new KolmoPdfError(failed.error_code || eventName.slice("job.".length), {
          message: failed.message || "Task failed",
        });
      }
      if (eventName === "job.progress" || eventName === "job.snapshot") {
        await progress?.report(humanizeStatus("processing"));
      }
      return "continue";
    };

    while (!timeout.aborted) {
      if (parent?.aborted === true) throw new KolmoPdfError("client_polling_timeout");
      const { done, value } = await reader.read();
      if (done) {
        buf += decoder.decode();
        const last = nextSseFrame(`${buf}\n\n`);
        if (last) {
          const result = await handleEvent(eventNameFromFrame(last.frame));
          if (result !== "continue") return result;
        }
        break;
      }
      buf += decoder.decode(value, { stream: true });
      let next = nextSseFrame(buf);
      while (next) {
        buf = next.rest;
        const result = await handleEvent(eventNameFromFrame(next.frame));
        if (result !== "continue") return result;
        next = nextSseFrame(buf);
      }
    }
    return null;
  } catch (err) {
    if (err instanceof KolmoPdfError) {
      const code = err.errorCode;
      if (
        code !== "api_task_error" &&
        code !== "client_network_error" &&
        code !== "client_polling_timeout"
      ) {
        throw err;
      }
    }
    return null;
  } finally {
    try {
      await reader?.cancel();
    } catch {
      /* ignore */
    }
  }
}

export async function pollUntilComplete(ctx: PollContext): Promise<StatusResult> {
  const { client, taskId, options, progress } = ctx;
  const deadline = Date.now() + options.maxPollMinutes * 60_000;

  const viaSse = await waitViaSse(ctx, deadline);
  if (viaSse && TERMINAL_OK.has(String(viaSse.status || ""))) return viaSse;
  if (viaSse && TERMINAL_FAIL.has(String(viaSse.status || ""))) {
    throw new KolmoPdfError(viaSse.error_code || "api_task_error", {
      message: viaSse.message || "Task failed",
    });
  }

  while (true) {
    if (options.signal?.aborted === true) {
      throw new KolmoPdfError("client_polling_timeout");
    }
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
