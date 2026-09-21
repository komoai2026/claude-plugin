import { isAbsolute } from "node:path";
import { describe, expect, it } from "vitest";
import { configDefaults, loadConfig, maskApiKey, normalizeApiKey } from "../../src/config.js";

describe("loadConfig", () => {
  it("applies defaults when env is empty", () => {
    const cfg = loadConfig({});
    expect(cfg.apiKey).toBeUndefined();
    expect(cfg.baseUrl).toBe(configDefaults.baseUrl);
    expect(cfg.outputDir).toBe(configDefaults.outputDir);
    expect(cfg.pollIntervalMs).toBe(configDefaults.pollIntervalMs);
    expect(cfg.maxPollMinutes).toBe(configDefaults.maxPollMinutes);
    expect(cfg.httpTimeoutMs).toBe(configDefaults.httpTimeoutMs);
    expect(cfg.uploadTimeoutMs).toBe(configDefaults.uploadTimeoutMs);
  });

  it("reads and trims the API key", () => {
    expect(loadConfig({ KOLMOPDF_API_KEY: "  sk-abc  " }).apiKey).toBe("sk-abc");
    expect(loadConfig({ KOLMOPDF_API_KEY: "   " }).apiKey).toBeUndefined();
  });

  it("treats an unexpanded plugin placeholder as missing", () => {
    expect(normalizeApiKey("${KOLMOPDF_API_KEY}")).toBeUndefined();
    expect(normalizeApiKey("${KOLMOPDF_API_KEY:-}")).toBeUndefined();
  });

  it("uses an absolute, user-level output directory by default", () => {
    expect(isAbsolute(loadConfig({}).outputDir)).toBe(true);
    expect(loadConfig({}).outputDir).toBe(configDefaults.outputDir);
  });

  it("strips trailing slashes from the base URL", () => {
    expect(loadConfig({ KOLMOPDF_BASE_URL: "https://example.com/" }).baseUrl).toBe(
      "https://example.com",
    );
    expect(loadConfig({ KOLMOPDF_BASE_URL: "https://example.com///" }).baseUrl).toBe(
      "https://example.com",
    );
  });

  it("parses numeric envs and falls back on invalid values", () => {
    expect(loadConfig({ KOLMOPDF_POLL_INTERVAL_MS: "500" }).pollIntervalMs).toBe(500);
    expect(loadConfig({ KOLMOPDF_POLL_INTERVAL_MS: "abc" }).pollIntervalMs).toBe(
      configDefaults.pollIntervalMs,
    );
    expect(loadConfig({ KOLMOPDF_MAX_POLL_MINUTES: "-3" }).maxPollMinutes).toBe(
      configDefaults.maxPollMinutes,
    );
  });
});

describe("maskApiKey", () => {
  it("shows first 6 + last 4 for long keys", () => {
    expect(maskApiKey("sk-1234567890abcdef")).toBe("sk-123***cdef");
  });

  it("fully masks short keys", () => {
    expect(maskApiKey("short")).toBe("***");
  });
});
