import { readFile, stat } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";
import { KolmoPdfError } from "./errors.js";

export const MAX_PAGES = 800;
export const MAX_FILE_BYTES = 300 * 1024 * 1024;

async function countPages(data: Uint8Array): Promise<number> {
  const doc = await PDFDocument.load(data, { ignoreEncryption: true });
  const pages = doc.getPageCount();
  if (!Number.isSafeInteger(pages) || pages <= 0) throw new Error("Invalid page count");
  return pages;
}

function completePdfPrefix(data: Buffer): Buffer | null {
  // Use the LAST complete revision, not the first EOF (incremental updates).
  // This view is only for local counting; submissions always read original bytes.
  const text = data.toString("latin1");
  const markers = /(?:^|[\r\n])startxref\s+(\d+)\s+%%EOF/g;
  let last: RegExpExecArray | null = null;
  for (let match = markers.exec(text); match; match = markers.exec(text)) last = match;
  if (!last) return null;
  const end = last.index + last[0].length;
  const xrefOffset = Number(last[1]);
  if (end >= data.length || !Number.isSafeInteger(xrefOffset) || xrefOffset >= last.index) return null;
  // The declared xref must point inside that revision to a table or stream object.
  if (!/^(?:xref\b|\d+\s+\d+\s+obj\b)/.test(text.slice(xrefOffset, xrefOffset + 64))) return null;
  return data.subarray(0, end);
}

export async function readPageCount(filePath: string): Promise<number> {
  const data = await readFile(filePath);
  try {
    return await countPages(data);
  } catch {
    const prefix = completePdfPrefix(data);
    if (prefix) {
      try { return await countPages(prefix); } catch { /* No earlier-revision or guessed count. */ }
    }
    throw new KolmoPdfError("client_local_validation", {
      message: "Exact page count is unavailable locally. This does not mean the PDF is unreadable.",
      remediation: "Submit the original PDF for server-side validation; local credit estimation is unavailable.",
    });
  }
}

/** Local submission preflight is advisory; the server enforces exact pages/credits. */
export async function readPageCountForSubmission(filePath: string): Promise<number | null> {
  try {
    return await readPageCount(filePath);
  } catch (error) {
    if (error instanceof KolmoPdfError && error.errorCode === "client_local_validation") return null;
    throw error;
  }
}

export async function readFileSize(filePath: string): Promise<number> {
  const s = await stat(filePath);
  return s.size;
}
