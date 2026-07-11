---
title: "Oracle VM에 Pages CMS를 직접 호스팅하는 방법"
summary: "Oracle Cloud Ubuntu VM에 Pages CMS와 PostgreSQL을 Docker 없이 설치하고, systemd와 Tailscale Serve로 내 기기에서만 접근 가능한 Astro 블로그 편집 환경을 구성하는 가이드다."
date: "2026-07-11"
timezone: "America/New_York"
tags:
  - Pages CMS
  - Astro
  - Tailscale
  - Oracle Cloud
  - PostgreSQL
  - systemd
  - GitHub Actions
draft: true
---

이 글은 GitHub 저장소의 Markdown을 원본으로 사용하는 Astro 블로그에 개인용 웹 편집기를 추가하는 과정을 정리한 설치 가이드다. Pages CMS와 PostgreSQL은 Oracle Cloud의 Ubuntu VM에서 직접 실행하고, 관리자 화면은 공개 인터넷이 아니라 Tailscale에 연결된 기기에서만 접근할 수 있게 만든다.

왜 이 구성을 선택했고 어떤 문제를 만났는지는 [VS Code 없이 글을 쓰고 싶어서 Pages CMS를 직접 호스팅했다](/blog/2026-07-11-self-hosted-pages-cms/)에 별도로 정리했다. 여기서는 재현에 필요한 설정과 운영 방법에 집중한다.

> 이 글은 2026년 7월, Ubuntu 24.04 ARM64, Node.js 24, PostgreSQL 16, Pages CMS 2.1.8을 기준으로 작성했다. 설치 시점의 Pages CMS 문서와 보안 업데이트를 다시 확인해야 한다.

## 완성할 구조

```text
Mac / iPad
    │
    │ Tailscale 전용 HTTPS
    ▼
Tailscale Serve
    │
    │ proxy
    ▼
Pages CMS (127.0.0.1:3000)
    │
    ├── GitHub App ── GitHub의 Markdown과 이미지
    └── PostgreSQL ── 로그인, 세션, 권한, 읽기 캐시

GitHub push
    │
    ▼
GitHub Actions ── Astro build ── GitHub Pages
```

여기서 중요한 원칙은 다음과 같다.

- 글의 원본은 PostgreSQL이 아니라 GitHub 저장소다.
- Pages CMS는 편집 화면이며 Astro 배포를 대신하지 않는다.
- Pages CMS와 PostgreSQL은 localhost에서만 수신한다.
- 외부 기기는 Tailscale Serve를 통해서만 CMS에 접근한다.
- Oracle Cloud ingress에 `3000`과 `5432`를 열지 않는다.
- 서비스는 root나 일반 SSH 계정이 아닌 전용 계정으로 실행한다.

## 준비물

- Oracle Cloud Ubuntu VM 한 대
- VM에 접속할 수 있는 SSH 키
- GitHub 계정과 블로그 저장소
- 블로그 저장소에 추가한 `.pages.yml`
- 서버와 편집할 기기에 설치된 Tailscale
- Git, Node.js, PostgreSQL에 대한 기본적인 이해

예제에서는 다음 플레이스홀더를 사용한다.

```text
<cms-url>       Tailscale Serve가 발급한 HTTPS 주소
<blog-repo>     owner/repository 형식의 블로그 저장소
<node-bin>      fnm이 설치한 Node.js bin 디렉터리
<db-password>   Pages CMS 전용 PostgreSQL 비밀번호
```

실제 주소, App ID, 비밀번호, private key는 저장소나 블로그 글에 넣지 않는다.

## 1. 서버 상태부터 확인하기

Oracle Free Tier도 선택한 인스턴스에 따라 CPU와 메모리가 다르다. 패키지를 설치하기 전에 현재 상태와 이미 사용 중인 포트를 확인한다.

```bash
cat /etc/os-release
nproc
free -h
df -h
swapon --show
sudo ss -ltnup
sudo systemctl --failed
```

이 가이드에서는 CMS에 `3000`, PostgreSQL에 `5432`를 사용한다. 이미 다른 서비스가 사용 중이면 CMS 포트를 바꾸고 systemd와 Tailscale 설정에도 같은 값을 사용한다.

기본 패키지를 설치한다.

```bash
sudo apt update
sudo apt install -y git curl build-essential postgresql postgresql-client
```

## 2. 서비스 전용 계정 만들기

Pages CMS를 SSH 사용자나 root로 실행하지 않는다. 로그인할 수 없는 시스템 계정과 전용 디렉터리를 만든다.

```bash
sudo useradd \
  --system \
  --create-home \
  --home-dir /home/pagescms \
  --shell /usr/sbin/nologin \
  pagescms

sudo install -d -o pagescms -g pagescms -m 0750 /opt/pagescms
sudo install -d -o root -g pagescms -m 0750 /etc/pagescms
sudo install -d -o root -g root -m 0755 /usr/local/libexec
```

이후 소스와 `node_modules`는 `/opt/pagescms/app`, 비밀값은 `/etc/pagescms`에 둔다.

## 3. fnm과 Node.js 설치하기

Node.js 버전을 시스템 패키지에 맡기지 않고 `fnm`으로 고정한다. 이미 서버에 `fnm`이 있다면 실행 파일을 공용 경로에 설치하고 서비스 계정으로 Node.js를 설치할 수 있다.

```bash
sudo install -m 0755 "$(command -v fnm)" /usr/local/bin/fnm

sudo -u pagescms env HOME=/home/pagescms \
  /usr/local/bin/fnm install 24.18.0
```

설치 후 Node.js 경로를 확인한다.

```bash
sudo -u pagescms env HOME=/home/pagescms \
  /usr/local/bin/fnm exec --using=24.18.0 -- node --version

sudo -u pagescms env HOME=/home/pagescms \
  /usr/local/bin/fnm exec --using=24.18.0 -- which node
```

두 번째 명령에서 나온 `bin` 디렉터리를 이후 `<node-bin>`으로 사용한다. 예를 들면 다음과 같은 형태다.

```text
/home/pagescms/.local/share/fnm/node-versions/v24.18.0/installation/bin
```

## 4. PostgreSQL 준비하기

Ubuntu 패키지로 설치한 PostgreSQL 서비스를 활성화한다.

```bash
sudo systemctl enable --now postgresql
sudo systemctl status postgresql
```

비밀번호는 영문과 숫자로 구성된 긴 값을 사용하는 편이 `DATABASE_URL`에 넣기 쉽다.

```bash
openssl rand -hex 32
```

출력된 값을 안전한 비밀번호 관리자에 보관한 뒤 PostgreSQL 콘솔에서 전용 role과 database를 만든다.

```bash
sudo -u postgres psql
```

```sql
CREATE ROLE pagescms LOGIN PASSWORD '<db-password>';
CREATE DATABASE pagescms OWNER pagescms;
\q
```

PostgreSQL이 외부 인터페이스에 열리지 않았는지 확인한다.

```bash
sudo -u postgres psql -tAc "SHOW listen_addresses;"
sudo ss -ltnp | grep ':5432'
```

결과가 loopback 주소를 가리켜야 한다. `0.0.0.0:5432`나 `[::]:5432`가 보이면 진행하기 전에 `listen_addresses`와 방화벽 설정을 고친다.

## 5. Pages CMS 소스 설치하기

공식 Pages CMS를 그대로 사용해도 되지만, 이 구성에서는 시간 입력 버튼과 Tailscale용 GitHub App 설정 보완이 들어간 [개인 포크](https://github.com/YieumYoon/pagescms)를 사용했다.

```bash
sudo -u pagescms git clone \
  https://github.com/YieumYoon/pagescms.git \
  /opt/pagescms/app
```

운영에서는 배포할 커밋을 기록해 두고, 업데이트 전에 변경 내용을 검토하는 것이 좋다.

```bash
sudo -u pagescms git -C /opt/pagescms/app rev-parse HEAD
```

의존성을 lockfile 그대로 설치한다. 이 포크의 `package.json`에는 실행을 허용한 install script 목록이 포함되어 있다.

```bash
sudo -u pagescms env \
  HOME=/home/pagescms \
  PATH=<node-bin>:/usr/local/bin:/usr/bin:/bin \
  bash -lc 'cd /opt/pagescms/app && npm ci --ignore-scripts=false'
```

`npm audit fix --force`는 바로 실행하지 않는다. 호환되지 않는 버전으로 내리거나 주요 버전을 바꾸는 제안이 섞일 수 있다. 운영 의존성만 따로 확인하고, 수정 버전을 깨끗한 복제본에서 빌드한 뒤 반영한다.

```bash
npm audit --omit=dev --audit-level=high
```

## 6. 비밀값 분리하기

인증과 암호화에 사용할 값을 각각 생성한다. 같은 값을 여러 용도로 재사용하지 않는다.

```bash
openssl rand -base64 32  # BETTER_AUTH_SECRET
openssl rand -base64 32  # CRYPTO_KEY
openssl rand -base64 32  # GITHUB_APP_WEBHOOK_SECRET
```

`/etc/pagescms/pagescms.env`를 만들고 다음 값을 채운다.

```bash
BASE_URL=https://<cms-url>
BETTER_AUTH_SECRET=<random-base64-value>
CRYPTO_KEY=<another-random-base64-value>

DATABASE_URL=postgresql://pagescms:<db-password>@127.0.0.1:5432/pagescms
POSTGRES_MAX_CONNECTIONS=5

GITHUB_APP_ID=<github-app-id>
GITHUB_APP_NAME=<github-app-slug>
GITHUB_APP_CLIENT_ID=<github-client-id>
GITHUB_APP_CLIENT_SECRET=<github-client-secret>
GITHUB_APP_PRIVATE_KEY_FILE=/etc/pagescms/github-app.pem

# Webhook을 사용하지 않더라도 임의의 별도 값을 둔다.
GITHUB_APP_WEBHOOK_SECRET=<another-random-value>
```

GitHub App private key는 여러 줄 환경 변수로 넣지 않고 별도 PEM 파일로 둔다.

```bash
sudo install -o root -g pagescms -m 0640 \
  github-app.pem \
  /etc/pagescms/github-app.pem

sudo chown root:pagescms /etc/pagescms/pagescms.env
sudo chmod 0640 /etc/pagescms/pagescms.env
```

Git에 포함되지 않았는지 반드시 확인한다.

```bash
git status --short
git grep -n "GITHUB_APP_CLIENT_SECRET\|BEGIN.*PRIVATE KEY" || true
```

## 7. GitHub App 만들기

GitHub App은 CMS 로그인과 저장소 파일 수정에 사용한다. App은 전체 계정이 아니라 블로그 저장소 하나에만 설치하는 편이 좋다.

필요한 repository/account 권한은 다음과 같다.

```text
Contents: Read and write
Metadata: Read-only
Email addresses: Read-only
Events: 없음
```

Tailscale 주소를 기준으로 URL을 등록한다.

```text
Homepage URL: https://<cms-url>
Callback URL: https://<cms-url>/api/auth/callback/github
Setup URL:    https://<cms-url>/
Webhook:      inactive
```

Tailscale 전용 주소는 공개 인터넷에서 접근할 수 없으므로 GitHub webhook 수신 주소로 사용할 수 없다. webhook URL에 localhost나 tailnet 주소를 넣으려 하면 GitHub가 도달할 수 없는 주소라고 거부한다. 개인 블로그라면 webhook을 비활성화하고 Pages CMS의 주기적인 GitHub 확인을 사용하는 편이 단순하다.

포크에 포함된 helper를 이용하면 로컬 브라우저에서 manifest 기반으로 App을 만들 수 있다.

```bash
npm run setup:github-app -- \
  --base-url https://<cms-url> \
  --app-name "Private Pages CMS" \
  --env .env.local
```

생성된 `.env.local`은 비밀 파일이다. 필요한 값만 `/etc/pagescms`로 안전하게 옮기고 저장소에는 커밋하지 않는다. GitHub 설정에 `User-to-server token expiration` 옵션이 보이면 장기 실행 CMS의 로그인 동작을 확인한 뒤 정책을 결정한다.

## 8. 프로덕션 빌드하기

빌드할 때도 운영 URL과 인증 설정이 필요하다. private key 파일을 읽어 현재 셸의 환경 변수로만 전달한다.

```bash
sudo -u pagescms env \
  HOME=/home/pagescms \
  PATH=<node-bin>:/usr/local/bin:/usr/bin:/bin \
  bash -lc '
    set -a
    source /etc/pagescms/pagescms.env
    set +a
    export GITHUB_APP_PRIVATE_KEY=$(<"$GITHUB_APP_PRIVATE_KEY_FILE")
    cd /opt/pagescms/app
    npm run build
  '
```

빌드 결과에서 Next.js 컴파일과 TypeScript 검사가 모두 통과했는지 확인한다.

## 9. 시작 wrapper 만들기

systemd의 `EnvironmentFile`은 multiline PEM을 다루기 불편하다. root가 관리하는 시작 스크립트에서 private key 파일을 읽고, DB migration 후 Next.js를 실행한다.

`/usr/local/libexec/pagescms-start`:

```bash
#!/usr/bin/env bash
set -euo pipefail

: "${GITHUB_APP_PRIVATE_KEY_FILE:?Missing GITHUB_APP_PRIVATE_KEY_FILE}"

export GITHUB_APP_PRIVATE_KEY
GITHUB_APP_PRIVATE_KEY=$(<"$GITHUB_APP_PRIVATE_KEY_FILE")

cd /opt/pagescms/app
./node_modules/.bin/drizzle-kit migrate
exec ./node_modules/.bin/next start --hostname 127.0.0.1 --port 3000
```

실행 권한을 제한한다.

```bash
sudo chown root:root /usr/local/libexec/pagescms-start
sudo chmod 0755 /usr/local/libexec/pagescms-start
```

## 10. systemd 서비스 등록하기

`/etc/systemd/system/pagescms.service`:

```ini
[Unit]
Description=Private Pages CMS
Wants=network-online.target tailscaled.service
After=network-online.target postgresql.service tailscaled.service
Requires=postgresql.service

[Service]
Type=simple
User=pagescms
Group=pagescms
WorkingDirectory=/opt/pagescms/app
EnvironmentFile=/etc/pagescms/pagescms.env
Environment=NODE_ENV=production
Environment=NEXT_TELEMETRY_DISABLED=1
Environment=PATH=<node-bin>:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin
ExecStart=/usr/local/libexec/pagescms-start
Restart=on-failure
RestartSec=5s
TimeoutStartSec=120s
TimeoutStopSec=30s
KillSignal=SIGTERM
UMask=0077

NoNewPrivileges=true
PrivateTmp=true
PrivateDevices=true
ProtectSystem=strict
ProtectHome=read-only
ProtectKernelTunables=true
ProtectKernelModules=true
ProtectKernelLogs=true
ProtectControlGroups=true
RestrictSUIDSGID=true
RestrictRealtime=true
LockPersonality=true
CapabilityBoundingSet=
RestrictAddressFamilies=AF_UNIX AF_INET AF_INET6
SystemCallArchitectures=native
TasksMax=256

[Install]
WantedBy=multi-user.target
```

`<node-bin>`을 실제 경로로 바꾼 뒤 unit을 검증하고 시작한다.

```bash
sudo systemd-analyze verify /etc/systemd/system/pagescms.service
sudo systemctl daemon-reload
sudo systemctl enable --now pagescms
sudo systemctl status pagescms
```

로그와 로컬 API를 확인한다.

```bash
sudo journalctl -u pagescms -n 100 --no-pager
curl --fail http://127.0.0.1:3000/api/app/version
sudo ss -ltnp | grep ':3000'
```

`ss` 결과는 반드시 `127.0.0.1:3000`이어야 한다. `0.0.0.0:3000`이면 외부 인터페이스에도 열려 있다는 뜻이다.

## 11. Tailscale Serve 연결하기

서버와 편집할 Mac, iPad를 같은 tailnet에 연결한다. 설치와 로그인 후 서버 상태를 확인한다.

```bash
sudo tailscale up
tailscale status
```

localhost의 CMS를 tailnet 전용 HTTPS로 연결한다.

```bash
tailscale serve --bg 3000
tailscale serve status
```

상태는 다음과 비슷해야 한다.

```text
https://<cms-url> (tailnet only)
|-- / proxy http://127.0.0.1:3000
```

여기서는 `tailscale funnel`이 아니라 `tailscale serve`를 사용한다. Funnel은 서비스를 공개 인터넷에 노출하므로 개인 CMS의 목적과 맞지 않는다.

Mac이나 iPad에서 Tailscale을 켠 상태로 CMS URL을 열어 GitHub 로그인을 시험한다. Tailscale을 끄면 DNS 조회나 접속이 실패하는 것이 정상이다.

## 12. Astro 블로그 연결하기

블로그 저장소 루트에 `.pages.yml`을 추가한다. 한 글이 폴더 하나와 `index.md`를 사용하는 구조라면 다음 설정이 핵심이다.

```yaml
content:
  - name: blog
    label: Blog
    type: collection
    path: src/content/blog
    subfolders: true
    format: yaml-frontmatter
    filename: "{year}-{month}-{day}-{title}/index.md"
    view:
      layout: tree
      node:
        filename: index.md
        hideDirs: nodes
      fields: [title, date, draft, tags]
      primary: title
```

`node.filename`과 `hideDirs`가 없으면 CMS 목록에서 폴더와 글이 따로 보일 수 있다. 실제 frontmatter schema에 맞춰 `title`, `summary`, `date`, `tags`, `draft`, 본문과 이미지 필드도 정의한다.

CMS에서 테스트 글을 `draft: true`로 저장하고 다음을 확인한다.

1. GitHub에 새 폴더와 `index.md`가 커밋됐는가?
2. Astro Content Collections 검사를 통과하는가?
3. draft 글이 실제 공개 사이트에서는 제외되는가?
4. CMS에서 다시 열었을 때 frontmatter 값이 유지되는가?

## 13. webhook 없는 캐시 이해하기

CMS에서 저장한 글은 CMS가 자신의 캐시를 함께 갱신하므로 바로 보인다. 반면 VS Code, GitHub 웹, 자동화 workflow처럼 CMS 밖에서 만든 커밋은 webhook이 없기 때문에 즉시 목록에 나타나지 않을 수 있다.

기본 흐름은 다음과 같다.

```text
외부 GitHub 커밋
→ Pages CMS의 branch 확인 주기 대기
→ 목록 새로고침
→ 변경된 folder cache 갱신
```

잠시 기다린 후 새로고침하는 것이 첫 번째 방법이다. 캐시가 오래된 상태로 남았다면 서버에서 캐시 테이블만 비울 수 있다.

```bash
sudo -u pagescms env \
  HOME=/home/pagescms \
  PATH=<node-bin>:/usr/local/bin:/usr/bin:/bin \
  bash -lc '
    set -a
    source /etc/pagescms/pagescms.env
    set +a
    cd /opt/pagescms/app
    ./node_modules/.bin/tsx db/scripts/clear-cache.ts
  '
```

이 명령은 GitHub의 글을 삭제하지 않는다. Pages CMS의 config, permission, file read cache를 비우고 다음 요청에서 GitHub를 다시 읽게 한다. 로그인과 세션 데이터도 별도 테이블이므로 유지된다.

## 14. 일반 빌드와 생성 파일 분리하기

블로그에서 이력서 PDF처럼 별도 도구가 필요한 파일을 생성한다면 일반 Astro 빌드에 무조건 묶지 않는 편이 좋다. 처음에는 모든 `npm run build`에서 RenderCV를 실행했는데, GitHub Actions 러너에 `uvx`가 없어 글 배포까지 실패했다.

일반 빌드는 Astro만 담당하게 한다.

```json
{
  "scripts": {
    "build": "astro check && astro build",
    "resume:pdf": "uvx --from 'rendercv[full]==2.8' rendercv render ..."
  }
}
```

이력서 원본 YAML이 바뀔 때만 별도 workflow가 `uv`와 RenderCV를 실행하고 `public/resume.pdf`를 커밋한다. 그 workflow의 완료 이벤트를 일반 Pages 배포가 받아 최신 PDF를 포함한 사이트를 만든다.

```text
일반 글 변경
→ Astro build
→ Pages 배포

이력서 YAML 변경
→ PDF workflow
→ PDF 자동 커밋
→ Astro build
→ Pages 배포
```

이렇게 하면 일반 글 배포가 Python 도구의 설치 상태에 영향을 받지 않는다.

## 15. 업데이트 절차

운영 중인 디렉터리에서 바로 `git pull`부터 실행하지 않는다. 먼저 새 버전의 보안 공지와 포크 patch 충돌을 확인하고 로컬이나 임시 디렉터리에서 빌드한다.

검증할 항목은 다음과 같다.

```bash
npm ci --ignore-scripts=false
npm audit --omit=dev --audit-level=high
npm run lint
npm run build
```

검증된 커밋을 포크에 올린 뒤 서버에서 적용한다.

```bash
sudo systemctl stop pagescms

sudo -u pagescms git -C /opt/pagescms/app pull --ff-only origin main

sudo -u pagescms env \
  HOME=/home/pagescms \
  PATH=<node-bin>:/usr/local/bin:/usr/bin:/bin \
  bash -lc 'cd /opt/pagescms/app && npm ci --ignore-scripts=false'

# 8번의 운영 환경 빌드 명령 실행

sudo systemctl start pagescms
sudo systemctl status pagescms
```

업데이트 후에는 localhost API와 Tailscale HTTPS를 각각 확인한다.

```bash
curl --fail http://127.0.0.1:3000/api/app/version
curl --fail https://<cms-url>/api/app/version
```

## 16. 백업과 복구 범위

블로그 글과 이미지는 GitHub에 있으므로 CMS 서버 디스크만 백업해서는 충분하지 않고, 반대로 GitHub 저장소만 있어도 로그인·세션 상태는 복원되지 않는다.

구분해서 생각하면 단순하다.

| 대상 | 원본 | 백업 방법 |
| --- | --- | --- |
| 글과 저장소 이미지 | GitHub | 별도 clone 또는 GitHub 백업 |
| CMS 환경 변수와 private key | `/etc/pagescms` | 암호화된 별도 보관 |
| 로그인·세션·협업자 상태 | PostgreSQL | `pg_dump` |
| GitHub 읽기 캐시 | PostgreSQL | 필요하면 버리고 재생성 가능 |

PostgreSQL은 custom format으로 백업할 수 있다.

```bash
sudo -u pagescms bash -lc '
  set -a
  source /etc/pagescms/pagescms.env
  set +a
  pg_dump "$DATABASE_URL" \
    --format=custom \
    --file=/var/backups/pagescms/pagescms-$(date -u +%Y%m%dT%H%M%SZ).dump
'
```

백업 디렉터리는 `pagescms`만 읽을 수 있게 `0700`으로 만들고, 서버 장애에도 살아남도록 다른 위치로 복사한다.

## 17. 공개 전 보안 점검

구조와 설정 템플릿은 공개해도 되지만 실제 식별자와 비밀값은 공개하지 않는다.

- Oracle 공인 IP와 SSH 포트
- 실제 tailnet 이름과 CMS URL
- GitHub App ID, Client ID, Installation ID
- Client secret과 private key
- PostgreSQL 비밀번호와 `DATABASE_URL`
- 실제 이메일과 관리자 allowlist
- URL 표시줄이나 저장소 권한이 노출된 스크린샷

서버에서는 마지막으로 다음을 확인한다.

```bash
systemctl is-active pagescms postgresql tailscaled
sudo systemctl --failed
sudo ss -ltnp | grep -E ':3000|:5432'
tailscale serve status
```

CMS와 PostgreSQL이 loopback에서만 수신하고, Tailscale 상태에 `(tailnet only)`가 보이며, 실패한 systemd unit이 없어야 한다.

## 문제 해결표

| 증상 | 확인할 것 | 해결 방향 |
| --- | --- | --- |
| GitHub App manifest가 invalid | 지원하지 않는 key와 permission | `secret`, 잘못된 resource 제거 |
| localhost webhook 오류 | GitHub에서 callback 가능 여부 | webhook 비활성화, OAuth callback만 Tailscale URL 사용 |
| GitHub 로그인 후 되돌아오지 않음 | Callback URL과 `BASE_URL` | 두 값을 동일한 HTTPS origin으로 맞춤 |
| CMS에 외부 커밋이 안 보임 | branch cache의 commit SHA | 확인 주기 대기 또는 cache clear |
| 서비스는 active지만 접속 불가 | localhost와 Serve 상태 | `curl 127.0.0.1`, `tailscale serve status` 순서로 확인 |
| Actions에서 `uvx: not found` | 일반 빌드에 PDF 생성이 묶였는지 | 생성 workflow를 별도로 분리 |
| npm audit fix가 큰 downgrade 제안 | `--force` 적용 여부 | 강제 적용하지 말고 직접 dependency update 후 빌드 |

## 마무리

이 구성은 여러 편집자가 실시간으로 협업하는 CMS보다 한 사람이 여러 기기에서 자신의 Git 기반 블로그를 관리하는 상황에 잘 맞는다. 관리 화면은 비공개로 유지하면서 글은 평범한 Markdown과 Git history로 남고, CMS가 사라져도 블로그를 계속 운영할 수 있다.

운영하면서 가장 중요한 것은 세 가지였다. GitHub를 계속 글의 원본으로 둘 것, 관리자 서비스와 데이터베이스를 공개 포트에 열지 않을 것, 일반 사이트 빌드와 부가적인 생성 작업을 분리할 것이다. 이 원칙만 유지하면 다른 정적 사이트 생성기나 Git 기반 CMS에도 같은 구조를 적용할 수 있다.
