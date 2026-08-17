---
title: "코덱스에서 공짜 opus 4.6 사용하기. Qwen3.8 27B + opencodex + codex app"
slug: trying-qwen38-model-with-codex-app
summary: Qwen 3.8 27B 모델을 리눅스 환경에서 돌리고 opencodex와 codex app을 활용해서 Mac 기기에서 사용할 수
  있게 세팅하고 사용해봤어요. compute use도 되네요.
date: 2026-08-17
tags:
  - Qwen
  - Local LLM
  - RTX5090
  - OpenCodex
  - Codex
  - Mac
draft: false
time: 10:01
timezone: America/New_York
---
## 0. 계기

qwen 3.8 27b 모델이 화제인데요. 성능이 너무 좋다길래 저도 사용해보고 싶더라고요. Tool use도 되고요. 마침 또 제가 가지고 있는 컴퓨터도 그동안은 Isaac Sim, Isaac Lab 제대로 공부해봐야지 하고서는 어느 정도는 놀고 있었고요.



그러다가 이 글을 보게 되었지 뭐예요.

![claudebum's Thread · Threads.png](/images/blog/claudebums-thread-threads.webp)

원본 쓰레드는 여기예요: [claudebum's Thread](https://www.threads.com/share/FF0OaEaR6/)

어? 좋은데 나도 해봐야겠다 하고 해봤습니다. codex 앱 잘 사용되고 좋던데요. compute use까지도 되고요. 크롬도 잘 사용하더라고요.



실제 스크린샷이랑 compute use gif입니다. 

![774076421_17983041252106419_3651025433588643498_n.jpg](/images/blog/774076421179830412521064193651025433588643498n.webp)

![codex compute use](/images/blog/codex-compute-use.gif)



100+ tok/s 언저리로 나와요.

## 1. 최종 구성

만든 구조는 생각보다 단순한 거 같아요. tailscale은 꼭 쓰세요. 저는 Oracle Cloud Instance도 있고, 맥도 쓰고, 리눅스도 쓰고, 윈도우도 쓰고 등등 하니까 다 tailscale로 묶어놓으면 너무 편해요.

```text

Mac의 Codex

→ OpenCodex

→ Tailscale

→ RTX 5090 서버의 vLLM

→ Qwen3.8-27B

```

저는 RTX 5090이 달린 Linux 컴퓨터에서는 모델만 실행하고, 실제 작업은 평소 사용하던 Mac에서 하는 걸로 세팅했어요. 컴퓨터를 들고 다닐 수는 없으니까요.

모델은 Qwen3.8-27B NVFP4를 사용했고, KV 캐시는 FP8, 컨텍스트는 최종적으로 128K로 설정했고요.

Mac에서는 OpenCodex를 이용해 기존 Codex 인터페이스에 모델을 연결했는데요. 최종적으로 보이는 모델 이름은 이렇게 했어요. 세팅값이 잘 보일 수 있도록요.

```text

rtx5090/qwen3.8-27b-nvfp4-fp8kv-128k

```

앞의 `rtx5090`은 OpenCodex provider 이름이라 Mac에서 설정했고, 뒤는 vLLM에 세팅한 모델 이름이라 Linux(Ubuntu)에서 세팅했어요.

## 2. 설치와 Troubleshooting

설치 과정을 하나하나 직접 명령어로 정리하지는 않을게요. 요즘은 codex가 워낙 잘 해줘서...

이후에도 오류가 생길 때마다 로그를 보여주고 원인을 확인했어요. 특히 저는 codex도 아이패드에서 사용해서 그냥 Mac에서 복사하고 iPad codex remote에서 붙여넣기 했어요.

모델 서버보다는 OpenCodex와 Codex를 연결하는 과정에서 자잘한 문제가 더 많이 생겼어요.

먼저 OpenCodex에 Tailscale IP를 넣었더니 사설 네트워크 주소라서 거부됐어요.

```text

baseUrl points to a private-network address

```

Tailscale 연결이 잘못된 건 아니었어요. OpenCodex가 보안상 사설 주소를 기본적으로 허용하지 않는 거였어요.

제 경우에는 의도적으로 개인 Tailnet의 서버에 연결하는 것이라 `allowPrivateNetwork` 옵션을 활성화했어요.


provider 이름과 모델 이름도 처음에는 헷갈렸어요. `qwen5090`이라는 provider 이름을 쓰다가 나중에 `rtx5090`으로 바꿨고요.

여기서 provider 이름과 실제 모델 이름이 별개라는 걸 알게 됐어요.

```text

rtx5090/qwen3.8-27b-nvfp4-fp8kv-128k

```

- `rtx5090`: 어느 서버로 요청을 보낼 것인가
- `qwen3.8-27b-nvfp4-fp8kv-128k`: 해당 서버의 어떤 모델을 사용할 것인가


## 3. 64K에서 128K까지

처음에는 컨텍스트를 64K로 설정했어요. 일단은 안전하게 실행 가능한지 보고 싶어서요. 

실제로 일 시켜 보니까 Codex 세션이 길어지면 가끔 요청이 실패했어요. 그래서 결국 128K로 올려보기로 했어요.

GPU 메모리 사용 비율을 `0.95`로 높이고 동시 요청을 1개로 제한하자 128K로 정상 실행되더라고요.

현재 설정은 이렇게 해 놨어요.

```text

모델: Qwen3.8-27B NVFP4

KV 캐시: FP8

컨텍스트: 131,072 tokens

GPU 메모리 비율: 0.95

동시 요청: 1

MTP speculative tokens: 3

```

모델이 올라온 상태에서는 VRAM을 약 31.5GB 사용하고 1GB 정도가 남아요. 여유가 많은 편은 아니지만, 이 컴퓨터에서는 모델 서버만 켜놓으니까 문제는 없을 것 같아요.

128K로 올린 뒤 64K에서 발생하던 실패가 훨씬 덜 나타나더라고요. 물론 컨텍스트가 128K를 넘어서 오류가 나기는 하는데 일단 추가 설정은 귀찮아서 그냥 사용 중입니다. 나중에 입력과 출력 예산을 나눠 설정하려고요.

## 4. 실제로 사용해보니

OpenCodex를 사용한다고 Qwen이 OpenAI의 Codex 전용 모델과 같아지는 것은 아니지만, Codex의 파일 접근, 셸 실행, 도구 호출, compute use 같은 하네스를 그대로 사용할 수 있는 게 너무 좋아요.

현재는 Mac에서 다음 모델을 선택하면 추론만 RTX 5090 서버에서 처리돼요.

```text

rtx5090/qwen3.8-27b-nvfp4-fp8kv-128k

```

아직 더 사용해봐야겠지만, 적어도 64K에서 실패하던 작업들이 128K에서는 어느 정도는 별문제 없이 돌아가고 있어요. 생각했던 것보다 실사용 가능한 상태에 가까운 것 같아요.

그리고 처음으로 실사용 용도로 로컬 모델 돌려보는데 재미있네요. 역시 장비를 갖춰놓으니 시작하고 싶을 때 언제든지 시작할 수 있다는 게 장점이네요. RTX 5090 FE 살 때 MSRP로 샀는데도 너무 비싸서 당분간 굶을 각오로 가용자금 끌어다가 샀는데 지금은 산 보람이 있는 것 같아요. GR00T N1.5 모델 가지고 노느라 클라우드 쓸 때는 상시 켜놓을 수도 없고, 켜놓기만 하면 돈이 나가서 너무 부담스러웠거든요.

그래서 트레이드오프를 정리해보면 이래요. 속도는 확실히 GPT 모델 쓰던 거보다 느려요. 급하게 뭔가 쳐내야 할 때는 답답할 수 있을 것 같아요. 대신 상시 켜놔도 토큰당 돈이 안 나가고, Codex 하네스(파일 접근·셸 실행·도구 호출·compute use)를 그대로 쓸 수 있다는 게 커요. 클라우드 인스턴스처럼 "켜두면 돈이 샌다"는 부담 없이, 하고 싶을 때 부담 없이 이것저것 굴려볼 수 있는 거죠. 그리고 진짜로 쓸 만한 로컬 모델이다 이런 느낌이에요. 클라우드에 데이터 전송 안하고 싶거나 아니면 그냥 복잡하지 않은 거라서 로컬에서 시간 좀 걸려도 문제 없다 이런것은 충분히 쓸 정도까지 되는 느낌이에요. 솔직히 32GB VRAM에서 이정도 모델이 돌아간다는게 정말 신기합니다. 

정리하면, 로컬 모델로서 정말 쓸 수 있을 정도까지 올라온 모델이다 싶어요.

---

