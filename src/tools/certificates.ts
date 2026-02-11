import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { NpmClient } from '../npm/client.js';

export function registerCertificateTools(server: McpServer, client: NpmClient) {
  server.tool(
    'npm_list_certificates',
    'List all SSL certificates managed by Nginx Proxy Manager.',
    {},
    { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
    async () => {
      const result = await client.listCertificates();
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    'npm_create_certificate',
    "Request a new Let's Encrypt SSL certificate or add a custom certificate.",
    {
      provider: z.enum(['letsencrypt', 'other']).describe('Certificate provider'),
      nice_name: z.string().describe('Friendly name for the certificate'),
      domain_names: z.array(z.string()).describe('Domain names to include'),
      letsencrypt_email: z
        .string()
        .optional()
        .describe("Email for Let's Encrypt notifications"),
      letsencrypt_agree: z
        .boolean()
        .optional()
        .describe("Agree to Let's Encrypt ToS (required for letsencrypt)"),
      dns_challenge: z.boolean().optional().describe('Use DNS challenge instead of HTTP'),
      dns_provider: z.string().optional().describe('DNS provider (if dns_challenge is true)'),
      dns_provider_credentials: z
        .string()
        .optional()
        .describe('DNS provider credentials'),
    },
    { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
    async ({ provider, nice_name, domain_names, ...meta }) => {
      const result = await client.createCertificate({
        provider,
        nice_name,
        domain_names,
        meta: Object.keys(meta).length > 0 ? meta : undefined,
      });
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    'npm_delete_certificate',
    'Delete an SSL certificate.',
    {
      id: z.number().describe('Certificate ID to delete'),
    },
    { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: true },
    async ({ id }) => {
      await client.deleteCertificate(id);
      return {
        content: [{ type: 'text' as const, text: `Certificate ${id} deleted successfully.` }],
      };
    },
  );

  server.tool(
    'npm_renew_certificate',
    "Renew a Let's Encrypt SSL certificate.",
    {
      id: z.number().describe('Certificate ID to renew'),
    },
    { readOnlyHint: false, destructiveHint: true, openWorldHint: true },
    async ({ id }) => {
      const result = await client.renewCertificate(id);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );
}
