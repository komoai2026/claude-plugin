import { chmodSync, readFileSync } from "node:fs";
import { defineConfig } from "tsup";

const packageJson = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf8"),
) as { version: string };

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  target: "node20",
  define: {
    __KOLMOPDF_VERSION__: JSON.stringify(packageJson.version),
  },
  banner: {
    js: "#!/usr/bin/env node",
  },
  onSuccess() {
    chmodSync(new URL("./dist/index.js", import.meta.url), 0o755);
  },
});
