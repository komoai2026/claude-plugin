import { describe, expect, it } from "vitest";
import { parsePdfInputSchema } from "../../src/tools/parse-pdf.js";

describe("parsePdfInputSchema languages", () => {
  it.each(["zh", "en", "ja", "ko", "fr", "de", "es", "ru", "pt"])(
    "accepts the Jobs API language %s",
    (target_language) => {
      expect(
        parsePdfInputSchema.safeParse({
          file_path: "document.pdf",
          enable_translation: true,
          target_language,
          output_options: ["translated"],
        }).success,
      ).toBe(true);
    },
  );

  it("rejects unsupported language codes", () => {
    expect(
      parsePdfInputSchema.safeParse({ file_path: "document.pdf", target_language: "xx" }).success,
    ).toBe(false);
  });
});
