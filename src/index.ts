import 'dotenv/config';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { NpmClient } from './npm/client.js';
import { registerProxyHostTools } from './tools/proxy-hosts.js';
import { registerHostTools } from './tools/hosts.js';
import { registerCertificateTools } from './tools/certificates.js';
import { registerAccessListTools } from './tools/access-lists.js';
import { registerSystemTools } from './tools/system.js';

const NPM_URL = process.env.NPM_URL || 'http://localhost:81';
const NPM_EMAIL = process.env.NPM_EMAIL || 'admin@example.com';
const NPM_PASSWORD = process.env.NPM_PASSWORD || '';

const npmClient = new NpmClient(NPM_URL, NPM_EMAIL, NPM_PASSWORD);
const server = new McpServer({ name: 'mcp-nginxproxymanager', version: '1.0.0' });

registerProxyHostTools(server, npmClient);
registerHostTools(server, npmClient);
registerCertificateTools(server, npmClient);
registerAccessListTools(server, npmClient);
registerSystemTools(server, npmClient);

const transport = new StdioServerTransport();
await server.connect(transport);
