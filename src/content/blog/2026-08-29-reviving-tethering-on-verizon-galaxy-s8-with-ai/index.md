---
title: "공기계 Galaxy S8의 막힌 테더링을 AI와 함께 살리고 앱으로 공개했어요"
slug: reviving-tethering-on-verizon-galaxy-s8-with-ai
lang: ko
summary: "SIM 없는 Verizon Galaxy S8의 테더링 차단 원인을 실제 기기와 설정 앱에서 찾고, 시작·종료 앱을 만들어 정식 APK로 공개했어요."
date: "2026-08-29"
updatedDate: "2026-08-31"
tags:
  - Android
  - Samsung Galaxy S8
  - Tethering
  - Codex
  - AI
draft: false
timezone: America/New_York
---

저에게는 Hi Reader Pro라는 안드로이드 전자책 단말기가 있는데. 이 기기는 Wi-Fi에 연결된 상태에서 그 인터넷을 다시 Wi-Fi 핫스팟으로 공유할 수도 있고, USB 테더링으로 전달할 수도 있어요. 그래서 wifi 드라이버 없는 데스크톱에서 드라이버 다운로드 받을때 usb 데터링을 유용하게 썼고요.

그런데 미국에서 산 Verizon Samsung Galaxy S8은 둘 다 안 됐습니다. 지금은 SIM도 없는 공기계이고 통신사 락도 풀려 있는데, 핫스팟을 켜려고 하면 SIM이 필요하다고 막혔어요.

처음에는 원래 데터링은 데이터로만 되나 보다 그렇게 생각하다가 다른 안드로이드 자체에는 이미 테더링 기능이 있는데, 그렇다면 이 S8도 하드웨어가 못 하는 게 아니라 소프트웨어에서 막힌 것 아닐까 라고 생각햇어요.

그렇게 시작한 궁금증에서 codex와 논의하며 결국은 [공개 GitHub 저장소](https://github.com/YieumYoon/galaxy-s8-hotspot-toggle)와 정식 서명한 `v1.0.0` APK까지 만들었습니다. 지금은 S8에서 앱 하나로 핫스팟을 켜고 끄고, 현재 상태도 확인할 수 있습니다.

![Galaxy S8 홈 화면에 설치된 S8 Hotspot 앱 아이콘](/images/blog/galaxy-s8-hotspot-app-icon.webp)

## 1.

처음 찾은 방법은 구글 ai 검색 결과에서 ADB에서 `tether_dun_required` 값을 `0`으로 바꾸는 것이었어요.

```bash
adb shell settings put global tether_dun_required 0
```

구글 ai 검색 결과에서 이거 무조건 된다, 이 명령으로 통신사의 핫스팟 검사를 끌 수 있다고 했어요. 그런데 Codex는 이 값이 테더링에 별도의 DUN APN을 요구할지 정하는 값이지, SIM 검사나 Verizon의 가입 확인을 없애는 설정은 아니라고 했습니다.

실제 S8을 확인해보니 그 값은 이미 `0`이었어요. 시스템도 DUN이 필요하지 않다고 인식하고 있었지만 핫스팟은 여전히 켜지지 않았습니다.

테스트한 기기는 다음 한 대입니다.

```text
모델: SM-G950U
Android: 9
빌드: G950USQU8DUJ1
판매 코드: VZW
SIM: 없음
통신사 락: 해제
```

## 2.

공기계이고 락도 풀려 있는데 왜 계속 Verizon의 제한을 받아야 하는지 이해가 안 됐어요. 본인이 소유한 기기를 왜 통신사가 아직도 컨트롤하나 생각도 들었고요. 확인해보니 통신사 락 해제와 펌웨어 안의 통신사 정책은 다른 층이었습니다.

통신사 락을 풀면 다른 통신사의 SIM을 사용할 수 있지만, 폰에 설치된 Verizon용 펌웨어와 활성 CSC가 일반 언락 펌웨어로 바뀌는 것은 아니었어요. 이 S8의 Samsung 설정 앱에는 핫스팟을 켜기 전에 SIM 상태를 확인하고, SIM이 준비되지 않았으면 경고창을 띄운 뒤 중단하는 코드가 남아 있었습니다.

```text
기본 핫스팟 스위치
→ Samsung 설정 앱
→ SIM 상태 확인
→ SIM 없음
→ 경고창을 띄우고 종료
```

Wi-Fi 칩이나 안드로이드 테더링 엔진이 실패한 것은 아니었어요. 핫스팟을 실제로 시작하는 단계까지 가기도 전에 설정 화면에서 멈추고 있었습니다.

![SIM 카드가 없어 모바일 핫스팟과 테더링을 사용할 수 없다는 Galaxy S8 경고 화면](/images/blog/galaxy-s8-hotspot-no-sim.webp)

## 3.

Codex는 연결된 기기의 Samsung 설정 앱인 `SecSettings.apk`를 분석하다가 핫스팟 드라이버 복구용 `BroadcastReceiver`를 찾았어요.

```text
com.samsung.android.settings.wifi.mobileap.WifiApBroadcastReceiver
```

이 Receiver는 Wi-Fi AP 드라이버가 실패했다는 신호와 오류 코드 `14`를 받으면 프로비저닝이 성공한 상태로 표시하고, Samsung의 시스템 API로 핫스팟을 다시 켜도록 구현되어 있었습니다.

이 구성요소는 외부 앱의 신호를 받을 수 있는데도 별도의 호출 권한을 요구하지 않았어요. 일반 앱이 핫스팟 시스템 API를 직접 실행하면 권한 부족으로 실패하지만, 이 Receiver에 복구 신호를 보내면 시스템 권한을 가진 설정 앱이 대신 실행합니다.

![권한이 없는 일반 앱이 외부에 공개된 Samsung Settings 구성요소를 거쳐 시스템 권한으로 핫스팟을 켜고 끄는 구조](/images/blog/galaxy-s8-hotspot-permission-boundary.svg)

구형 Samsung 펌웨어에서 외부에 노출된 시스템 구성요소를 발견한 셈이에요. 정상적인 공개 Android API는 아니었습니다. 편리한 우회 경로이면서 다른 일반 앱도 같은 방식으로 핫스팟 상태를 바꿀 수 있다는 보안 문제이기도 합니다. 하지만 여기서는 필요한 기능이니 사용합니다. 이미 보안 업데이트 끝난지 한참 지나기도 했고요.

## 4.

복구 신호는 먼저 ADB로 보냈습니다. 그러자 SIM이 없는 상태에서 핫스팟이 실제로 켜졌고 `swlan0` 인터페이스가 만들어졌어요. S8이 연결하고 있던 집 Wi-Fi는 `wlan0`을 통해 상위 인터넷으로 계속 유지됐습니다.

화면에 스위치만 켜진 것은 아닌지도 확인했어요. 제 iPhone을 S8의 핫스팟에 연결하자 IP 주소를 받았고 인터넷이 됐습니다. Apple Watch도 다시 연결됐고, DNS 트래픽이 S8의 핫스팟 인터페이스에서 집 Wi-Fi 쪽으로 전달되는 것도 확인했어요.

![SSID와 비밀번호를 가린 Galaxy S8 설정에서 Mobile Hotspot과 Wi-Fi Sharing이 모두 켜진 화면](/images/blog/galaxy-s8-hotspot-settings-on.webp)

```text
집 Wi-Fi
→ Galaxy S8의 wlan0
→ Android 테더링과 NAT
→ S8 핫스팟 swlan0
→ iPhone과 Apple Watch
```

여기까지 되자 저도 진짜 “이게 된다고???” 싶었어요. 하드웨어가 안 되는 기기라고 생각했는데, 데이터 경로는 모두 살아 있었고 설정 앱의 검사만 통과하지 못하고 있었던 거니까요. 왜 이렇게 막아 놓은건지 잘 모르겠어요. 멀쩡히 있는 기능을.

![개인 알림을 가린 상태에서 No SIM found와 Mobile Hotspot 알림이 동시에 표시된 화면](/images/blog/galaxy-s8-hotspot-no-sim-running.webp)

다만 핫스팟을 끈 뒤 기본 스위치로 다시 켜면 또 SIM 검사에 막혔습니다. 펌웨어를 영구적으로 고친 것이 아니라 필요할 때 복구 경로를 다시 실행하는 방식이었어요. 그래서 컴퓨터 없이 이 신호를 보낼 수 있는 버튼 앱을 만들었습니다.

![초기 S8 Hotspot 개발판에서 핫스팟이 켜지고 Wi-Fi 연결이 공유 중이라고 표시된 화면](/images/blog/galaxy-s8-hotspot-on.webp)

## 5.

첫 APK는 정말 `핫스팟 켜기` 버튼 하나뿐이었어요. Android 권한을 하나도 요청하지 않고, 버튼을 누르면 정확한 Samsung Receiver를 지정해 복구 Broadcast를 보냈습니다.

```java
Intent intent = new Intent(ACTION_DRIVER_HANGED);
intent.setComponent(new ComponentName(
        "com.android.settings",
        SETTINGS_RECEIVER
));
intent.putExtra("wifi_ap_error_code", 14);
sendBroadcast(intent);
```

![S8 Hotspot 앱의 Start Hotspot 요청이 Samsung Settings Receiver와 WifiService를 거쳐 SoftAP을 시작하는 순서](/images/blog/galaxy-s8-hotspot-start-sequence.svg)

이 앱을 S8에 설치해 일반 앱 상태에서 실행했고, 핫스팟과 Wi-Fi 인터넷 중계가 다시 켜지는 것을 확인했어요. 그런데 직접 사용해보니 켜기만 되는 버튼으로는 조금 불편했습니다. 앱 안에서는 핫스팟이 켜졌는지 알 수 없었고, 끄려면 다시 Samsung 설정으로 들어가야 했어요.

그래서 앱을 영문으로 바꾸고 `WIFI_AP_STATE_CHANGED`를 받아 핫스팟 상태를 실시간으로 표시하도록 만들었습니다. 현재 상태가 `OFF`면 `Start Hotspot`, `ON`이면 `Stop Hotspot`으로 같은 버튼이 바뀌고, 켜지거나 꺼지는 중에는 버튼을 잠시 비활성화해요. 상태 Broadcast를 읽지 못하면 `swlan0` 인터페이스를 확인하고, 8초 안에 전환이 끝나지 않으면 실패 상태로 돌아옵니다.

![S8 Hotspot 앱이 핫스팟 상태를 확인하고 시작, 실패, 종료 상태 사이를 오가는 상태도](/images/blog/galaxy-s8-hotspot-state-machine.svg)

끄는 기능은 켜기와 다른 Samsung 설정 경로를 사용했어요. 앱이 외부에 공개된 `WifiWarning` Activity를 열면 시스템 권한을 가진 Settings가 핫스팟을 끕니다. 기기에 따라 처음 한 번은 Samsung 확인창이 나타날 수 있어요.

![S8 Hotspot 앱의 Stop Hotspot 요청이 Samsung WifiWarning Activity를 거쳐 핫스팟을 끄는 순서](/images/blog/galaxy-s8-hotspot-stop-sequence.svg)

```text
S8 Hotspot 앱 · 요청 권한 0개
├─ Start → Settings의 복구 Receiver → SoftAP ON
├─ Stop  → Settings의 WifiWarning Activity → SoftAP OFF
└─ 상태  ← WIFI_AP_STATE_CHANGED 또는 swlan0 확인
```

최종 앱은 필요한 Samsung 구성요소가 실제로 존재하고 외부에 공개되어 있는지도 먼저 확인해요. 없으면 `This firmware is not compatible`라고 표시하고 버튼을 비활성화합니다. 다만 구성요소가 있다는 것만으로 내부 코드까지 같은지는 알 수 없기 때문에 이 검사가 호환성을 보장하는 것은 아닙니다.

아이콘은 단색 파란 배경에 Google Material `wifi_tethering` 심볼을 사용했어요. 최종 APK의 패키지명은 개인 이름을 뺀 `dev.legacyhotspot.s8`이고, 앱 이름은 `S8 Hotspot`입니다.

![핫스팟이 꺼져 있어 Start Hotspot 버튼을 사용할 수 있는 앱 화면](/images/blog/galaxy-s8-hotspot-off.webp)

## 6.

제 폰에서 되는 APK 하나만 남기는 대신, 다른 사람도 코드를 읽고 빌드하고 호환 결과를 제보할 수 있는 공개 프로젝트로 정리하고 싶었어요. 그리고 기왕 찾은거 공유하고 누가 ai가지고 찾다가 우연히 이 블로그 정보 긁어갈 수도 있는 거구요. 그래서 저장소를 [YieumYoon/galaxy-s8-hotspot-toggle](https://github.com/YieumYoon/galaxy-s8-hotspot-toggle)로 만들었습니다.


저장소에는 다음을 같이 넣었습니다.

- 앱 소스와 직접 빌드할 수 있는 스크립트
- 구현 구조와 펌웨어 호환성 문서
- 개인정보를 제외한 호환성 제보 양식
- Apache 2.0 라이선스와 아이콘 출처
- 비공개 보안 제보 안내
- 개인정보 검사와 APK 빌드를 실행하는 GitHub Actions

GitHub Actions의 첫 실행은 runner에서 `sdkmanager`를 찾지 못해 실패했어요. 별도로 SDK를 설치하려던 단계를 빼고 runner에 이미 있는 Android SDK를 사용하도록 바꾼 뒤 빌드가 통과했습니다. 그 뒤로는 저장소에 푸시할 때마다 개인정보 검사와 APK 빌드를 다시 확인합니다.

## 7.

소스와 CI 빌드가 생겼으니 APK도 바로 Release에 올리면 되는 줄 알았어요. 그런데 개발용 임시 키로 서명한 APK는 다음 빌드에서 서명이 달라질 수 있고, Android에서는 패키지명과 서명이 모두 같아야 기존 앱 위에 업데이트할 수 있었습니다.

```text
v1.0.0 ─ 같은 패키지명 + 같은 서명키 ─ v1.1.0 업데이트 가능
v1.0.0 ─ 같은 패키지명 + 다른 서명키 ─ 업데이트 거부
```

그래서 앞으로 계속 사용할 릴리스 키를 직접 만들기로 했어요. 처음에는 암호화 디스크 이미지, 별도 USB, 클라우드 백업까지 회사 보안팀처럼 준비해야 한다는 설명을 듣고 “그 정도까지 한다고? 에반데...” 싶었습니다.

이 앱은 사용자 데이터도 없고 작은 개인 프로젝트라서 관리 방법을 현실적으로 줄였어요. 비밀번호가 걸린 릴리스 키는 Git 저장소 밖의 개인 iCloud Drive에 두고, 강한 비밀번호는 Apple Passwords에 따로 보관했습니다. 키와 비밀번호는 GitHub나 채팅에 올리지 않고요.

릴리스 키는 누가 발급해주는 파일이 아니라 `keytool`로 직접 생성한다는 것도 이번에 처음 알았어요. 비밀번호가 Codex 대화에 들어가지 않도록 일반 Terminal에서 제가 직접 입력했고, 빌드 스크립트도 비밀번호를 명령행 인자로 남기지 않고 환경변수로 `apksigner`에 전달하도록 바꿨습니다.

## 8.

릴리스 키로 서명한 APK의 패키지, 버전, 권한, 인증서 지문과 SHA-256을 확인한 뒤 [Galaxy S8 Hotspot Toggle v1.0.0](https://github.com/YieumYoon/galaxy-s8-hotspot-toggle/releases/tag/v1.0.0)으로 공개했습니다.

- 버전: `1.0.0`
- 패키지: `dev.legacyhotspot.s8`
- 요청 권한: 0개
- APK SHA-256: `8e6b2ae76224b67fc66c145d17ca8a16561714791d5a5ecf86ff1bed6f79abc9`
- GitHub Actions: 통과

[APK는 GitHub Release에서 직접 받을 수 있습니다.](https://github.com/YieumYoon/galaxy-s8-hotspot-toggle/releases/download/v1.0.0/galaxy-s8-hotspot-toggle.apk) 저장소의 README에는 공식 서명 인증서 지문도 공개해서 다른 곳에서 받은 파일의 서명을 비교할 수 있게 했어요.

마지막으로 S8에서 임시 서명 테스트판을 제거하고 정식 APK를 설치했습니다. 정식 서명과 패키지가 맞는지, 앱이 충돌 없이 실행되는지 확인했고 이전 개발판도 지워서 지금은 `v1.0.0`만 남아 있어요.

처음에는 버튼 하나가 되나 확인해보는 실험이었는데, 상태 표시와 시작·종료, 호환성 사전 검사, 공개 소스, CI, 개인정보 검사, 릴리스 서명까지 갖춘 작은 프로젝트가 됐습니다.

## 9.

처음 궁금했던 것은 Wi-Fi 핫스팟뿐만 아니라 USB 테더링도 왜 막히는가였어요. USB 테더링 설정에도 Verizon 기기에서 SIM이 없으면 중단하는 별도의 코드가 있었습니다.

설정 화면을 거치지 않고 ADB에서 USB 기능을 RNDIS로 전환하자 S8 안에서는 `rndis0` 인터페이스가 생성됐고, 집 Wi-Fi인 `wlan0`이 상위 네트워크로 선택됐어요. S8 내부에서는 Wi-Fi 인터넷을 USB로 전달하는 테더링 경로까지 만들어진 셈입니다.

하지만 Wi-Fi 핫스팟과 달리 USB 쪽에서는 권한 없는 일반 앱이 사용할 수 있는 같은 형태의 Receiver를 아직 찾지 못했어요. 연결한 Mac도 Samsung의 RNDIS 장치를 네트워크 어댑터로 만들지 못해서 최종 인터넷 연결까지는 확인하지 못했습니다. Windows나 Linux에서의 실제 연결도 아직 테스트하지 않았고요.

조사가 어느 정도 확정되면 USB 테더링도 앱 기능으로 추가하고 싶어요. 다만 ADB나 Shizuku를 이용해 더 높은 권한으로 RNDIS를 전환하거나, 호스트 운영체제의 드라이버 지원을 확인하는 등 Wi-Fi 핫스팟과는 다른 접근이 필요할 수 있습니다.

## 10.

이 앱을 모든 Galaxy S8이나 Samsung 기기용이라고 부를 수는 없어요. 지금까지 실기기로 확인한 범위는 `SM-G950U / Android 9 / G950USQU8DUJ1 / Verizon CSC` 한 대입니다. 이 기기에서는 시작, 실시간 상태 감지, 종료와 Wi-Fi 인터넷 중계까지 확인했습니다.

호환성 제보를 받을 수 있도록 GitHub Issue 양식을 만들었지만 IMEI, 일련번호, 전화번호, MAC 주소, Wi-Fi 이름, 전체 시스템 로그와 Samsung APK는 올리지 않도록 안내하고 있습니다. 다른 기기에서 결과가 모이면 지원 범위를 조금씩 확인할 수 있을 것 같아요.

이번 프로젝트에서 제일 신기했던 것은 세 가지예요. 못 쓰는 공기계라고 생각했던 S8이 다시 Wi-Fi 리피터가 됐고, 제 기기에서만 끝날 수 있었던 방법을 다른 사람도 검증할 수 있는 공개 프로젝트로 남겼고, “같은 안드로이드인데 왜 안 되지?”라는 질문을 AI와 계속 파고들다가 실제 릴리스까지 만들었다는 점이요. Codex를 사용하지 않았다면 시간과 노력이 너무 많이 들어서 할 엄두조차 못 냈던 것들을 이제는 구형 하드웨어조차 살려서 써볼 수 있는게 아닌가 생각중이에요.

적어도 이번 S8은 서랍 속 공기계에서 제가 실제로 유용하게 사용할 수 있는 기기가 되어가고 있습니다. 센서들과 카메라도 다 달려있고 디스플레이를 거의 켜지 않는다면 배터리도 하루는 충분히 가니까 다양한 프로젝트를 시험할 수 있는 플렛품이 생긴 것 같아요.

뭐 s8을 아직도 가지고 있는 사람들이 있으려나 싶지만... 저같은 사람도 있을 수 있으니까요.
