/**
 * Unified KolmoPDF error model and MCP error-result formatting.
 *
 * Implements the error-code mapping table in DEVELOPMENT.md §8 and the
 * MCP tool error envelope in §5.13.
 */

export type ErrorSource = "api" | "client";

export interface ErrorSpec {
  /** Default human-readable message. */
  message: string;
  /** Actionable remediation hint surfaced to the LLM / user. */
  remediation: string;
  /** Typical HTTP status; null for client-side codes. */
  httpStatus: number | null;
  source: ErrorSource;
}

/** Canonical mapping of every error_code we may surface (DEVELOPMENT.md §8). */
export const ERROR_SPECS: Record<string, ErrorSpec> = {
  // --- API codes ---
  invalid_api_key: {
    message: "API key is missing or invalid.",
    remediation: "Create a key at https://www.kolmopdf.com/api-keys. Every account, including PAYG, can create one API key.",
    httpStatus: 401,
    source: "api",
  },
  insufficient_points: {
    message: "Not enough credits.",
    remediation: "Buy one-time credits at https://www.kolmopdf.com/credits — no subscription required. Credits are shared with the web account. Check the API key spending limit separately. Never start a purchase without the user's confirmation.",
    httpStatus: 402,
    source: "api",
  },
  points_deduction_failed: {
    message: "Credit deduction failed.",
    remediation: "Check your balance and API key limit. Buy one-time credits at https://www.kolmopdf.com/credits; do not retry a paid operation or purchase automatically.",
    httpStatus: 402,
    source: "api",
  },
  no_file_found: {
    message: "Request missing file field.",
    remediation: "(internal) MCP server bug, please report.",
    httpStatus: 400,
    source: "api",
  },
  parse_file_too_large: {
    message: "PDF exceeds 300MB.",
    remediation: "Split the PDF locally.",
    httpStatus: 400,
    source: "api",
  },
  parse_page_limit_exceeded: {
    message: "PDF exceeds 800 pages.",
    remediation: "Split the PDF locally.",
    httpStatus: 400,
    source: "api",
  },
  parse_file_not_pdf: {
    message: "File is not a valid PDF.",
    remediation: "Upload a .pdf file.",
    httpStatus: 400,
    source: "api",
  },
  translate_pdf_file_too_large: {
    message: "PDF exceeds 300MB.",
    remediation: "Split the PDF locally.",
    httpStatus: 400,
    source: "api",
  },
  translate_pdf_file_not_pdf: {
    message: "File is not a valid PDF.",
    remediation: "Upload a .pdf file.",
    httpStatus: 400,
    source: "api",
  },
  translate_pdf_page_limit_exceeded: {
    message: "PDF exceeds 800 pages.",
    remediation: "Split the PDF locally.",
    httpStatus: 400,
    source: "api",
  },
  convert_file_too_large: {
    message: "File exceeds 300MB.",
    remediation: "Reduce file size.",
    httpStatus: 400,
    source: "api",
  },
  convert_file_type_unsupported: {
    message: "File must be .md / .markdown / .zip.",
    remediation: "Convert source to markdown first.",
    httpStatus: 400,
    source: "api",
  },
  convert_target_format_unsupported: {
    message: "Target format unsupported.",
    remediation: "Use word/docx/html/pdf/latex/tex.",
    httpStatus: 400,
    source: "api",
  },
  file_upload_failed: {
    message: "Upload to storage failed.",
    remediation: "Check network and retry.",
    httpStatus: 500,
    source: "api",
  },
  task_creation_failed: {
    message: "Task creation failed.",
    remediation: "Retry.",
    httpStatus: 500,
    source: "api",
  },
  parse_error: {
    message: "Parsing failed.",
    remediation: "Retry; if it persists, split and try again.",
    httpStatus: 500,
    source: "api",
  },
  parse_file_invalid: {
    message: "PDF is malformed.",
    remediation: "Re-export the PDF.",
    httpStatus: 500,
    source: "api",
  },
  parse_timeout: {
    message: "Server-side timeout.",
    remediation: "Split into smaller PDFs.",
    httpStatus: 500,
    source: "api",
  },
  api_task_error: {
    message: "Generic task error.",
    remediation: "Retry; if it persists contact support.",
    httpStatus: 500,
    source: "api",
  },
  // --- client codes ---
  client_polling_timeout: {
    message: "Local polling exceeded KOLMOPDF_MAX_POLL_MINUTES.",
    remediation: "Task may still be running. Use kolmopdf_get_task_status with task_id.",
    httpStatus: null,
    source: "client",
  },
  client_network_error: {
    message: "Network error after retries.",
    remediation: "Check network.",
    httpStatus: null,
    source: "client",
  },
  client_local_validation: {
    message: "Local pre-check failed (page count / file size).",
    remediation: "See message for the specific limit that was exceeded.",
    httpStatus: null,
    source: "client",
  },
  client_extract_failed: {
    message: "ZIP extraction failed.",
    remediation: "Check disk permissions on output dir.",
    httpStatus: null,
    source: "client",
  },
} as const;

const UNKNOWN_SPEC: ErrorSpec = {
  message: "Unknown error.",
  remediation: "Retry; if it persists contact https://www.kolmopdf.com/contact.",
  httpStatus: null,
  source: "client",
};

export interface KolmoPdfErrorOptions {
  /** Override the default message from the spec. */
  message?: string;
  /** Override the default HTTP status from the spec. */
  httpStatus?: number | null;
  pointsRequired?: number;
  currentPoints?: number;
  /** Override the default remediation hint. */
  remediation?: string;
}

/** Structured error thrown across the MCP server; carries a stable error_code. */
export class KolmoPdfError extends Error {
  readonly errorCode: string;
  readonly httpStatus: number | null;
  readonly remediation: string;
  readonly pointsRequired: number | undefined;
  readonly currentPoints: number | undefined;
  readonly source: ErrorSource;

  constructor(errorCode: string, opts: KolmoPdfErrorOptions = {}) {
    const spec = ERROR_SPECS[errorCode] ?? UNKNOWN_SPEC;
    super(opts.message ?? spec.message);
    this.name = "KolmoPdfError";
    this.errorCode = errorCode;
    this.httpStatus = opts.httpStatus !== undefined ? opts.httpStatus : spec.httpStatus;
    this.remediation = opts.remediation ?? spec.remediation;
    this.pointsRequired = opts.pointsRequired;
    this.currentPoints = opts.currentPoints;
    this.source = spec.source;
  }
}

/** Shape of the JSON payload embedded in an MCP error result (DEVELOPMENT.md §5.13). */
export interface McpErrorPayload {
  error_code: string;
  message: string;
  http_status: number | null;
  points_required?: number;
  current_points?: number;
  remediation: string;
}

/** MCP tool result envelope for an error (matches MCP SDK `CallToolResult`). */
export interface McpErrorResult {
  isError: true;
  content: Array<{ type: "text"; text: string }>;
}

/** Convert a KolmoPdfError (or any error) into the MCP error result envelope. */
export function toMcpErrorResult(err: unknown): McpErrorResult {
  const kerr =
    err instanceof KolmoPdfError
      ? err
      : new KolmoPdfError("api_task_error", {
          message: err instanceof Error ? err.message : String(err),
        });

  const payload: McpErrorPayload = {
    error_code: kerr.errorCode,
    message: kerr.message,
    http_status: kerr.httpStatus,
    remediation: kerr.remediation,
  };
  if (kerr.pointsRequired !== undefined) payload.points_required = kerr.pointsRequired;
  if (kerr.currentPoints !== undefined) payload.current_points = kerr.currentPoints;

  return {
    isError: true,
    content: [{ type: "text", text: JSON.stringify(payload) }],
  };
}

/** Whether an API failure with this code is auto-refunded server-side (§8). */
export function isAutoRefunded(errorCode: string): boolean {
  return (
    errorCode === "task_creation_failed" ||
    errorCode === "parse_error" ||
    errorCode === "parse_file_invalid" ||
    errorCode === "parse_timeout"
  );
}

/** Map a raw API JSON failure body to a KolmoPdfError. */
export function errorFromApiBody(
  body: {
    error_code?: string;
    message?: string;
    points_required?: number;
    current_points?: number;
  },
  httpStatus?: number,
): KolmoPdfError {
  const code = body.error_code ?? "api_task_error";
  return new KolmoPdfError(code, {
    message: body.message,
    httpStatus: httpStatus ?? null,
    pointsRequired: body.points_required,
    currentPoints: body.current_points,
  });
}
