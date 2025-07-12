import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ExtendedEnv, Props } from "../types";
import { registerDatabaseTools } from "./database-tools";
import { registerMoviesTools } from "./movies-tools";

/**
 * Register all MCP tools based on user permissions
 */
export function registerAllTools(server: McpServer, env: ExtendedEnv, props: Props) {
	// Register database tools
	registerDatabaseTools(server, env, props);
	
	// Future tools can be registered here
	registerMoviesTools(server, env, props);
}