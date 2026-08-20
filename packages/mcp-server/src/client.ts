import { randomUUID } from "node:crypto";
import type { Writable } from "node:stream";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { KolmoPdfError, errorFromApiBody } from "./errors.js";

export interface KolmoPdfClientOptions {
  apiKey: string;
  baseUrl: string;
  httpTimeoutMs: number;
  uploadTimeoutMs: number;
}

export interface ParseForm {
  table_mode?: "markdown" | "image";
  formula_format?: "dollar" | "bracket";
  enable_translation?: boolean;
  target_language?: string;
  output_options?: string[];
  images_as_url?: boolean;
  skip_rotation_detection?: boolean;
  enable_cross_page_merge?: boolean;
  /** Comma features or `none`. Server default outline,summary when omitted. */
  enrichment?: string;
}

export interface TranslateForm {
  source_language?: string;
  target_language?: string;
  layout_modes?: Array<"translated_only" | "side_by_side">;
  enable_image_translation?: boolean;
  enable_table_translation?: boolean;
}

export interface ConvertForm {
  target_format?: string;
}

/** Normalized client status (maps v1 + legacy). */
export type TaskStatus =
  | "queued"
  | "processing"
  | "succeeded"
  | "failed"
  | "cancelled"
  | "pending"
  | "waiting"
  | "completed"
  | string;

export interface SubmitResult {
  /** Public job id (v1) or legacy task id */
  task_id: string;
  status: TaskStatus | string;
  points_deducted: number;
  remaining_points: number;
  queue_info?: { position: number; ahead_tasks: number };
}

export interface JobResultMeta {
  task_id: string;
  download_url?: string;
  filename?: string | null;
  kind?: string | null;
  content_type?: string | null;
  sha256?: string | null;
  bytes?: number | null;
  files?: Array<{ name: string; kind: string }> | null;
}

export interface StatusResult {
  success: boolean;
  status: TaskStatus | string;
  message?: string;
  queue_info?: { position: number; ahead_tasks: number };
  error_code?: string;
  result?: JobResultMeta;
}

export interface DownloadMeta {
  contentType: string | null;
  isZip: boolean;
  bytesWritten: number;
  /** Absolute path written when destPath is provided */
  destPath?: string;
}

export interface BalanceResult {
  success: boolean;
  points: number;
  api_key: string;
}

export type FileInput = Buffer | NodeJS.ReadableStream;

function normalizeStatus(status: string | undefined): string {
  if (!status) return "processing";
  if (status === "completed") return "succeeded";
  if (status === "pending" || status === "waiting") return "queued";
  return status;
}

export class KolmoPdfClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly httpTimeoutMs: number;
  private readonly uploadTimeoutMs: number;

  constructor(opts: KolmoPdfClientOptions) {
    this.apiKey = opts.apiKey;
    this.baseUrl = opts.baseUrl;
    this.httpTimeoutMs = opts.httpTimeoutMs;
    this.uploadTimeoutMs = opts.uploadTimeoutMs;
  }

  private get jobsBase(): string {
    return `${this.baseUrl}/api/v1/jobs`;
  }

  private headers(): Record<string, string> {
    return {
      "X-API-Key": this.apiKey,
      Authorization: `Bearer ${this.apiKey}`,
    };
  }

  private async jsonRequest(url: string, init: RequestInit): Promise<Record<string, unknown>> {
    const res = await fetch(url, init);
    let body: Record<string, unknown> = {};
    const text = await res.text();
    try {
      body = text ? (JSON.parse(text) as Record<string, unknown>) : {};
    } catch {
      if (!res.ok) {
        throw new KolmoPdfError("api_task_error", {
          message: `HTTP ${res.status}: non-JSON body`,
          httpStatus: res.status,
        });
      }
    }

    // v1 create returns 202 without success:true; treat 2xx as ok unless success===false
    if (!res.ok || body.success === false) {
      const errObj = body.error as { code?: string; message?: string } | undefined;
      throw errorFromApiBody(
        {
          error_code: (body.error_code as string) || errObj?.code,
          message: (body.message as string) || errObj?.message,
          points_required: body.points_required as number | undefined,
          current_points: body.current_points as number | undefined,
        },
        res.status,
      );
    }
    return body;
  }

  private async buildFileForm(file: FileInput, filename: string): Promise<FormData> {
    const form = new FormData();
    let blob: Blob;
    if (Buffer.isBuffer(file)) {
      blob = new Blob([file]);
    } else {
      const chunks: Buffer[] = [];
      for await (const chunk of file) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      blob = new Blob([Buffer.concat(chunks)]);
    }
    form.append("file", blob, filename);
    return form;
  }

  private normalizeSubmit(body: Record<string, unknown>): SubmitResult {
    const id = String(body.id ?? body.task_id ?? body.legacy_task_id ?? "");
    if (!id) {
      throw new KolmoPdfError("task_creation_failed", { message: "No job id in create response" });
    }
    const queue = body.queue as { ahead?: number; position?: number } | null | undefined;
    return {
      task_id: id,
      status: normalizeStatus(String(body.status ?? "queued")),
      points_deducted: Number(body.points_deducted ?? 0),
      remaining_points: Number(body.remaining_points ?? 0),
      queue_info:
        queue && typeof queue.ahead === "number"
          ? { position: queue.position ?? 0, ahead_tasks: queue.ahead }
          : undefined,
    };
  }

  async parse(file: FileInput, form: ParseForm, filename: string): Promise<SubmitResult> {
    const fd = await this.buildFileForm(file, filename);
    if (form.table_mode) fd.append("table_mode", form.table_mode);
    if (form.formula_format) fd.append("formula_format", form.formula_format);
    if (form.enable_translation !== undefined)
      fd.append("enable_translation", String(form.enable_translation));
    if (form.target_language) fd.append("target_language", form.target_language);
    if (form.output_options?.length) fd.append("output_options", form.output_options.join(","));
    if (form.images_as_url !== undefined) fd.append("images_as_url", String(form.images_as_url));
    if (form.skip_rotation_detection !== undefined)
      fd.append("skip_rotation_detection", String(form.skip_rotation_detection));
    if (form.enable_cross_page_merge !== undefined)
      fd.append("enable_cross_page_merge", String(form.enable_cross_page_merge));
    if (form.enrichment !== undefined) fd.append("enrichment", form.enrichment);

    const body = await this.jsonRequest(`${this.jobsBase}/parse`, {
      method: "POST",
      headers: { ...this.headers(), "Idempotency-Key": randomUUID() },
      body: fd,
      signal: AbortSignal.timeout(this.uploadTimeoutMs),
    });
    return this.normalizeSubmit(body);
  }

  async translatePdf(
    file: FileInput,
    form: TranslateForm,
    filename: string,
  ): Promise<SubmitResult> {
    const fd = await this.buildFileForm(file, filename);
    if (form.source_language) fd.append("sourceLanguage", form.source_language);
    if (form.target_language) fd.append("targetLanguage", form.target_language);
    if (form.layout_modes?.length) fd.append("layoutModes", form.layout_modes.join(","));
    if (form.enable_image_translation !== undefined)
      fd.append("enableImageTranslation", String(form.enable_image_translation));
    if (form.enable_table_translation !== undefined)
      fd.append("enableTableTranslation", String(form.enable_table_translation));

    const body = await this.jsonRequest(`${this.jobsBase}/translate-pdf`, {
      method: "POST",
      headers: { ...this.headers(), "Idempotency-Key": randomUUID() },
      body: fd,
      signal: AbortSignal.timeout(this.uploadTimeoutMs),
    });
    return this.normalizeSubmit(body);
  }

  async convert(file: FileInput, form: ConvertForm, filename: string): Promise<SubmitResult> {
    const fd = await this.buildFileForm(file, filename);
    if (form.target_format) fd.append("targetFormat", form.target_format);

    const body = await this.jsonRequest(`${this.jobsBase}/convert`, {
      method: "POST",
      headers: { ...this.headers(), "Idempotency-Key": randomUUID() },
      body: fd,
      signal: AbortSignal.timeout(this.uploadTimeoutMs),
    });
    return this.normalizeSubmit(body);
  }

  async getStatus(taskId: string): Promise<StatusResult> {
    const body = await this.jsonRequest(`${this.jobsBase}/${encodeURIComponent(taskId)}`, {
      method: "GET",
      headers: this.headers(),
      signal: AbortSignal.timeout(this.httpTimeoutMs),
    });

    const status = normalizeStatus(String(body.status ?? "processing"));
    const err = body.error as { code?: string; message?: string } | null | undefined;
    const queue = body.queue as { ahead?: number; position?: number } | null | undefined;
    const result = body.result as JobResultMeta | null | undefined;

    const ok = status === "succeeded" || status === "completed";
    return {
      success: ok,
      status,
      message: (body.message as string) || err?.message,
      error_code: err?.code,
      queue_info:
        queue && typeof queue.ahead === "number"
          ? { position: queue.position ?? 0, ahead_tasks: queue.ahead }
          : undefined,
      result: result
        ? {
            task_id: taskId,
            download_url: result.download_url,
            filename: result.filename ?? null,
            kind: result.kind ?? null,
            content_type: result.content_type ?? null,
            sha256: result.sha256 ?? null,
            bytes: result.bytes ?? null,
            files: result.files ?? null,
          }
        : undefined,
    };
  }

  /** SSE stream for a job. Caller must abort/cancel the response body. */
  async openEvents(taskId: string, signal?: AbortSignal): Promise<Response> {
    const res = await fetch(`${this.jobsBase}/${encodeURIComponent(taskId)}/events`, {
      method: "GET",
      headers: {
        ...this.headers(),
        Accept: "text/event-stream",
      },
      signal,
    });
    if (!res.ok) {
      throw new KolmoPdfError("api_task_error", {
        message: `SSE failed with HTTP ${res.status}`,
        httpStatus: res.status,
      });
    }
    return res;
  }

  /**
   * Stream download to a Writable, or to destPath (preferred — allows ZIP sniff after write).
   */
  async download(
    taskId: string,
    dest: Writable,
    opts?: { destPath?: string },
  ): Promise<DownloadMeta> {
    const res = await fetch(`${this.jobsBase}/${encodeURIComponent(taskId)}/download`, {
      method: "GET",
      headers: this.headers(),
      signal: AbortSignal.timeout(this.uploadTimeoutMs),
    });
    if (!res.ok) {
      throw new KolmoPdfError("api_task_error", {
        message: `Download failed with HTTP ${res.status}`,
        httpStatus: res.status,
      });
    }
    const contentType = res.headers.get("content-type");
    let isZip =
      !!contentType &&
      (contentType.includes("zip") ||
        contentType.includes("application/octet-stream") ||
        contentType.includes("application/x-zip"));
    const body = res.body;
    if (!body) {
      throw new KolmoPdfError("api_task_error", { message: "Empty download response body" });
    }

    const reader = body.getReader();
    let bytesWritten = 0;
    const firstChunks: Buffer[] = [];
    let sniffed = false;

    async function* generate() {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const buf = Buffer.from(value);
        bytesWritten += buf.byteLength;
        if (!sniffed) {
          firstChunks.push(buf);
          const head = Buffer.concat(firstChunks);
          if (head.byteLength >= 4) {
            // ZIP local file header magic "PK\x03\x04"
            if (
              head[0] === 0x50 &&
              head[1] === 0x4b &&
              (head[2] === 0x03 || head[2] === 0x05 || head[2] === 0x07)
            ) {
              isZip = true;
            } else if (!contentType?.includes("zip")) {
              isZip = false;
            }
            sniffed = true;
          }
        }
        yield buf;
      }
    }

    const readable = Readable.from(generate());
    await pipeline(readable, dest);
    return { contentType, isZip, bytesWritten, destPath: opts?.destPath };
  }

  async getBalance(): Promise<BalanceResult> {
    const body = await this.jsonRequest(`${this.baseUrl}/api/v1/balance`, {
      method: "GET",
      headers: this.headers(),
      signal: AbortSignal.timeout(this.httpTimeoutMs),
    });
    return {
      success: body.success !== false,
      points: Number(body.points ?? 0),
      api_key: String(body.api_key ?? ""),
    };
  }
}
