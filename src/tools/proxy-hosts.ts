import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { NpmClient } from '../npm/client.js';

export function registerProxyHostTools(server: McpServer, client: NpmClient) {
  server.tool(
    'npm_list_proxy_hosts',
    'List all proxy hosts configured in Nginx Proxy Manager.',
    {},
    async () => {
      const result = await client.listProxyHosts();
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    'npm_get_proxy_host',
    'Get detailed information about a specific proxy host.',
    {
      id: z.number().describe('Proxy host ID'),
    },
    async ({ id }) => {
      const result = await client.getProxyHost(id);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    'npm_create_proxy_host',
    'Create a new proxy host. Required: domain_names, forward_scheme, forward_host, forward_port.',
    {
      domain_names: z.array(z.string()).describe('Domain names (e.g. ["app.example.com"])'),
      forward_scheme: z.enum(['http', 'https']).describe('Forward scheme'),
      forward_host: z.string().describe('Forward host (IP or hostname)'),
      forward_port: z.number().describe('Forward port'),
      certificate_id: z.number().optional().describe('SSL certificate ID (0 for none)'),
      ssl_forced: z.boolean().optional().describe('Force SSL'),
      hsts_enabled: z.boolean().optional().describe('Enable HSTS'),
      http2_support: z.boolean().optional().describe('Enable HTTP/2'),
      block_exploits: z.boolean().optional().describe('Block common exploits'),
      caching_enabled: z.boolean().optional().describe('Enable caching'),
      allow_websocket_upgrade: z.boolean().optional().describe('Allow WebSocket upgrade'),
      access_list_id: z.number().optional().describe('Access list ID (0 for none)'),
      advanced_config: z.string().optional().describe('Custom Nginx configuration'),
    },
    async (params) => {
      const result = await client.createProxyHost(params);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    'npm_update_proxy_host',
    'Update an existing proxy host.',
    {
      id: z.number().describe('Proxy host ID'),
      domain_names: z.array(z.string()).optional().describe('Domain names'),
      forward_scheme: z.enum(['http', 'https']).optional().describe('Forward scheme'),
      forward_host: z.string().optional().describe('Forward host'),
      forward_port: z.number().optional().describe('Forward port'),
      certificate_id: z.number().optional().describe('SSL certificate ID'),
      ssl_forced: z.boolean().optional().describe('Force SSL'),
      hsts_enabled: z.boolean().optional().describe('Enable HSTS'),
      http2_support: z.boolean().optional().describe('Enable HTTP/2'),
      block_exploits: z.boolean().optional().describe('Block common exploits'),
      caching_enabled: z.boolean().optional().describe('Enable caching'),
      allow_websocket_upgrade: z.boolean().optional().describe('Allow WebSocket upgrade'),
      access_list_id: z.number().optional().describe('Access list ID'),
      advanced_config: z.string().optional().describe('Custom Nginx configuration'),
    },
    async ({ id, ...data }) => {
      const result = await client.updateProxyHost(id, data);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    'npm_delete_proxy_host',
    'Delete a proxy host.',
    {
      id: z.number().describe('Proxy host ID to delete'),
    },
    async ({ id }) => {
      await client.deleteProxyHost(id);
      return {
        content: [{ type: 'text' as const, text: `Proxy host ${id} deleted successfully.` }],
      };
    },
  );
}
