# MCP-NginxProxyManager

Nginx Proxy Manager용 MCP (Model Context Protocol) 서버.

20개 도구로 NPM 리버스 프록시를 관리합니다.

## 도구 목록

| 도구 | 설명 |
|------|------|
| `npm_list_proxy_hosts` | 프록시 호스트 목록 |
| `npm_get_proxy_host` | 프록시 호스트 상세 |
| `npm_create_proxy_host` | 프록시 호스트 생성 |
| `npm_update_proxy_host` | 프록시 호스트 수정 |
| `npm_delete_proxy_host` | 프록시 호스트 삭제 |
| `npm_list_hosts` | 호스트 목록 (redirection/dead/stream) |
| `npm_get_host` | 호스트 상세 |
| `npm_create_host` | 호스트 생성 |
| `npm_delete_host` | 호스트 삭제 |
| `npm_host_action` | 호스트 활성화/비활성화 |
| `npm_list_certificates` | SSL 인증서 목록 |
| `npm_create_certificate` | SSL 인증서 생성 |
| `npm_delete_certificate` | SSL 인증서 삭제 |
| `npm_renew_certificate` | SSL 인증서 갱신 |
| `npm_list_access_lists` | 접근 제어 목록 |
| `npm_create_access_list` | 접근 제어 생성 |
| `npm_delete_access_list` | 접근 제어 삭제 |
| `npm_get_health` | 헬스 체크 + 버전 |
| `npm_get_hosts_report` | 호스트 통계 |
| `npm_list_audit_log` | 감사 로그 |

## 사전 요구사항

NPM 관리자 계정 (이메일/비밀번호)이 필요합니다.

## 배포 (Dockge)

```yaml
services:
  mcp-nginxproxymanager:
    image: ghcr.io/wonjo-linc/mcp-nginxproxymanager:latest
    container_name: mcp-nginxproxymanager
    restart: unless-stopped
    ports:
      - "3103:3000"
    environment:
      - NPM_URL=http://10.16.111.180:81
      - NPM_EMAIL=admin@example.com
      - NPM_PASSWORD=your_password
      - MCP_API_KEY=your_api_key
      - OAUTH_CLIENT_ID=your_oauth_client_id
      - OAUTH_CLIENT_SECRET=your_oauth_client_secret
      - PORT=3000
```
