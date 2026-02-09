import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { NpmClient } from './npm/client.js';
import { registerProxyHostTools } from './tools/proxy-hosts.js';
import { registerHostTools } from './tools/hosts.js';
import { registerCertificateTools } from './tools/certificates.js';
import { registerAccessListTools } from './tools/access-lists.js';
import { registerSystemTools } from './tools/system.js';

const NPM_URL = process.env.NPM_URL || 'http://localhost:81';
const NPM_EMAIL = process.env.NPM_EMAIL || 'admin@example.com';
const NPM_PASSWORD = process.env.NPM_PASSWORD || '';
const PORT = parseInt(process.env.PORT || '3000', 10);
const MCP_API_KEY = process.env.MCP_API_KEY || '';
const OAUTH_CLIENT_ID = process.env.OAUTH_CLIENT_ID || '';
const OAUTH_CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET || '';

const app = express();
app.use(cors());
app.use(express.json());

// --- OAuth 2.0 ---
const authCodes = new Map<string, { clientId: string; redirectUri: string; expiresAt: number }>();
const activeTokens = new Map<string, { expiresAt: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of authCodes) if (v.expiresAt < now) authCodes.delete(k);
  for (const [k, v] of activeTokens) if (v.expiresAt < now) activeTokens.delete(k);
}, 60_000);

app.get('/.well-known/oauth-authorization-server', (_req, res) => {
  const base = `${_req.protocol}://${_req.get('host')}`;
  res.json({
    issuer: base,
    authorization_endpoint: `${base}/authorize`,
    token_endpoint: `${base}/oauth/token`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'client_credentials'],
    token_endpoint_auth_methods_supported: ['client_secret_post'],
    code_challenge_methods_supported: ['S256'],
  });
});

app.get('/authorize', (req, res) => {
  const { client_id, redirect_uri, state } = req.query as Record<string, string>;
  if (client_id !== OAUTH_CLIENT_ID) {
    res.status(400).json({ error: 'invalid_client' });
    return;
  }
  const code = crypto.randomUUID();
  authCodes.set(code, {
    clientId: client_id,
    redirectUri: redirect_uri,
    expiresAt: Date.now() + 5 * 60 * 1000,
  });
  const url = new URL(redirect_uri);
  url.searchParams.set('code', code);
  if (state) url.searchParams.set('state', state);
  res.redirect(url.toString());
});

app.post('/oauth/token', (req, res) => {
  const { grant_type, code, client_id, client_secret, redirect_uri } = req.body;

  if (grant_type === 'authorization_code') {
    const stored = authCodes.get(code);
    if (!stored || stored.clientId !== client_id || stored.redirectUri !== redirect_uri) {
      res.status(400).json({ error: 'invalid_grant' });
      return;
    }
    authCodes.delete(code);
    if (client_secret !== OAUTH_CLIENT_SECRET) {
      res.status(401).json({ error: 'invalid_client' });
      return;
    }
    const token = crypto.randomUUID();
    activeTokens.set(token, { expiresAt: Date.now() + 3600 * 1000 });
    res.json({ access_token: token, token_type: 'Bearer', expires_in: 3600 });
    return;
  }

  if (grant_type === 'client_credentials') {
    if (client_id !== OAUTH_CLIENT_ID || client_secret !== OAUTH_CLIENT_SECRET) {
      res.status(401).json({ error: 'invalid_client' });
      return;
    }
    const token = crypto.randomUUID();
    activeTokens.set(token, { expiresAt: Date.now() + 3600 * 1000 });
    res.json({ access_token: token, token_type: 'Bearer', expires_in: 3600 });
    return;
  }

  res.status(400).json({ error: 'unsupported_grant_type' });
});

// --- Auth middleware ---
function authenticate(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): void {
  if (!MCP_API_KEY && !OAUTH_CLIENT_ID) {
    next();
    return;
  }
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'missing_token' });
    return;
  }
  const token = auth.slice(7);
  if (MCP_API_KEY && token === MCP_API_KEY) {
    next();
    return;
  }
  const stored = activeTokens.get(token);
  if (stored && stored.expiresAt > Date.now()) {
    next();
    return;
  }
  res.status(401).json({ error: 'invalid_token' });
}

// --- MCP sessions ---
const sessions = new Map<string, StreamableHTTPServerTransport>();

function createMcpServer(): McpServer {
  const npmClient = new NpmClient(NPM_URL, NPM_EMAIL, NPM_PASSWORD);
  const mcpServer = new McpServer({ name: 'mcp-nginxproxymanager', version: '1.0.0' });

  registerProxyHostTools(mcpServer, npmClient);
  registerHostTools(mcpServer, npmClient);
  registerCertificateTools(mcpServer, npmClient);
  registerAccessListTools(mcpServer, npmClient);
  registerSystemTools(mcpServer, npmClient);

  return mcpServer;
}

app.all('/mcp', authenticate, async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;

  if (req.method === 'GET' || (req.method === 'POST' && sessionId && sessions.has(sessionId))) {
    const transport = sessions.get(sessionId!);
    if (transport) {
      await transport.handleRequest(req, res, req.body);
      return;
    }
    if (req.method === 'GET') {
      res.status(400).json({ error: 'Session not found' });
      return;
    }
  }

  if (req.method === 'POST') {
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: () => crypto.randomUUID() });
    const mcpServer = createMcpServer();

    transport.onclose = () => {
      const sid = (transport as unknown as { sessionId: string }).sessionId;
      sessions.delete(sid);
    };

    await mcpServer.connect(transport);
    await transport.handleRequest(req, res, req.body);

    const sid = res.getHeader('mcp-session-id') as string;
    if (sid) sessions.set(sid, transport);
    return;
  }

  if (req.method === 'DELETE' && sessionId) {
    const transport = sessions.get(sessionId);
    if (transport) {
      await transport.close();
      sessions.delete(sessionId);
    }
    res.status(200).end();
    return;
  }

  res.status(405).end();
});

// --- Health check ---
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', sessions: sessions.size });
});

app.listen(PORT, () => {
  console.log(`MCP-NginxProxyManager server running on port ${PORT}`);
});
