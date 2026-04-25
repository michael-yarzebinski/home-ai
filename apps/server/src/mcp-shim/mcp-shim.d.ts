/**
 * This file provides a direct type mapping for the MCP SDK.
 * It uses an ambient declaration to force the compiler to associate
 * the '.js' import with the actual types.
 */

declare module "@modelcontextprotocol/sdk/server/mcp.js" {
  // We use a relative path that points to the workspace root's node_modules.
  // In Docker: /app/apps/server/src/types/mcp-shim.d.ts -> /app/node_modules
  // That is 4 levels up: ../../../../node_modules
  export * from "../../../../node_modules/@modelcontextprotocol/sdk/dist/cjs/server/mcp.d.ts";

  // Fallback in case the relative path fails in certain environments
  import { McpServer as McpServerClass } from "@modelcontextprotocol/sdk/dist/cjs/server/mcp";
  export { McpServerClass as McpServer };
}

declare module "@modelcontextprotocol/sdk/server/mcp" {
  export * from "../../../../node_modules/@modelcontextprotocol/sdk/dist/cjs/server/mcp.d.ts";
}
