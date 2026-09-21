import { describe, expect, it } from "vitest";
import { formatToExtension, normalizeFormat, resolveConvertKind } from "../../src/tools/convert.js";

describe("formatToExtension", () => {
  it.each([
    ["word", ".docx"],
    ["docx", ".docx"],
    ["html", ".html"],
    ["pdf", ".pdf"],
    ["latex", ".tex"],
    ["tex", ".tex"],
  ])("%s → %s", (input, expected) => {
    expect(formatToExtension(input)).toBe(expected);
  });
});

describe("normalizeFormat", () => {
  it.each([
    ["word", "docx"],
    ["docx", "docx"],
    ["latex", "tex"],
    ["tex", "tex"],
    ["html", "html"],
    ["pdf", "pdf"],
  ])("%s → %s", (input, expected) => {
    expect(normalizeFormat(input)).toBe(expected);
  });
});

describe("resolveConvertKind", () => {
  it("preserves DOCX even though its container has ZIP magic", () => {
    expect(resolveConvertKind("zip", "word")).toBe("docx");
    expect(resolveConvertKind("zip", "docx")).toBe("docx");
  });

  it("keeps real ZIP bundles for non-DOCX targets", () => {
    expect(resolveConvertKind("zip", "latex")).toBe("zip");
  });
});
