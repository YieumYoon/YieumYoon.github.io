---
title: think[box] Embedded AI Microgrant로 Jetson Orin Nano Super를 받았어요
slug: jetson-orin-nano-embedded-ai-microgrant
lang: ko
translationReviewed: false
summary: "CWRU think[box] Embedded AI Microgrant로 Jetson Orin Nano 개발 키트랑
  케이스, 크레딧을 받았습니다. SO-101로 튜브 꽂기, 언어 명령으로 전구 켜고 끄기
  VLA를 돌려보려고 하는데, SD 카드로는 카메라 3대가 감당이 안 될 것 같아서 SSD는
  사비로 샀습니다."
date: 2026-10-08
tags:
  - nvidia
  - jetson
  - vla
  - so101
  - robotics
draft: false
time: 14:24
timezone: America/New_York
image: /images/blog/jetson-microgrant-kit-unboxed.webp
---
CWRU [think[box] Embedded AI Microgrant](https://case.edu/utech/about/utech-news/sears-thinkbox-embedded-ai-microgrants)에 지원해서 Jetson Orin Nano Developer Kit, Waveshare 알루미늄 케이스, SanDisk 128GB SD 카드, Display to HDMI 케이블에 프로젝트 크레딧 $100, think[box] 크레딧 $50까지 받았습니다.

![Embedded AI Microgrant 라벨, Jetson Orin Nano Developer Kit 박스, Waveshare 알루미늄 케이스 박스를 책상 위에 펼쳐 놓은 모습](/images/blog/jetson-microgrant-kit-unboxed.webp)

스테이지 만들어서 VLA 학습시켜 돌려보려고 하는데, Task는 NVIDIA [Sim-to-Real SO-101 튜토리얼](https://docs.nvidia.com/learning/physical-ai/sim-to-real-so-101/latest/index.html)에 나온 대로 튜브를 랙에 집어넣기, 언어로 명령해서 전구 켜고 끄기 이렇게 하려고요. 스테이지는 [SO-101 워크셀 글](/blog/so101-sim-to-real-workcell/)에 따로 정리해 뒀습니다.

다만 SD 카드로는 카메라 3대에서 나오는 비디오 데이터 스트림 속도가 감당이 안 될 것 같아서 SSD는 사비로 샀습니다... ㅜ [KingSpec 256GB M.2 NVMe](https://www.amazon.com/dp/B0D1R7HDJF)입니다.

![KingSpec M.2 NVMe SSD와 포장 박스 옆에 Waveshare 케이스에 들어간 Jetson Orin Nano가 놓여 있는 모습](/images/blog/jetson-microgrant-ssd-and-case.webp)

일단 부팅해서 Tailscale 설치하고 SSH 설정했고, Ubuntu에 RDP도 세팅해서 지금은 iPad Windows App에서 Tailscale 통해 RDP로 접속해서 쓰고 있습니다.

![iPad의 Windows App으로 RDP 접속한 Jetson Ubuntu 데스크톱에서 패키지 설치 로그가 뜬 터미널, 옆에 안테나를 단 Jetson 케이스](/images/blog/jetson-microgrant-first-boot.webp)

아 참고로 Ubuntu랑 RDP 호환성에 문제가 있는지 세팅이 좀 까다로운데 Ubuntu 5090 desktop 세팅에서 프롬프트 날려보면 이렇게 했다고 하는데... 아마 Codex, Claude code한테 프롬프트 날려가면서 Ubuntu에서 RDP 이렇게 세팅하려고 한다고 하면 잘 될 거예요.
```text
접속: 양쪽에 Tailscale 설치하고 같은 Tailnet에 로그인. Windows App에서 Ubuntu의 Tailscale IP로 RDP 접속합니다. SSH도 먼저 열어두면 화면이 안 나올 때 복구하기 편합니다.
로그인 방식: 여기서는 Wayland + 사용자 자동 로그인 + 데스크톱 공유를 사용했습니다. 로그인 전 접속용 원격 로그인 기능과는 다른 방식입니다.
화면 생성: gsettings set org.gnome.desktop.remote-desktop.rdp screen-share-mode 'extend'로 원격 가상 화면을 사용하고, systemctl --user enable --now gnome-remote-desktop으로 서비스를 활성화합니다.
재부팅 후 인증 실패: 자동 로그인해도 GNOME 키링은 잠겨 있을 수 있습니다. RDP 자격증명을 읽을 수 있는지 확인하세요. 저희는 Login 키링 비밀번호를 비웠지만, 키링의 저장정보 암호화가 제거되는 선택입니다.
바탕화면만 보이고 메뉴바가 없음: RDP 화면이 보조 모니터로 잡힌 경우입니다. 가상 화면을 주 모니터로 지정하면 됩니다. 재접속마다 화면 식별번호가 바뀌면 자동 지정 스크립트가 필요할 수 있습니다.
보안 연결 중 무한 로딩: 시스템 시간·TLS 인증서 유효기간을 확인하세요. 저희 환경에는 FreeRDP 인증 메시지 순서 버그도 있어 공식 패치(https://github.com/FreeRDP/FreeRDP/commit/cbb6a73d1281fa9e4084c24f07ed0c9ad171f125)를 적용했습니다. 모든 Ubuntu에 필요한 패치는 아니니 설치 버전부터 확인해야 합니다.
```


