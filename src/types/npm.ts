export type HostType = 'proxy-hosts' | 'redirection-hosts' | 'dead-hosts' | 'streams';

export interface NpmHealth {
  status: string;
  setup: boolean;
  version: {
    major: number;
    minor: number;
    revision: number;
  };
}

export interface CreateProxyHostData {
  domain_names: string[];
  forward_scheme: 'http' | 'https';
  forward_host: string;
  forward_port: number;
  certificate_id?: number;
  ssl_forced?: boolean;
  hsts_enabled?: boolean;
  hsts_subdomains?: boolean;
  http2_support?: boolean;
  block_exploits?: boolean;
  caching_enabled?: boolean;
  allow_websocket_upgrade?: boolean;
  access_list_id?: number;
  advanced_config?: string;
  meta?: Record<string, unknown>;
  locations?: unknown[];
}

export interface CreateRedirectionHostData {
  domain_names: string[];
  forward_http_code: number;
  forward_scheme: 'auto' | 'http' | 'https';
  forward_domain_name: string;
  preserve_path?: boolean;
  certificate_id?: number;
  ssl_forced?: boolean;
  hsts_enabled?: boolean;
  hsts_subdomains?: boolean;
  http2_support?: boolean;
  block_exploits?: boolean;
  advanced_config?: string;
  meta?: Record<string, unknown>;
}

export interface CreateDeadHostData {
  domain_names: string[];
  certificate_id?: number;
  ssl_forced?: boolean;
  hsts_enabled?: boolean;
  hsts_subdomains?: boolean;
  http2_support?: boolean;
  advanced_config?: string;
  meta?: Record<string, unknown>;
}

export interface CreateStreamData {
  incoming_port: number;
  forwarding_host: string;
  forwarding_port: number;
  tcp_forwarding?: boolean;
  udp_forwarding?: boolean;
  meta?: Record<string, unknown>;
}

export interface CreateCertificateData {
  provider: 'letsencrypt' | 'other';
  nice_name: string;
  domain_names: string[];
  meta?: {
    letsencrypt_email?: string;
    letsencrypt_agree?: boolean;
    dns_challenge?: boolean;
    dns_provider?: string;
    dns_provider_credentials?: string;
  };
}

export interface CreateAccessListData {
  name: string;
  satisfy_any?: boolean;
  pass_auth?: boolean;
  items?: Array<{ username: string; password: string }>;
  clients?: Array<{ address: string; directive: 'allow' | 'deny' }>;
}
