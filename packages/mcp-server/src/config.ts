/**
 * Environment-variable loader for the KolmoPDF MCP server.
 *
 * Per DEVELOPMENT.md §4 and §5.2, the API key is NOT validated at startup —
 * it is read lazily so the server can boot in offline / no-key environments.
 * The first authenticated tool call surfaces a missing key as an MCP error.
 */

import { homedir } from "node:os";
import { resolve } from "node:path";

export interface KolmoPdfConfig {
  /** Resolved at call time; may be undefined until the user sets it. */
  apiKey: string | undefined;
  baseUrl: string;
  outputDir: string;
  pollIntervalMs: number;
  maxPollMinutes: number;
  httpTimeoutMs: number;
  uploadTimeoutMs: number;
}

const DEFAULTS = {
  baseUrl: "https://www.kolmopdf.com",
  outputDir: resolve(homedir(), "kolmopdf-output"),
  pollIntervalMs: 2000,
  maxPollMinutes: 30,
  httpTimeoutMs: 60_000,
  uploadTimeoutMs: 600_000,
} as const;

function intFromEnv(value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === "") return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

/** Treat an empty or unexpanded plugin placeholder as a missing API key. */
export function normalizeApiKey(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed || /^\$\{KOLMOPDF_API_KEY(?::-[^}]*)?\}$/.test(trimmed)) return undefined;
  return trimmed;
}

/**
 * Build a config object from the current process environment.
 * Reads on every call so live env changes are picked up.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): KolmoPdfConfig {
  return {
    apiKey: normalizeApiKey(env.KOLMOPDF_API_KEY),
    baseUrl: trimTrailingSlash(env.KOLMOPDF_BASE_URL?.trim() || DEFAULTS.baseUrl),
    outputDir: resolve(env.KOLMOPDF_OUTPUT_DIR?.trim() || DEFAULTS.outputDir),
    pollIntervalMs: intFromEnv(env.KOLMOPDF_POLL_INTERVAL_MS, DEFAULTS.pollIntervalMs),
    maxPollMinutes: intFromEnv(env.KOLMOPDF_MAX_POLL_MINUTES, DEFAULTS.maxPollMinutes),
    httpTimeoutMs: intFromEnv(env.KOLMOPDF_HTTP_TIMEOUT_MS, DEFAULTS.httpTimeoutMs),
    uploadTimeoutMs: intFromEnv(env.KOLMOPDF_UPLOAD_TIMEOUT_MS, DEFAULTS.uploadTimeoutMs),
  };
}

/** Mask an API key for display: first 6 + "***" + last 4 (DEVELOPMENT.md §5.8). */
export function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 10) return "***";
  return `${apiKey.slice(0, 6)}***${apiKey.slice(-4)}`;
}

export const configDefaults = DEFAULTS;
