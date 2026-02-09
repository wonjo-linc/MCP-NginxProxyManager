import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { NpmClient } from '../npm/client.js';

export function registerAccessListTools(server: McpServer, client: NpmClient) {
  server.tool(
    'npm_list_access_lists',
    'List all access control lists.',
    {},
    async () => {
      const result = await client.listAccessLists();
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    'npm_create_access_list',
    'Create a new access control list with optional username/password items and IP-based client rules.',
    {
      name: z.string().describe('Access list name'),
      satisfy_any: z
        .boolean()
        .optional()
        .describe('Allow access if ANY rule matches (default: all must match)'),
      pass_auth: z
        .boolean()
        .optional()
        .describe('Pass basic auth to upstream server'),
      items: z
        .array(
          z.object({
            username: z.string().describe('Username'),
            password: z.string().describe('Password'),
          }),
        )
        .optional()
        .describe('Username/password credentials'),
      clients: z
        .array(
          z.object({
            address: z.string().describe('IP address or CIDR'),
            directive: z.enum(['allow', 'deny']).describe('Allow or deny'),
          }),
        )
        .optional()
        .describe('IP-based access rules'),
    },
    async (params) => {
      const result = await client.createAccessList(params);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    'npm_delete_access_list',
    'Delete an access control list.',
    {
      id: z.number().describe('Access list ID to delete'),
    },
    async ({ id }) => {
      await client.deleteAccessList(id);
      return {
        content: [{ type: 'text' as const, text: `Access list ${id} deleted successfully.` }],
      };
    },
  );
}
