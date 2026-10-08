import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PDFDocument } from "pdf-lib";
import type { ToolContext } from "../../src/context.js";
import { KolmoPdfError, toMcpErrorResult } from "../../src/errors.js";
import { readPageCount, readPageCountForSubmission } from "../../src/pages.js";
import { estimateCostHandler } from "../../src/tools/estimate-cost.js";
import { parsePdfHandler } from "../../src/tools/parse-pdf.js";
import { translatePdfHandler, translatePdfInputSchema } from "../../src/tools/translate-pdf.js";

const directory = fileURLToPath(new URL("../../../../tmp/pdf-pages-tests/", import.meta.url));
let base = "%PDF-1.4\n";
const offsets = [0];
for (const [id, body] of [
  [1, "<< /Type /Catalog /Pages 2 0 R >>"],
  [2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>"],
  [3, "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] >>"],
] as const) {
  offsets[id] = base.length;
  base += `${id} 0 obj\n${body}\nendobj\n`;
}
const firstXref = base.length;
base += "xref\n0 4\n0000000000 65535 f \n";
for (const offset of offsets.slice(1)) base += `${String(offset).padStart(10, "0")} 00000 n \n`;
base += `trailer\n<< /Root 1 0 R /Size 4 >>\nstartxref\n${firstXref}\n%%EOF\n`;
// Incremental revision changes the page tree from one page to two.
let incremental = base;
const pagesOffset = incremental.length;
incremental += "2 0 obj\n<< /Type /Pages /Kids [3 0 R 4 0 R] /Count 2 >>\nendobj\n";
const pageOffset = incremental.length;
incremental += "4 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] >>\nendobj\n";
const secondXref = incremental.length;
incremental += `xref\n2 1\n${String(pagesOffset).padStart(10, "0")} 00000 n \n4 1\n${String(pageOffset).padStart(10, "0")} 00000 n \ntrailer\n<< /Root 1 0 R /Size 5 /Prev ${firstXref} >>\nstartxref\n${secondXref}\n%%EOF\n`;
const tail = "999 0 obj\n<< /Type /XObject /Width";
const inputs = { valid: base, trailing: base + tail, incremental: incremental + tail, invalid: "%PDF-1.7\nnot-a-pdf\n%%EOF", broken: base.replace("/Kids [3 0 R]", "/Kids [99 0 R]") + tail };
beforeAll(async () => {
  await mkdir(directory, { recursive: true });
  for (const [name, data] of Object.entries(inputs)) await writeFile(join(directory, `${name}.pdf`), data);
  const large = await PDFDocument.create();
  for (let n = 0; n < 801; n++) large.addPage();
  await writeFile(join(directory, "large.pdf"), await large.save());
});
afterAll(() => rm(directory, { recursive: true, force: true }));

it("counts valid PDFs and ignores garbage only after the last complete revision", async () => {
  expect(await readPageCount(join(directory, "valid.pdf"))).toBe(1);
  expect(await readPageCount(join(directory, "trailing.pdf"))).toBe(1);
  expect(await readPageCount(join(directory, "incremental.pdf"))).toBe(2);
});

it.each(["invalid", "broken"])("does not manufacture counts for %s PDFs or fabricate HTTP 500", async name => {
  const path = join(directory, `${name}.pdf`);
  await expect(readPageCountForSubmission(path)).resolves.toBeNull();
  const error = await readPageCount(path).catch(error => error);
  expect(error).toBeInstanceOf(KolmoPdfError);
  const payload = JSON.parse(toMcpErrorResult(error).content[0]!.text);
  expect(payload.error_code).toBe("client_local_validation");
  expect(payload.http_status).toBeNull();
  expect(payload.message).toContain("does not mean the PDF is unreadable");
});

it("unavailable local estimation does not fetch a balance or guess credits", async () => {
  const getBalance = vi.fn();
  const context = { getClient: () => ({ getBalance }) } as unknown as ToolContext;
  await expect(estimateCostHandler({ file_path: join(directory, "invalid.pdf"), operation: "parse" }, context)).rejects.toMatchObject({ errorCode: "client_local_validation", httpStatus: null });
  expect(getBalance).not.toHaveBeenCalled();
});

it("estimate uses the latest revision's exact count when trailing debris is ignorable", async () => {
  const context = { getClient: () => ({ getBalance: async () => ({ points: 100 }) }) } as unknown as ToolContext;
  const result = await estimateCostHandler({ file_path: join(directory, "incremental.pdf"), operation: "parse" }, context);
  const payload = JSON.parse(result.content[0]!.text);
  expect(payload.pages).toBe(2);
  expect(payload.estimated_credits).toBe(4);
});

describe.each(["parse", "translate"] as const)("%s submission delegates unknown pages without altering bytes", operation => {
  it("keeps the local 800-page limit when the exact count is known", async () => {
    const submit = vi.fn();
    const context = { getClient: () => ({ parse: submit, translatePdf: submit }) } as unknown as ToolContext;
    const file_path = join(directory, "large.pdf");
    const result = operation === "parse"
      ? parsePdfHandler({ file_path }, context)
      : translatePdfHandler(translatePdfInputSchema.parse({ file_path }), context);
    await expect(result).rejects.toMatchObject({ errorCode: operation === "parse" ? "parse_page_limit_exceeded" : "translate_pdf_page_limit_exceeded" });
    expect(submit).not.toHaveBeenCalled();
  });
  it("reaches the server and preserves its real validation error", async () => {
    const submit = vi.fn(async (_bytes: Buffer) => { throw new KolmoPdfError("parse_file_invalid", { httpStatus: 400 }); });
    const context = { getClient: () => ({ parse: submit, translatePdf: submit }) } as unknown as ToolContext;
    const file_path = join(directory, "invalid.pdf");
    const result = operation === "parse"
      ? parsePdfHandler({ file_path }, context)
      : translatePdfHandler(translatePdfInputSchema.parse({ file_path }), context);
    await expect(result).rejects.toMatchObject({ errorCode: "parse_file_invalid", httpStatus: 400 });
    expect(submit).toHaveBeenCalledTimes(1);
    expect(submit.mock.calls[0]![0]).toEqual(Buffer.from(inputs.invalid));
  });
});
