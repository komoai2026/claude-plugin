import { isAbsolute, relative, resolve } from "node:path";
import { KolmoPdfError } from "./errors.js";

/** Resolve an output subdirectory without allowing it to escape the configured root. */
export function resolveOutputRoot(baseDir: string, subdir: string): string {
  const root = resolve(baseDir);
  const candidate = resolve(root, subdir);
  const rel = relative(root, candidate);
  if (rel.startsWith("..") || isAbsolute(rel)) {
    throw new KolmoPdfError("client_local_validation", {
      message: "output_subdir must stay inside KOLMOPDF_OUTPUT_DIR.",
    });
  }
  return candidate;
}
