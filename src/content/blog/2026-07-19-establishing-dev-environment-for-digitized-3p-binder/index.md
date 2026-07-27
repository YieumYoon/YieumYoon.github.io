---
title: 현재 만들고 있는 3P 바인더를 어떻게 분리해서 개발용과 실사용용을 따로 구축할까?
slug: establishing-dev-environment-for-digitized-3p-binder
summary: "3P 바인더를 디지털화 하는 중에 개발용과 실사용용을 분리할 필요성이 생겼어요."
image: /images/blog/create-icloud-vault-on-ipad-2.webp
date: 2026-07-19
tags:
  - 3P 바인더(3P Binder)
draft: true
time: 14:43
timezone: America/New_York
---
[지난 글](/blog/digitalizing-3p-binder-idea/)에서 이야기했던 것처럼 현재 옵시디언 기반으로 3P 바인더를 만들고 있는데, 지금 만들고 있는 볼트에는 실제 3P 바인더 데이터가 그대로 들어있어서 장기적으로 개발하면서 기능 붙이기에는 그다지 좋지 않아서 지금 단계에서 분리를 하는 게 맞는 것 같아요. 

그리고 아이패드에서 연동해서 사용하려면 아이클라우드에 파일을 저장해야 하는데 깃허브와 잘 작동하지 않기도 하고요. 

그래서 깃허브 리포 기반으로 개발을 하고, 현재 작성하고 있는 것은 다 아이클라우드 기반으로 분리해야겠다고 생각했습니다. 

현재 주간 계획표는 어느 정도 작성이 되니 이렇게 마이그레이션 및 개발 환경 세팅하고 앞으로 더 진행해 나가야겠어요.

일단 첫 단계로 아이패드 옵시디언 앱에서 실사용 전용 아이클라우드 볼트를 새로 만들어봤어요.

![옵시디언 앱 첫 화면, 기존에 쓰던 my_vault와 새 볼트 만들기 메뉴가 보인다](/images/blog/create-icloud-vault-on-ipad-1.webp)

기존에 쓰던 my_vault 말고 Create new vault를 눌러서 새 볼트를 만들었어요.

![새 볼트 만들기 화면, 볼트 이름을 3P_Binder로 입력하고 Store in iCloud 옵션이 켜져 있다](/images/blog/create-icloud-vault-on-ipad-2.webp)

볼트 이름은 3P_Binder로 정하고, Store in iCloud를 켜서 만들었어요. 이 옵션은 나중에 바꿀 수 없다고 안내가 나와서 처음부터 확실히 켜고 만들었습니다.

![새로 생성된 빈 3P_Binder 볼트 화면](/images/blog/create-icloud-vault-on-ipad-3.webp)

이렇게 3P_Binder라는 이름의 새 아이클라우드 볼트가 만들어졌어요. 이제 여기에 실사용 데이터를 옮기고, 기존 볼트는 깃허브 리포 기반 개발용으로 정리해 나가면 될 것 같아요. 