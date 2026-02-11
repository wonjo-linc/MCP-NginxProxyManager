import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { NpmClient } from '../npm/client.js';
import { HostType } from '../types/npm.js';

const hostTypeEnum = z
  .enum(['redirection-hosts', 'dead-hosts', 'streams'])
  .describe('Host type: redirection-hosts, dead-hosts, or streams');

const allHostTypeEnum = z
  .enum(['proxy-hosts', 'redirection-hosts', 'dead-hosts', 'streams'])
  .describe('Host type (all types including proxy-hosts)');

export function registerHostTools(server: McpServer, client: NpmClient) {
  server.tool(
    'npm_list_hosts',
    'List hosts by type (redirection-hosts, dead-hosts, or streams).',
    {
      type: hostTypeEnum,
    },
    { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
    async ({ type }) => {
      const result = await client.listHosts(type as HostType);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    'npm_get_host',
    'Get detailed information about a specific host (redirection, dead, or stream).',
    {
      type: hostTypeEnum,
      id: z.number().describe('Host ID'),
    },
    { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
    async ({ type, id }) => {
      const result = await client.getHost(type as HostType, id);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    'npm_create_host',
    'Create a new host (redirection, dead, or stream). Fields vary by type:\n' +
      '- redirection-hosts: domain_names, forward_http_code, forward_scheme, forward_domain_name\n' +
      '- dead-hosts: domain_names\n' +
      '- streams: incoming_port, forwarding_host, forwarding_port',
    {
      type: hostTypeEnum,
      data: z
        .record(z.unknown())
        .describe('Host creation data (fields depend on type)'),
    },
    { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
    async ({ type, data }) => {
      const result = await client.createHost(type as HostType, data);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    'npm_delete_host',
    'Delete a host (redirection, dead, or stream).',
    {
      type: hostTypeEnum,
      id: z.number().describe('Host ID to delete'),
    },
    { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: true },
    async ({ type, id }) => {
      await client.deleteHost(type as HostType, id);
      return {
        content: [
          { type: 'text' as const, text: `${type} host ${id} deleted successfully.` },
        ],
      };
    },
  );

  server.tool(
    'npm_host_action',
    'Enable or disable a host (any type including proxy-hosts).',
    {
      type: allHostTypeEnum,
      id: z.number().describe('Host ID'),
      action: z.enum(['enable', 'disable']).describe('Action to perform'),
    },
    { readOnlyHint: false, destructiveHint: true, openWorldHint: true },
    async ({ type, id, action }) => {
      if (action === 'enable') {
        await client.enableHost(type as HostType, id);
      } else {
        await client.disableHost(type as HostType, id);
      }
      return {
        content: [
          {
            type: 'text' as const,
            text: `${type} host ${id} ${action}d successfully.`,
          },
        ],
      };
    },
  );
}
