import { open, rename } from "node:fs/promises";
import { join } from "node:path";

export type SniffKind = "zip" | "pdf" | "markdown" | "docx" | "html" | "latex" | "binary";

const EXT: Record<SniffKind, string> = {
  zip: ".zip",
  pdf: ".pdf",
  markdown: ".md",
  docx: ".docx",
  html: ".html",
  latex: ".tex",
  binary: ".bin",
};

export function extensionForKind(kind: SniffKind): string {
  return EXT[kind];
}

export function sniffBytes(buf: Uint8Array): SniffKind {
  if (
    buf.length >= 4 &&
    buf[0] === 0x50 &&
    buf[1] === 0x4b &&
    (buf[2] === 0x03 || buf[2] === 0x05 || buf[2] === 0x07)
  ) {
    const hay = Buffer.from(buf.subarray(0, Math.min(buf.length, 65536))).toString("latin1");
    if (
      hay.includes("word/document.xml") ||
      hay.includes("wordprocessingml.document") ||
      (hay.includes("[Content_Types].xml") && hay.toLowerCase().includes("word/"))
    ) {
      return "docx";
    }
    return "zip";
  }
  if (buf.length >= 4 && buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46) {
    return "pdf";
  }
  const head = Buffer.from(buf.subarray(0, Math.min(buf.length, 800))).toString("utf8");
  const trimmed = head.trimStart().toLowerCase();
  if (trimmed.startsWith("<!doctype html") || trimmed.startsWith("<html")) return "html";
  if (trimmed.startsWith("\\documentclass") || trimmed.startsWith("\\begin{document}"))
    return "latex";
  if (head.trimStart().startsWith("#") || head.includes("\n# ") || head.includes("\n```"))
    return "markdown";
  return "binary";
}

export async function sniffFile(filePath: string): Promise<SniffKind> {
  const handle = await open(filePath, "r");
  try {
    const bytes = Buffer.alloc(65536);
    const { bytesRead } = await handle.read(bytes, 0, bytes.length, 0);
    return sniffBytes(bytes.subarray(0, bytesRead));
  } finally {
    await handle.close();
  }
}

export async function renameBySniff(
  tempPath: string,
  destDir: string,
  stem: string,
): Promise<{
  path: string;
  kind: SniffKind;
}> {
  const kind = await sniffFile(tempPath);
  const path = join(destDir, `${stem}${EXT[kind]}`);
  if (path !== tempPath) {
    await rename(tempPath, path);
  }
  return { path, kind };
}

export function replaceExt(filename: string, ext: string): string {
  const e = ext.startsWith(".") ? ext : `.${ext}`;
  const base = filename.replace(/\.[^.]+$/, "") || "result";
  return `${base}${e}`;
}
