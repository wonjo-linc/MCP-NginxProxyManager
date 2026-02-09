import axios, { AxiosInstance } from 'axios';
import {
  HostType,
  NpmHealth,
  CreateProxyHostData,
  CreateCertificateData,
  CreateAccessListData,
} from '../types/npm.js';

export class NpmClient {
  private email: string;
  private password: string;
  private token: string | null = null;
  private tokenExpiry: number = 0;
  private api: AxiosInstance;

  constructor(baseUrl: string, email: string, password: string) {
    this.email = email;
    this.password = password;
    this.api = axios.create({ baseURL: baseUrl.replace(/\/$/, '') });
  }

  private async ensureAuthenticated(): Promise<void> {
    if (this.token && Date.now() < this.tokenExpiry) return;

    const res = await this.api.post<{ token: string; expires: string }>('/api/tokens', {
      identity: this.email,
      secret: this.password,
    });

    this.token = res.data.token;
    this.tokenExpiry = new Date(res.data.expires).getTime() - 60_000;
  }

  private async request<T>(method: string, path: string, data?: unknown): Promise<T> {
    await this.ensureAuthenticated();
    const res = await this.api.request<T>({
      method,
      url: `/api${path}`,
      data,
      headers: { Authorization: `Bearer ${this.token}` },
    });
    return res.data;
  }

  // Health (no auth required)
  async getHealth(): Promise<NpmHealth> {
    const res = await this.api.get<NpmHealth>('/api');
    return res.data;
  }

  // Proxy Hosts
  async listProxyHosts(): Promise<unknown[]> {
    return this.request('GET', '/nginx/proxy-hosts?expand=owner,certificate,access_list');
  }

  async getProxyHost(id: number): Promise<unknown> {
    return this.request('GET', `/nginx/proxy-hosts/${id}?expand=owner,certificate,access_list`);
  }

  async createProxyHost(data: CreateProxyHostData): Promise<unknown> {
    return this.request('POST', '/nginx/proxy-hosts', data);
  }

  async updateProxyHost(id: number, data: Partial<CreateProxyHostData>): Promise<unknown> {
    return this.request('PUT', `/nginx/proxy-hosts/${id}`, data);
  }

  async deleteProxyHost(id: number): Promise<void> {
    await this.request('DELETE', `/nginx/proxy-hosts/${id}`);
  }

  // Generic Hosts (redirection-hosts, dead-hosts, streams)
  async listHosts(type: HostType): Promise<unknown[]> {
    return this.request('GET', `/nginx/${type}?expand=owner,certificate`);
  }

  async getHost(type: HostType, id: number): Promise<unknown> {
    return this.request('GET', `/nginx/${type}/${id}?expand=owner,certificate`);
  }

  async createHost(type: HostType, data: unknown): Promise<unknown> {
    return this.request('POST', `/nginx/${type}`, data);
  }

  async deleteHost(type: HostType, id: number): Promise<void> {
    await this.request('DELETE', `/nginx/${type}/${id}`);
  }

  // Enable/Disable (all host types including proxy-hosts)
  async enableHost(type: HostType, id: number): Promise<void> {
    await this.request('POST', `/nginx/${type}/${id}/enable`);
  }

  async disableHost(type: HostType, id: number): Promise<void> {
    await this.request('POST', `/nginx/${type}/${id}/disable`);
  }

  // Certificates
  async listCertificates(): Promise<unknown[]> {
    return this.request('GET', '/nginx/certificates?expand=owner');
  }

  async createCertificate(data: CreateCertificateData): Promise<unknown> {
    return this.request('POST', '/nginx/certificates', data);
  }

  async deleteCertificate(id: number): Promise<void> {
    await this.request('DELETE', `/nginx/certificates/${id}`);
  }

  async renewCertificate(id: number): Promise<unknown> {
    return this.request('POST', `/nginx/certificates/${id}/renew`);
  }

  // Access Lists
  async listAccessLists(): Promise<unknown[]> {
    return this.request('GET', '/nginx/access-lists?expand=owner,items,clients,proxy_hosts');
  }

  async createAccessList(data: CreateAccessListData): Promise<unknown> {
    return this.request('POST', '/nginx/access-lists', data);
  }

  async deleteAccessList(id: number): Promise<void> {
    await this.request('DELETE', `/nginx/access-lists/${id}`);
  }

  // Reports & Audit
  async getHostsReport(): Promise<unknown> {
    return this.request('GET', '/reports/hosts');
  }

  async listAuditLog(): Promise<unknown[]> {
    return this.request('GET', '/audit-log?expand=user');
  }
}
