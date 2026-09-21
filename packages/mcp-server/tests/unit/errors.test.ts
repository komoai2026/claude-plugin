import { describe, expect, it } from "vitest";
import {
  ERROR_SPECS,
  KolmoPdfError,
  errorFromApiBody,
  isAutoRefunded,
  toMcpErrorResult,
} from "../../src/errors.js";

describe("KolmoPdfError", () => {
  it("uses the spec default message, status, and remediation", () => {
    const err = new KolmoPdfError("invalid_api_key");
    expect(err.errorCode).toBe("invalid_api_key");
    expect(err.httpStatus).toBe(401);
    expect(err.message).toBe("API key is missing or invalid.");
    expect(err.remediation).toContain("api-keys");
    expect(err.source).toBe("api");
  });

  it("allows overriding message, status, and point fields", () => {
    const err = new KolmoPdfError("insufficient_points", {
      message: "custom",
      pointsRequired: 20,
      currentPoints: 5,
    });
    expect(err.message).toBe("custom");
    expect(err.pointsRequired).toBe(20);
    expect(err.currentPoints).toBe(5);
  });

  it("falls back to a generic spec for unknown codes", () => {
    const err = new KolmoPdfError("totally_made_up");
    expect(err.message).toBe("Unknown error.");
    expect(err.httpStatus).toBeNull();
  });
});

describe("toMcpErrorResult", () => {
  it("wraps a KolmoPdfError into the MCP error envelope", () => {
    const result = toMcpErrorResult(
      new KolmoPdfError("insufficient_points", { pointsRequired: 20, currentPoints: 5 }),
    );
    expect(result.isError).toBe(true);
    const payload = JSON.parse(result.content[0]?.text ?? "");
    expect(payload.error_code).toBe("insufficient_points");
    expect(payload.http_status).toBe(402);
    expect(payload.points_required).toBe(20);
    expect(payload.current_points).toBe(5);
    expect(payload.remediation).toContain("https://www.kolmopdf.com/credits");
    expect(payload.remediation).toContain("no subscription required");
  });

  it("coerces a plain Error into api_task_error", () => {
    const result = toMcpErrorResult(new Error("boom"));
    const payload = JSON.parse(result.content[0]?.text ?? "");
    expect(payload.error_code).toBe("api_task_error");
    expect(payload.message).toBe("boom");
  });

  it("omits point fields when not provided", () => {
    const result = toMcpErrorResult(new KolmoPdfError("parse_error"));
    const payload = JSON.parse(result.content[0]?.text ?? "");
    expect(payload).not.toHaveProperty("points_required");
    expect(payload).not.toHaveProperty("current_points");
  });
});

describe("isAutoRefunded", () => {
  it("flags server-refunded failure codes", () => {
    expect(isAutoRefunded("parse_error")).toBe(true);
    expect(isAutoRefunded("parse_timeout")).toBe(true);
    expect(isAutoRefunded("task_creation_failed")).toBe(true);
    expect(isAutoRefunded("parse_file_invalid")).toBe(true);
  });

  it("does not flag non-refunded codes", () => {
    expect(isAutoRefunded("invalid_api_key")).toBe(false);
    expect(isAutoRefunded("insufficient_points")).toBe(false);
  });
});

describe("errorFromApiBody", () => {
  it("maps a failure body with code + points", () => {
    const err = errorFromApiBody(
      {
        error_code: "insufficient_points",
        message: "Insufficient points",
        points_required: 20,
        current_points: 15,
      },
      402,
    );
    expect(err.errorCode).toBe("insufficient_points");
    expect(err.httpStatus).toBe(402);
    expect(err.pointsRequired).toBe(20);
    expect(err.currentPoints).toBe(15);
  });

  it("defaults to api_task_error when no code is present", () => {
    const err = errorFromApiBody({ message: "weird" });
    expect(err.errorCode).toBe("api_task_error");
  });
});

describe("ERROR_SPECS coverage", () => {
  it("every spec has a non-empty message and remediation", () => {
    for (const [code, spec] of Object.entries(ERROR_SPECS)) {
      expect(spec.message, code).toBeTruthy();
      expect(spec.remediation, code).toBeTruthy();
      expect(["api", "client"]).toContain(spec.source);
    }
  });
});
