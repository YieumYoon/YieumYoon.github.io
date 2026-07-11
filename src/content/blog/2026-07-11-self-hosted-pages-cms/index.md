---
title: "VS Code 없이 글을 쓰고 싶어서 Pages CMS를 직접 호스팅했다"
summary: "Astro 블로그를 브라우저에서 편집하기 위해 Pages CMS를 포크하고, Oracle Cloud와 Tailscale을 이용해 내 기기에서만 접근할 수 있는 개인 CMS를 구축한 과정이다."
date: "2026-07-11"
timezone: "America/New_York"
tags:
  - Pages CMS
  - Astro
  - Tailscale
  - Oracle Cloud
  - GitHub
  - Self-hosting
draft: true
---

Astro와 GitHub Pages로 블로그를 운영하면 글이 Markdown 파일로 남고, 사이트를 원하는 대로 수정할 수 있다는 장점이 있다. 하지만 글 하나를 쓰기 위해 매번 컴퓨터에서 VS Code를 열고 저장소를 확인한 뒤 커밋하고 푸시하는 과정은 생각보다 번거로웠다. 특히 iPad나 다른 컴퓨터에서도 일반 블로그처럼 브라우저를 열어 바로 글을 쓰고 싶었다.

처음에는 Notion 연동부터 생각했지만, 결국 기존 GitHub 저장소를 그대로 원본으로 유지하면서 브라우저 편집 화면만 추가하는 방향을 선택했다. 그 결과 Pages CMS를 직접 포크하고 Oracle Cloud Free Tier 서버에 올린 뒤, Tailscale에 연결된 내 기기에서만 접근할 수 있는 개인 CMS를 만들었다.

## 원했던 것

처음부터 거창한 관리자 시스템이 필요했던 것은 아니었다. 원하는 조건은 비교적 단순했다.

- Markdown과 GitHub 중심의 현재 블로그 구조는 유지할 것
- 컴퓨터뿐 아니라 iPad에서도 브라우저로 글을 쓸 수 있을 것
- 글을 저장하면 기존 GitHub 저장소에 커밋될 것
- CMS 관리 화면은 공개 인터넷에 노출하지 않을 것
- 가능하면 추가 비용 없이 운영할 것
- 다른 개인 서비스도 사용하는 VM이므로 구성을 가볍게 유지할 것

CMS에 별도의 글 원본을 두고 GitHub와 동기화하는 구조는 피하고 싶었다. 글의 원본은 계속 GitHub 저장소 안의 Markdown 파일이고, CMS는 그 파일을 편집하기 위한 화면이어야 했다.

## Pages CMS를 선택한 이유

Pages CMS는 GitHub 저장소의 파일을 직접 읽고 수정하는 Git 기반 CMS다. 블로그 저장소에 `.pages.yml`을 추가하면 어떤 폴더가 글 모음인지, frontmatter에는 어떤 필드가 있는지, 본문 편집기는 어떤 형식인지 정의할 수 있다.

이 방식은 현재 블로그 구조와 잘 맞았다.

1. Astro의 Content Collections를 그대로 사용할 수 있다.
2. CMS에서 저장한 결과가 일반 Markdown 파일과 Git 커밋으로 남는다.
3. VS Code나 GitHub에서 직접 수정한 글도 다시 CMS에서 읽을 수 있다.
4. CMS 서비스가 사라져도 글과 블로그에는 영향이 없다.

Keystatic과 Notion 연동도 후보였지만, 기존 저장소를 크게 바꾸지 않고 빠르게 편집 환경을 붙이는 데에는 Pages CMS가 가장 직접적이었다. 다만 공식 호스팅 서비스를 그대로 쓰기보다, 필요한 기능을 수정하고 접근 범위를 제한하기 위해 직접 호스팅하기로 했다.

## 생각보다 중요했던 글 폴더 구조

내 블로그의 글은 대부분 다음처럼 한 글이 하나의 폴더를 사용하는 구조였다.

```text
src/content/blog/
└── post-slug/
    ├── index.md
    └── images...
```

처음 Pages CMS에 연결했을 때는 글 목록에 폴더와 `index.md`가 따로 표시됐다. CMS 입장에서는 실제로 폴더와 파일이 따로 존재하니 틀린 동작은 아니었지만, 글을 고르는 화면으로는 어색했다.

`.pages.yml`에서 collection이 하위 폴더를 사용한다는 점과 각 폴더의 `index.md`가 실제 글이라는 점을 명시하고, 목록에서는 디렉터리를 감추도록 설정했다. 파일 구조는 그대로 유지하면서 CMS 화면에는 글 단위로 보이게 만든 것이다.

```yaml
content:
  - name: blog
    type: collection
    path: src/content/blog
    subfolders: true
    filename: "{year}-{month}-{day}-{title}/index.md"
    view:
      layout: tree
      node:
        filename: index.md
        hideDirs: nodes
```

이 설정 이후에는 폴더 구조를 의식하지 않고 일반 블로그 관리자 화면처럼 글을 선택할 수 있었다.

## GitHub App 설정에서 만난 문제

Pages CMS는 GitHub App을 통해 저장소에 접근한다. 처음에는 로컬 환경에서 GitHub App manifest를 이용해 설정하려 했는데 몇 가지 오류가 연달아 발생했다.

- manifest에 허용되지 않는 `secret` 항목이 들어감
- webhook 주소가 `localhost`라서 공개 인터넷에서 도달할 수 없음
- 존재하지 않는 기본 권한 항목이 포함됨

manifest 형식을 현재 GitHub 요구사항에 맞게 고치고, 로컬 검증에서는 webhook에 의존하지 않도록 설정 흐름을 수정했다. 이후 운영 주소를 Tailscale HTTPS 주소로 바꾸고 GitHub App의 Homepage, Callback, Setup URL도 같은 주소를 기준으로 등록했다.

여기서 webhook은 끝까지 사용하지 않았다. Tailscale 전용 주소는 공개 인터넷에서 접근할 수 없으므로 GitHub가 webhook을 전달할 수 없기 때문이다. 대신 CMS를 열거나 새로고침할 때 GitHub의 최신 상태를 다시 확인하도록 두었다. 여러 사람이 동시에 편집하는 대형 CMS가 아니라 개인 블로그이므로 이 정도의 차이는 충분히 받아들일 수 있었다.

## 직접 추가한 작은 기능들

실제로 글을 써보니 단순히 Markdown 편집기가 보이는 것만으로는 부족했다. 반복적으로 불편했던 부분을 포크한 Pages CMS에 조금씩 추가했다.

### 발행 시간과 수정 시간을 넣는 버튼

블로그 frontmatter에는 발행 날짜뿐 아니라 선택적으로 시간과 시간대를 기록할 수 있다.

```yaml
date: "2026-07-11"
time: "12:30"
timezone: "America/New_York"
updatedDate: "2026-07-12"
updatedTime: "09:15"
updatedTimezone: "America/New_York"
```

이 값을 글마다 직접 입력하는 것은 번거롭고 오타도 나기 쉽다. 그래서 CMS에 현재 브라우저의 날짜, 시각, IANA 시간대를 읽어 발행 정보나 수정 정보에 채워주는 버튼을 추가했다. 자동으로 항상 값을 바꾸게 하지 않고 버튼 방식으로 만든 이유는, 과거 날짜의 글을 옮기거나 수정 시각을 남기고 싶지 않은 경우도 있기 때문이다.

### GitHub 비공개 이메일 대응

GitHub에서 이메일을 비공개로 설정한 계정도 정상적으로 사용자 정보를 처리하도록 fallback을 보완했다. 실제로 포크에 보안 업데이트를 푸시할 때도 GitHub의 개인 이메일 공개 방지 정책이 커밋을 한 번 거부했다. 이때 GitHub의 `noreply` 주소로 커밋 작성자 정보를 맞춰 해결했다.

### 이미지 저장 위치에 대한 여지

현재는 이미지가 많지 않아 저장소의 `public/images`에 함께 커밋해도 큰 문제가 없다. 하지만 이미지가 늘어나면 Git 저장소가 무거워지고 clone과 배포도 느려질 수 있다.

당장은 구조를 복잡하게 만들지 않고 GitHub에 저장하되, 이미지가 많아지는 시점에 Cloudflare R2로 옮기고 Markdown에는 공개 URL만 기록하기로 했다. `.pages.yml`에도 이 결정을 메모로 남겨 미래의 내가 이유를 다시 추적할 수 있게 했다.

## Docker 대신 직접 실행한 이유

운영 서버는 Oracle Cloud Free Tier의 Ubuntu VM이다. 앞으로 간단한 에이전트나 다른 개인 서비스도 함께 실행할 예정이라 서비스마다 전체 환경을 컨테이너로 묶는 것보다, 우선은 Node.js 애플리케이션과 systemd를 이용한 구성을 선택했다.

최종 구성은 다음과 같다.

```text
Tailscale HTTPS
      │
      ▼
Tailscale Serve
      │
      ▼
Pages CMS (127.0.0.1:3000)
      │
      ├── GitHub App
      └── PostgreSQL 16
```

- Node.js는 `fnm`으로 설치
- CMS 전용 Linux 사용자 생성
- PostgreSQL에 CMS 전용 사용자와 데이터베이스 생성
- 비밀값과 GitHub App private key는 `/etc` 아래 별도 보관
- systemd로 자동 시작과 장애 시 재시작 설정
- 애플리케이션은 `127.0.0.1:3000`에서만 수신

Docker를 쓰지 않았다고 해서 설치 과정이 무조건 단순해지는 것은 아니었다. Node 버전, 파일 권한, 환경 변수, 데이터베이스 마이그레이션과 systemd 실행 경로를 직접 관리해야 했다. 대신 현재 서버에서 어떤 프로세스가 어떤 권한으로 실행되는지 명확하게 파악할 수 있었고, 작은 VM에서 다른 서비스와 함께 운영하기에도 부담이 적었다.

## Tailscale로 관리자 화면 감추기

CMS를 외부에 공개할 필요는 없지만, 집 밖의 iPad나 노트북에서도 접속하고 싶었다. 이 조건에 Tailscale이 잘 맞았다.

Pages CMS는 서버의 localhost에만 열어두고, Tailscale Serve가 tailnet 전용 HTTPS 주소를 localhost로 전달하도록 구성했다.

```text
https://<server-name>.<tailnet>.ts.net
└── proxy http://127.0.0.1:3000
```

이렇게 하면 Oracle Cloud의 방화벽에 CMS 포트를 공개하지 않아도 된다. Tailscale에 로그인된 내 기기만 CMS 주소를 찾고 접속할 수 있으며, HTTPS 인증서도 Tailscale이 처리한다. 실제로 Mac에서 Tailscale을 끈 상태에서는 도메인 조회와 접속이 모두 실패했고, 다시 연결하자 바로 로그인 화면이 열렸다.

SSH는 기존 공개 접속 방식을 유지했다. CMS 웹 화면과 서버 관리 접속은 요구사항이 다르므로, 이번 작업에서는 웹 페이지만 Tailscale로 제한했다.

## 배포 전에 발견한 보안 문제

처음 프로덕션 빌드는 성공했고 서비스도 정상적으로 응답했다. 하지만 마지막 `npm audit`에서 인증 라이브러리를 포함한 치명적·높음 등급 취약점이 발견됐다. 특히 OAuth 상태 검증과 관련된 항목이 있어 로그인 테스트 전에 멈추고 의존성부터 갱신했다.

자동으로 `npm audit fix --force`를 실행하지는 않았다. 강제 수정을 적용하면 `drizzle-kit`이나 Next.js를 호환되지 않는 버전으로 바꾸는 제안이 포함되어 있었기 때문이다. 깨끗한 임시 복제본에서 다음 순서로 확인했다.

1. 직접 사용하는 인증, Next.js, 메일 라이브러리를 수정 버전으로 올림
2. 취약한 하위 의존성을 기존 호환 범위 안에서 갱신
3. 운영 의존성만 다시 감사
4. TypeScript와 프로덕션 빌드 확인
5. 린트 확인
6. 검증된 커밋만 포크와 서버에 배포

그 결과 운영 의존성에서 치명적·높음 등급 경고는 0건이 됐다. 남은 중간 등급 경고는 외부에 열지 않는 개발 서버 도구와 Next.js 내부 CSS 처리 의존성이었고, 자동 수정이 오히려 큰 버전 회귀를 만들기 때문에 유지했다.

## 최종 사용 경험

이제 글을 쓰는 과정은 다음처럼 바뀌었다.

1. Mac이나 iPad에서 Tailscale을 연결한다.
2. 브라우저로 개인 CMS 주소를 연다.
3. GitHub로 로그인한다.
4. 일반 블로그 편집기처럼 글을 작성한다.
5. 저장하면 Markdown 파일이 GitHub에 커밋된다.
6. 기존 Astro 블로그 배포 과정이 그대로 실행된다.

CMS 밖에서 VS Code나 GitHub 웹으로 파일을 수정해도 괜찮다. GitHub 저장소가 계속 유일한 원본이기 때문에 CMS를 다시 열면 외부에서 수정한 내용도 읽을 수 있다. CMS가 고장 나거나 나중에 다른 도구로 교체되더라도 글은 평범한 Markdown 파일로 남는다.

## 알게 된 점

이번 작업에서 가장 크게 느낀 것은, Git 기반 블로그의 불편함을 해결하기 위해 반드시 글 저장 방식을 바꿀 필요는 없다는 점이다. 불편했던 것은 Markdown 자체보다 글을 쓰기 위해 개발 도구를 열어야 하는 인터페이스였다. GitHub를 원본으로 유지하면서 편집 화면만 브라우저로 옮기니 기존 구조의 장점과 일반 블로그의 편리함을 같이 가져갈 수 있었다.

또한 개인 서비스라고 해서 보안을 나중으로 미룰 수는 없었다. 공개 포트를 열지 않는 것, 서비스 전용 사용자를 두는 것, 비밀값을 저장소에서 분리하는 것, 배포 전에 인증 의존성을 확인하는 것처럼 작은 선택이 모여 실제로 안심하고 쓸 수 있는 환경이 됐다.

당분간은 이 구조로 글을 써보면서 편집 경험을 다듬을 생각이다. 이미지가 많아지면 Cloudflare R2를 연결하고, 외부 수정 사항을 더 빠르게 반영할 필요가 생기면 webhook을 받을 수 있는 별도 공개 경로를 제한적으로 추가할 수 있다. 하지만 지금 필요한 기능에는 현재 구성이 가장 단순하고 충분하다.
