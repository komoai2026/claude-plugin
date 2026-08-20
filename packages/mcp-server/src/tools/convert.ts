import { createWriteStream, mkdirSync } from "node:fs";
import { readFile, rename } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { z } from "zod";
import type { McpSuccessResult, ToolContext } from "../context.js";
import { jsonResult } from "../context.js";
import { KolmoPdfError } from "../errors.js";
import { MAX_FILE_BYTES, readFileSize } from "../pages.js";
import { pollUntilComplete } from "../polling.js";
import { extensionForKind, sniffFile } from "../sniff.js";

export const convertName = "kolmopdf_convert_markdown";

export const convertDescription =
  "Convert a Markdown file (or a ZIP of markdown + images) to DOCX, HTML, PDF, " +
  "or LaTeX via KolmoPDF.";

export const convertInputSchema = z.object({
  file_path: z
    .string()
    .describe("Path to a .md/.markdown file or .zip containing markdown + images."),
  target_format: z.enum(["word", "docx", "html", "pdf", "latex", "tex"]).optional().default("word"),
  output_subdir: z.string().optional(),
});

export type ConvertInput = z.infer<typeof convertInputSchema>;

export interface ConvertOutput {
  task_id: string;
  points_deducted: number;
  remaining_points: number;
  output: {
    output_path: string;
    target_format: string;
    kind: string;
  };
}

export function formatToExtension(targetFormat: string): string {
  switch (targetFormat) {
    case "word":
    case "docx":
      return ".docx";
    case "html":
      return ".html";
    case "pdf":
      return ".pdf";
    case "latex":
    case "tex":
      return ".tex";
    default:
      return ".out";
  }
}

export function normalizeFormat(targetFormat: string): string {
  switch (targetFormat) {
    case "word":
    case "docx":
      return "docx";
    case "latex":
    case "tex":
      return "tex";
    default:
      return targetFormat;
  }
}
export async function convertHandler(
  args: ConvertInput,
  ctx: ToolContext,
): Promise<McpSuccessResult> {
  const client = ctx.getClient();
  const filePath = resolve(args.file_path);
  const filename = basename(filePath);

  const fileSize = await readFileSize(filePath);
  if (fileSize > MAX_FILE_BYTES) {
    throw new KolmoPdfError("convert_file_too_large");
  }

  const ext = filePath.toLowerCase();
  if (!ext.endsWith(".md") && !ext.endsWith(".markdown") && !ext.endsWith(".zip")) {
    throw new KolmoPdfError("convert_file_type_unsupported");
  }

  await ctx.progress?.report("[uploading] Sending file for conversion...");

  const fileBuffer = await readFile(filePath);
  const submitResult = await client.convert(
    fileBuffer,
    {
      target_format: args.target_format,
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

  await ctx.progress?.report("[downloading] Fetching converted file...");

  const subdir = args.output_subdir || taskId;
  const outputRoot = resolve(ctx.config.outputDir, subdir);
  mkdirSync(outputRoot, { recursive: true });

  const tempPath = join(outputRoot, "download.bin");
  const ws = createWriteStream(tempPath);
  await client.download(taskId, ws, { destPath: tempPath });
  const kind = await sniffFile(tempPath);
  const outputPath = join(outputRoot, `result${extensionForKind(kind)}`);
  await rename(tempPath, outputPath);

  const output: ConvertOutput = {
    task_id: taskId,
    points_deducted: submitResult.points_deducted,
    remaining_points: submitResult.remaining_points,
    output: {
      output_path: outputPath,
      target_format: normalizeFormat(args.target_format),
      kind,
    },
  };

  return jsonResult(output as unknown as Record<string, unknown>);
}
