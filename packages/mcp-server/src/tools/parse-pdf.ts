import { createWriteStream, mkdirSync } from "node:fs";
import { readFile, rename } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { z } from "zod";
import type { McpSuccessResult, ToolContext } from "../context.js";
import { jsonResult } from "../context.js";
import { KolmoPdfError } from "../errors.js";
import { extractZip } from "../extract.js";
import { MAX_FILE_BYTES, MAX_PAGES, readFileSize, readPageCount } from "../pages.js";
import { pollUntilComplete } from "../polling.js";

export const parsePdfName = "kolmopdf_parse_pdf";

export const parsePdfDescription =
  "Parse a local PDF into Markdown via KolmoPDF. Handles formulas, tables, " +
  "multi-column layouts, and code blocks. Optionally translates while parsing. " +
  "Server may attach outline.md/summary.md sidecars (ZIP download).";

export const parsePdfInputSchema = z.object({
  file_path: z.string().describe("Absolute or cwd-relative path to a local PDF file."),
  table_mode: z.enum(["markdown", "image"]).optional(),
  formula_format: z.enum(["dollar", "bracket"]).optional(),
  enable_translation: z.boolean().optional(),
  target_language: z.enum(["zh", "en", "ja", "ko", "fr", "de", "es", "ru"]).optional(),
  output_options: z.array(z.enum(["original", "translated", "bilingual"])).optional(),
  images_as_url: z.boolean().optional(),
  skip_rotation_detection: z.boolean().optional(),
  enable_cross_page_merge: z.boolean().optional(),
  enrichment: z
    .string()
    .optional()
    .describe(
      "Parse-time AI sidecars. Omit for server default outline,summary. Use 'none' to disable. Examples: outline,summary,verification",
    ),
  output_subdir: z
    .string()
    .optional()
    .describe("Subdirectory name under KOLMOPDF_OUTPUT_DIR. Defaults to <task_id>."),
});

export type ParsePdfInput = z.infer<typeof parsePdfInputSchema>;

export interface ParsePdfOutput {
  task_id: string;
  pages_parsed: number;
  points_deducted: number;
  remaining_points: number;
  output: {
    type: "zip_extracted" | "markdown_file";
    markdown_path: string;
    images_dir: string | null;
    output_root: string;
  };
  preview: string;
}

export async function parsePdfHandler(
  args: ParsePdfInput,
  ctx: ToolContext,
): Promise<McpSuccessResult> {
  const client = ctx.getClient();
  const filePath = resolve(args.file_path);
  const filename = basename(filePath);

  const fileSize = await readFileSize(filePath);
  if (fileSize > MAX_FILE_BYTES) {
    throw new KolmoPdfError("parse_file_too_large");
  }

  const pageCount = await readPageCount(filePath);
  if (pageCount > MAX_PAGES) {
    throw new KolmoPdfError("parse_page_limit_exceeded");
  }

  await ctx.progress?.report("[uploading] Sending PDF to KolmoPDF...");

  const fileBuffer = await readFile(filePath);
  const submitResult = await client.parse(
    fileBuffer,
    {
      table_mode: args.table_mode,
      formula_format: args.formula_format,
      enable_translation: args.enable_translation,
      target_language: args.target_language,
      output_options: args.output_options,
      images_as_url: args.images_as_url,
      skip_rotation_detection: args.skip_rotation_detection,
      enable_cross_page_merge: args.enable_cross_page_merge,
      enrichment: args.enrichment,
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

  await ctx.progress?.report("[downloading] Fetching result...");

  const subdir = args.output_subdir || taskId;
  const outputRoot = resolve(ctx.config.outputDir, subdir);
  mkdirSync(outputRoot, { recursive: true });

  // Always download to a temp name first — server may return ZIP even when images_as_url
  // (enrichment sidecars force a multi-file bundle).
  const downloadPath = join(outputRoot, "download.bin");
  const ws = createWriteStream(downloadPath);
  const meta = await client.download(taskId, ws, { destPath: downloadPath });

  let markdownPath: string;
  let imagesDir: string | null = null;
  let outputType: "zip_extracted" | "markdown_file";

  if (meta.isZip) {
    const zipPath = join(outputRoot, "result.zip");
    await rename(downloadPath, zipPath);
    const extracted = await extractZip(zipPath, outputRoot);
    markdownPath = extracted.markdownPath || join(outputRoot, "result.md");
    imagesDir = extracted.imagesDir;
    outputType = "zip_extracted";
  } else {
    markdownPath = join(outputRoot, "result.md");
    await rename(downloadPath, markdownPath);
    outputType = "markdown_file";
  }

  const mdContent = await readFile(markdownPath, "utf-8").catch(() => "");
  const preview = mdContent.slice(0, 500);

  const ptsPerPage = args.enable_translation ? 3 : 2;
  const pagesParsed = Math.round(submitResult.points_deducted / ptsPerPage);

  const output: ParsePdfOutput = {
    task_id: taskId,
    pages_parsed: pagesParsed,
    points_deducted: submitResult.points_deducted,
    remaining_points: submitResult.remaining_points,
    output: {
      type: outputType,
      markdown_path: markdownPath,
      images_dir: imagesDir,
      output_root: outputRoot,
    },
    preview,
  };

  return jsonResult(output as unknown as Record<string, unknown>);
}
