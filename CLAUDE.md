# 인프라 환경

- Proxmox: 10.16.1.51
- Docker VM (docker-development, Debian): 10.16.111.180
- Docker 관리: Dockge (/opt/stacks/)
- 리버스 프록시: Nginx Proxy Manager
- 도메인: lincsolution.net

# MCP 서버 개발 컨벤션

## 기술 스택
- 언어: TypeScript
- 트랜스포트: Streamable HTTP
- 프레임워크: @modelcontextprotocol/sdk

## 인증
- OAuth 2.0 authorization code flow (Claude 웹 custom connector용)
- Bearer Token API key (Claude Code용)
- 엔드포인트:
  - GET /.well-known/oauth-authorization-server - OAuth 디스커버리
  - GET /authorize - 인증 (auto-approve)
  - POST /oauth/token - 토큰 발급 (authorization_code, client_credentials)
- 환경변수: OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET, MCP_API_KEY

## 배포 규칙
- Docker 컨테이너로 배포 (Dockerfile + docker-compose.yml 필수 포함)
- 컨테이너 내부 포트: 3000 고정
- 도메인 패턴: mcp-{서비스명}.lincsolution.net
- Dockge 스택 경로: /opt/stacks/mcp-{서비스명}/

## 호스트 포트 할당
- mcp-glpi: 3100
- mcp-netbox: 3101
- mcp-omada: 3102
- mcp-nginxproxymanager: 3103

## 프로젝트 구조
src/
├── server.ts         # Express + StreamableHTTP + OAuth 2.0
├── index.ts          # Stdio 트랜스포트 진입점
├── npm/
│   └── client.ts     # NPM REST API 클라이언트
├── tools/            # 도구 정의
└── types/            # 타입 정의
Dockerfile (multi-stage build)
docker-compose.yml
.env.example
