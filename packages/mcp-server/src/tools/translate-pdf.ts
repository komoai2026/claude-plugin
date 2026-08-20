import { createWriteStream, mkdirSync } from "node:fs";
import { readFile, rename } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { z } from "zod";
import type { McpSuccessResult, ToolContext } from "../context.js";
import { jsonResult } from "../context.js";
import { KolmoPdfError } from "../errors.js";
import { MAX_FILE_BYTES, MAX_PAGES, readFileSize, readPageCount } from "../pages.js";
import { pollUntilComplete } from "../polling.js";
import { extractZip } from "../extract.js";
import { extensionForKind, sniffFile } from "../sniff.js";

export const translatePdfName = "kolmopdf_translate_pdf";

export const translatePdfDescription =
  "Translate a PDF while preserving its original layout via KolmoPDF. " +
  "Produces a translated PDF, or a ZIP of PDFs when multiple layout modes are requested.";

export const translatePdfInputSchema = z.object({
  file_path: z.string(),
  source_language: z.string().optional().default("en"),
  target_language: z.string().optional().default("zh"),
  layout_modes: z
    .array(z.enum(["translated_only", "side_by_side"]))
    .optional()
    .default(["translated_only"]),
  enable_image_translation: z.boolean().optional().default(false),
  enable_table_translation: z.boolean().optional().default(false),
  output_subdir: z.string().optional(),
});

export type TranslatePdfInput = z.infer<typeof translatePdfInputSchema>;

export interface TranslatePdfOutput {
  task_id: string;
  pages_translated: number;
  points_deducted: number;
  remaining_points: number;
  output: {
    kind: string;
    translated_pdf_path: string;
    archive_path?: string;
  };
}

export async function translatePdfHandler(
  args: TranslatePdfInput,
  ctx: ToolContext,
): Promise<McpSuccessResult> {
  const client = ctx.getClient();
  const filePath = resolve(args.file_path);
  const filename = basename(filePath);
  const fileSize = await readFileSize(filePath);
  if (fileSize > MAX_FILE_BYTES) {
    throw new KolmoPdfError("translate_pdf_file_too_large");
  }

  const pageCount = await readPageCount(filePath);
  if (pageCount > MAX_PAGES) {
    throw new KolmoPdfError("translate_pdf_page_limit_exceeded");
  }

  await ctx.progress?.report("[uploading] Sending PDF for translation...");

  const fileBuffer = await readFile(filePath);
  const submitResult = await client.translatePdf(
    fileBuffer,
    {
      source_language: args.source_language,
      target_language: args.target_language,
      layout_modes: args.layout_modes,
      enable_image_translation: args.enable_image_translation,
      enable_table_translation: args.enable_table_translation,
    },
    filename,
  );

  const taskId = submitResult.task_id;
  await ctx.progress?.report(`[submitted] Task ${taskId} created`);

  await pollUntilComplete({
    client,
    taskId,
    options: {
      pollIntervalMs: ctx.config.pollIntervalMs,
      maxPollMinutes: ctx.config.maxPollMinutes,
    },
    progress: ctx.progress,
  });

  await ctx.progress?.report("[downloading] Fetching translated result...");

  const subdir = args.output_subdir || taskId;
  const outputRoot = resolve(ctx.config.outputDir, subdir);
  mkdirSync(outputRoot, { recursive: true });

  const tempPath = join(outputRoot, "download.bin");
  const ws = createWriteStream(tempPath);
  await client.download(taskId, ws, { destPath: tempPath });

  const kind = await sniffFile(tempPath);
  let translatedPdfPath = join(outputRoot, `translated${extensionForKind(kind)}`);
  let archivePath: string | undefined;
  await rename(tempPath, translatedPdfPath);

  if (kind === "zip") {
    archivePath = translatedPdfPath;
    const extracted = await extractZip(archivePath, outputRoot);
    const pdfs = extracted.files.filter((f) => f.toLowerCase().endsWith(".pdf"));
    if (pdfs[0]) translatedPdfPath = pdfs[0];
  }

  const pagesTranslated = Math.round(submitResult.points_deducted / 2);

  const output: TranslatePdfOutput = {
    task_id: taskId,
    pages_translated: pagesTranslated,
    points_deducted: submitResult.points_deducted,
    remaining_points: submitResult.remaining_points,
    output: {
      kind,
      translated_pdf_path: translatedPdfPath,
      ...(archivePath ? { archive_path: archivePath } : {}),
    },
  };

  return jsonResult(output as unknown as Record<string, unknown>);
}
