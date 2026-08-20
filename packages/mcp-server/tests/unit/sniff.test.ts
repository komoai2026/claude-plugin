import { describe, expect, it } from "vitest";
import { sniffBytes } from "../../src/sniff.js";

describe("sniffBytes", () => {
  it("detects zip even when the intended name would be .pdf", () => {
    expect(sniffBytes(Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00]))).toBe("zip");
  });
  it("detects pdf magic", () => {
    expect(sniffBytes(Buffer.from("%PDF-1.7\n"))).toBe("pdf");
  });
  it("detects docx via word/document.xml inside zip", () => {
    expect(
      sniffBytes(Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.from("word/document.xml")])),
    ).toBe("docx");
  });
  it("detects markdown headings", () => {
    expect(sniffBytes(Buffer.from("# Title\n\nHello"))).toBe("markdown");
  });
  it("detects docx via wordprocessingml content type", () => {
    expect(
      sniffBytes(
        Buffer.concat([
          Buffer.from([0x50, 0x4b, 0x03, 0x04]),
          Buffer.from("[Content_Types].xml application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
        ]),
      ),
    ).toBe("docx");
  });
});
