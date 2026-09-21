import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { safeZipEntryPath } from "../../src/extract.js";
import { resolveOutputRoot } from "../../src/output.js";

describe("resolveOutputRoot", () => {
  const root = resolve("kolmopdf-output 测试");

  it("supports spaces and Unicode paths", () => {
    expect(resolveOutputRoot(root, "任务 こんにちは")).toBe(join(root, "任务 こんにちは"));
  });

  it("rejects parent and absolute escapes", () => {
    expect(() => resolveOutputRoot(root, "../outside")).toThrow("output_subdir");
    expect(() => resolveOutputRoot(root, resolve(root, "..", "outside"))).toThrow("output_subdir");
  });
});

describe("safeZipEntryPath", () => {
  const root = resolve("zip-output");

  it("normalizes archive separators and keeps entries inside the root", () => {
    expect(safeZipEntryPath(root, "资料\\images\\图 1.png")).toBe(
      join(root, "资料", "images", "图 1.png"),
    );
  });

  it.each(["../escape.md", "/absolute.md", "C:/escape.md", "folder/../../escape.md"])(
    "rejects unsafe entry %s",
    (entry) => {
      expect(() => safeZipEntryPath(root, entry)).toThrow("Unsafe ZIP entry path");
    },
  );
});
