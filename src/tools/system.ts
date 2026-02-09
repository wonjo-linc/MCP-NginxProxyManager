import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { NpmClient } from '../npm/client.js';

export function registerSystemTools(server: McpServer, client: NpmClient) {
  server.tool(
    'npm_get_health',
    'Get Nginx Proxy Manager health status and version information.',
    {},
    async () => {
      const result = await client.getHealth();
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    'npm_get_hosts_report',
    'Get hosts statistics report (counts of proxy, redirection, stream, and dead hosts).',
    {},
    async () => {
      const result = await client.getHostsReport();
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    'npm_list_audit_log',
    'List audit log entries showing recent actions performed in Nginx Proxy Manager.',
    {},
    async () => {
      const result = await client.listAuditLog();
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );
}
