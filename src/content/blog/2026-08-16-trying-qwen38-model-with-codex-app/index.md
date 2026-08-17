---
title: " 나도한다. 코덱스에서 공짜 opus 4.6 사용하기. Qwen3.8 27B + opencodex + codex app"
slug: trying-qwen38-model-with-codex-app
summary: Qwen 3.8 27B 모델을 리눅스 환경에서 돌리고 opencodex와 codex app을 활용해서 Mac 기기에서 사용할수
  있게 세팅하고 사용해봤어요. compute use도 되네요.
date: 2026-08-16
tags:
  - Qwen
  - Local LLM
  - RTX5090
  - OpenCodex
  - Codex
  - Mac
draft: true
time: 21:04
timezone: America/New_York
---
## 0. 계기

qwen 3.8 27b 모델이 화제인데요. 성능이 너무 좋다길래 저도 사용해보고 싶더라고요. Tool use도 되고요. 마침 또 제가 가지고 있는 컴퓨터도 그동안은 lsaac sim, isaac lab 재대로 공부해봐야지 하고서는 어느정도는 놀고 있었고요. 



그러다가 이 글을 보게 되었지 뭐에요. 

![claudebum's Thread · Threads.png](/images/blog/claudebums-thread-threads.webp)

어? 좋은데 나도 해봐야겠다 하고 해봤습니다. codex 앱 잘 사용되고 좋던데요. compute use까지도 되고요. 크롬도 잘 사용하더라고요.



실제



## 최종 구성

만든 구조는 생각보다 단순하

```text

Mac의 Codex

→ OpenCodex

→ Tailscale

→ RTX 5090 서버의 vLLM

→ Qwen3.8-27B

```

RTX 5090이 달린 Linux 컴퓨터에서는 모델만 실행하고, 실제 작업은 평소 사용하던 Mac에서 한다.

모델은 Qwen3.8-27B NVFP4를 사용했고, KV 캐시는 FP8, 컨텍스트는 최종적으로 128K로 설정했다.

Mac에서는 OpenCodex를 이용해 기존 Codex 인터페이스에 모델을 연결했다. 최종적으로 보이는 모델 이름은 다음과 같다.

```text

rtx5090/qwen3.8-27b-nvfp4-fp8kv-128k

```

앞의 `rtx5090`은 OpenCodex provider 이름이고, 뒤는 vLLM에서 제공하는 모델 이름이다.

## 설치는 대부분 Codex에게 맡겼다

설치 과정을 하나하나 직접 명령어로 정리하지는 않으려고 한다.

RTX 5090, CUDA, Python, vLLM 버전 조합에 따라 설치 과정이 달라질 수 있고, Qwen처럼 비교적 새로운 모델은 vLLM 정식 버전보다 개발 버전이 필요한 경우도 있기 때문이다. 지금 잘 동작하는 명령이 몇 달 뒤에도 그대로 통한다는 보장은 없다.

나는 Codex에게 다음과 같은 식으로 요청했다.

> 현재 GPU와 CUDA 환경을 확인하고, Qwen3.8-27B NVFP4를 vLLM으로 실행할 수 있게 별도 가상환경을 만들어줘. 기존 ComfyUI 환경은 건드리지 말고, Tailscale IP에서만 접근할 수 있게 구성해줘.

이후에도 오류가 생길 때마다 로그를 보여주고 원인을 확인했다.

개인적으로는 이 방식이 더 편했다. 다만 AI가 제시한 명령을 전부 그대로 실행하기보다는 어떤 파일을 바꾸는지, 기존 ComfyUI 환경에 영향을 주지는 않는지 정도는 확인하는 것이 좋다.

OpenCodex는 설치 전에 [provider 설정 페이지]([https://opencodex.me/reference/configuration/providers/)를](https://opencodex.me/reference/configuration/providers/)를) 한 번 읽어보는 것을 추천한다. 특히 provider 이름과 모델 ID의 차이, 사설 네트워크 허용, 모델 카탈로그 동기화 정도는 알고 시작하는 편이 덜 헷갈린다.

Codex 자체의 모델 카탈로그와 컨텍스트 설정 구조가 궁금하다면 [공식 OpenAI Docs의 설정 레퍼런스]([https://learn.chatgpt.com/docs/config-file/config-reference)도](https://learn.chatgpt.com/docs/config-file/config-reference)도) 참고할 만하다.

## 생각보다 모델을 띄우는 것보다 연결하는 과정이 복잡했다

처음에는 vLLM으로 모델을 실행하고 Mac에서 주소만 넣으면 끝날 줄 알았다.

실제로는 모델 서버보다 OpenCodex와 Codex를 연결하는 과정에서 자잘한 문제가 더 많이 생겼다.

### Tailscale 주소가 거부됐다

OpenCodex에 Tailscale IP를 넣었더니 사설 네트워크 주소라서 거부됐다.

```text

baseUrl points to a private-network address

```

Tailscale 연결이 잘못된 것은 아니었다. OpenCodex가 보안상 사설 주소를 기본적으로 허용하지 않는 것이었다.

내 경우에는 의도적으로 개인 Tailnet의 서버에 연결하는 것이므로 `allowPrivateNetwork` 옵션을 활성화했다.

### OpenCodex 서비스가 실행되지 않았다

provider 등록은 됐는데 proxy 서비스가 계속 실행되지 않았다.

로그를 확인해보니 원인은 의외로 단순했다.

```text

EACCES: permission denied

open '~/.codex/config.toml'

```

Codex의 `config.toml` 파일이 내 계정이 아니라 `root` 소유로 만들어져 있었다. 이전에 관련 명령을 `sudo`로 실행하면서 생긴 문제로 보인다.

파일 소유권을 사용자 계정으로 돌린 뒤 OpenCodex 서비스를 복구하니 정상적으로 실행됐다.

이후부터는 Codex나 OpenCodex 명령에 습관적으로 `sudo`를 붙이지 않게 됐다.

### provider 이름과 모델 이름도 처음에는 헷갈렸다

처음에는 `qwen5090`이라는 provider 이름을 사용했다가 나중에 `rtx5090`으로 바꿨다.

여기서 provider 이름과 실제 모델 이름이 별개라는 것을 알게 됐다.

```text

rtx5090/qwen3.8-27b-nvfp4-fp8kv-128k

```

- `rtx5090`: 어느 서버로 요청을 보낼 것인가

- `qwen3.8-27b-nvfp4-fp8kv-128k`: 해당 서버의 어떤 모델을 사용할 것인가

provider 설정을 바꾼 뒤에는 OpenCodex 서비스를 다시 불러오고 Codex 모델 카탈로그도 동기화해야 했다. 실행 중이던 Codex 앱이 이전 모델 목록을 계속 들고 있는 경우에는 앱 재시작도 필요했다.

## 64K면 충분할 줄 알았다

처음에는 컨텍스트를 64K로 설정했다.

개인적인 코딩 작업이라면 이 정도면 충분하지 않을까 생각했다. 실제로 짧은 대화나 간단한 파일 작업에서는 문제가 없었다.

그런데 Codex 세션이 길어지면 가끔 요청이 실패했다.

당시 서버 로그를 보니 KV 캐시가 약 62K까지 사용되고 있었다. 거의 64K 한계에 도달한 상태였다.

Codex에서는 사용자가 입력한 대화만 컨텍스트에 들어가는 것이 아니다.

시스템 지침, 대화 기록, 읽은 파일, 셸 출력, 도구 호출 결과, reasoning과 최종 답변이 모두 같은 컨텍스트를 사용한다. 그래서 생각보다 빠르게 64K에 가까워졌다.

결국 128K로 올려보기로 했다.

## 128K도 바로 되지는 않았다

처음에는 GPU 메모리 사용 비율을 `0.92`로 설정했다.

그런데 128K 서버를 시작하자 KV 캐시 공간이 부족하다는 오류가 발생했다. 당시 vLLM 계산으로는 설정 가능한 컨텍스트가 약 102K 정도였다.

GPU 메모리 사용 비율을 `0.95`로 높이고 동시 요청을 1개로 제한하자 128K로 정상 실행됐다.

현재 핵심 설정은 다음과 같다.

```text

모델: Qwen3.8-27B NVFP4

KV 캐시: FP8

컨텍스트: 131,072 tokens

GPU 메모리 비율: 0.95

동시 요청: 1

MTP speculative tokens: 3

```

모델이 올라온 상태에서는 VRAM을 약 31.5GB 사용하고 1GB 정도가 남는다. 여유가 많은 편은 아니지만, 이 컴퓨터에서는 모델 서버와 ComfyUI를 동시에 사용하지 않으므로 괜찮다고 판단했다.

Qwen을 사용할 때는 모델 서버만 실행하고, 이미지 생성이 필요하면 Qwen 서버를 종료한 뒤 ComfyUI를 실행한다.

## 128K로 바꾼 뒤에는 실패가 사라졌다

재미있는 점은 128K로 올린 뒤 64K에서 발생하던 실패가 아직 한 번도 나타나지 않았다는 것이다.

별도의 최대 출력 토큰 설정도 하지 않았다.

이 결과를 보면 기존 실패는 출력 한도 문제가 아니라 전체 컨텍스트가 64K에 가까워졌기 때문에 발생했을 가능성이 높다.

현재는 컨텍스트 크기만 128K로 등록하고 출력 한도는 별도로 고정하지 않았다. `xhigh` reasoning을 사용할 때 출력 한도를 너무 낮게 잡으면 reasoning이 중간에 잘릴 수도 있기 때문이다.

일단 지금 상태로 사용하면서 다음 문제가 나타나는지만 지켜볼 생각이다.

- 컨텍스트 초과 오류

- 답변이 중간에 끊기는 현상

- reasoning이나 도구 호출이 갑자기 종료되는 현상

문제가 생긴다면 그때 입력과 출력 예산을 나눠 설정하면 된다.

## 실제로 사용해보니

OpenCodex를 사용한다고 Qwen이 OpenAI의 Codex 전용 모델과 같아지는 것은 아니다.

Codex의 파일 접근, 셸 실행, 도구 호출 같은 하네스를 그대로 사용할 수 있을 뿐, 실제 판단력과 코딩 능력은 연결한 모델에 따라 달라진다.

그래도 단순한 채팅 UI가 아니라 내가 사용하던 Codex 환경에서 로컬 모델을 선택할 수 있다는 점은 꽤 괜찮다.

현재는 Mac에서 다음 모델을 선택하면 추론만 RTX 5090 서버에서 처리된다.

```text

rtx5090/qwen3.8-27b-nvfp4-fp8kv-128k

```

처음 생각했던 것보다 설정할 것이 조금 많았고 중간에 권한 문제나 컨텍스트 문제도 있었다. 하지만 한 번 구성하고 나니 실제 사용 방식은 단순하다.

RTX 5090 컴퓨터에서 모델 서버를 켜고, Mac에서 Codex를 실행하면 된다.

아직 더 사용해봐야겠지만, 적어도 64K에서 실패하던 작업들이 128K에서는 별문제 없이 돌아가고 있다. 생각했던 것보다 실사용 가능한 상태에 가까운 것 같다.

---