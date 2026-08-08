/**
 * @kolmopdf/mcp-server — stdio MCP server bootstrap (DEVELOPMENT.md §5.2).
 *
 * - Registers over the stdio transport.
 * - Does NOT validate the API key at startup; the key is read lazily so the
 *   server boots even with no network / no key. The first authenticated tool
 *   call surfaces a missing key as an MCP error (invalid_api_key).
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { KolmoPdfClient } from "./client.js";
import { loadConfig } from "./config.js";
import { type McpSuccessResult, type ToolContext, jsonResult } from "./context.js";
import { KolmoPdfError, toMcpErrorResult } from "./errors.js";
import {
  checkBalanceDescription,
  checkBalanceHandler,
  checkBalanceInputSchema,
  checkBalanceName,
} from "./tools/check-balance.js";
import {
  convertDescription,
  convertHandler,
  convertInputSchema,
  convertName,
} from "./tools/convert.js";
import {
  estimateCostDescription,
  estimateCostHandler,
  estimateCostInputSchema,
  estimateCostName,
} from "./tools/estimate-cost.js";
import {
  getTaskStatusDescription,
  getTaskStatusHandler,
  getTaskStatusInputSchema,
  getTaskStatusName,
} from "./tools/get-task-status.js";
import {
  parsePdfDescription,
  parsePdfHandler,
  parsePdfInputSchema,
  parsePdfName,
} from "./tools/parse-pdf.js";
import {
  translatePdfDescription,
  translatePdfHandler,
  translatePdfInputSchema,
  translatePdfName,
} from "./tools/translate-pdf.js";

const VERSION = "1.1.0";

/** Build the per-call tool context with a lazily-constructed API client. */
function buildContext(): ToolContext {
  const config = loadConfig();
  return {
    config,
    getClient(): KolmoPdfClient {
      if (!config.apiKey) {
        throw new KolmoPdfError("invalid_api_key");
      }
      return new KolmoPdfClient({
        apiKey: config.apiKey,
        baseUrl: config.baseUrl,
        httpTimeoutMs: config.httpTimeoutMs,
        uploadTimeoutMs: config.uploadTimeoutMs,
      });
    },
  };
}

/** Wrap a typed handler so all thrown errors become MCP error results (§5.13). */
function guard<A>(
  handler: (args: A, ctx: ToolContext) => Promise<McpSuccessResult>,
): (args: unknown) => Promise<CallToolResult> {
  return async (args: unknown) => {
    try {
      return (await handler(args as A, buildContext())) as CallToolResult;
    } catch (err) {
      return toMcpErrorResult(err) as CallToolResult;
    }
  };
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "kolmopdf", version: VERSION });

  server.registerTool(
    parsePdfName,
    { description: parsePdfDescription, inputSchema: parsePdfInputSchema.shape },
    guard(parsePdfHandler),
  );
  server.registerTool(
    translatePdfName,
    { description: translatePdfDescription, inputSchema: translatePdfInputSchema.shape },
    guard(translatePdfHandler),
  );
  server.registerTool(
    convertName,
    { description: convertDescription, inputSchema: convertInputSchema.shape },
    guard(convertHandler),
  );
  server.registerTool(
    estimateCostName,
    { description: estimateCostDescription, inputSchema: estimateCostInputSchema.shape },
    guard(estimateCostHandler),
  );
  server.registerTool(
    checkBalanceName,
    { description: checkBalanceDescription, inputSchema: checkBalanceInputSchema.shape },
    guard(checkBalanceHandler),
  );
  server.registerTool(
    getTaskStatusName,
    { description: getTaskStatusDescription, inputSchema: getTaskStatusInputSchema.shape },
    guard(getTaskStatusHandler),
  );

  return server;
}

async function main(): Promise<void> {
  // Surface --version without booting the transport (TESTING_AND_USAGE.md §9).
  if (process.argv.includes("--version") || process.argv.includes("-v")) {
    process.stdout.write(`${VERSION}\n`);
    return;
  }
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

// `jsonResult` is part of the public surface used by tool handlers (M2+).
export { jsonResult };

main().catch((err) => {
  const detail = err instanceof Error ? err.stack : String(err);
  process.stderr.write(`[kolmopdf-mcp] fatal: ${detail}\n`);
  process.exit(1);
});
