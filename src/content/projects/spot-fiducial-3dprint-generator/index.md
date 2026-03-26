---
title: "Spot Fiducial AprilTag Plate Generator"
summary: "Boston Dynamics Spot용 fiducial plate SVG를 브라우저에서 생성할 수 있는 웹 도구입니다. 146 mm tag36h11 AprilTag, print SVG, CAD SVG export를 지원합니다."
date: "Mar 26 2026"
draft: false
tags:
  - Robotics
  - AprilTag
  - SVG
  - JavaScript
  - GitHub Pages
demoUrl: "https://yieumyoon.github.io/spot-fiducial-3dprint-generator/"
repoUrl: "https://github.com/YieumYoon/spot-fiducial-3dprint-generator"
---

# Spot Fiducial AprilTag Plate Generator

Boston Dynamics Spot용 fiducial plate를 더 빠르게 만들기 위해 만든 정적 웹 프로젝트입니다. 반복적으로 CAD 파일을 열어서 텍스트와 태그 번호를 수정하는 과정을 줄이고, 브라우저에서 바로 확인하고 SVG로 내보낼 수 있도록 만들었습니다.

- Live demo: [Spot Fiducial AprilTag Plate Generator](https://yieumyoon.github.io/spot-fiducial-3dprint-generator/)
- Repository: [YieumYoon/spot-fiducial-3dprint-generator](https://github.com/YieumYoon/spot-fiducial-3dprint-generator)

## What this project does

이 프로젝트는 Boston Dynamics Spot fiducial plate SVG를 생성하는 브라우저 기반 도구입니다. `tag36h11` AprilTag family를 사용하고, 고정된 146 mm AprilTag 크기를 유지하면서 필요한 텍스트와 로고를 빠르게 교체할 수 있습니다.

생성된 파일은 바로 출력할 수 있는 print SVG와 CAD 가져오기에 맞춘 CAD SVG 두 가지 형태로 다운로드할 수 있습니다. 백엔드 없이 클라이언트에서만 동작하도록 만들었기 때문에 GitHub Pages 같은 정적 호스팅에도 잘 맞습니다.

## Main features

- `tag36h11` AprilTag ID `001-586` 지원
- 고정된 Spot fiducial plate geometry 유지
- 회사명, 로봇명, 태그 ID 텍스트 입력
- 기본 로고, 빈 로고, 사용자 SVG 로고 업로드 지원
- print SVG / CAD SVG 두 가지 export
- 브라우저 미리보기와 다운로드 결과를 최대한 가깝게 유지

## Why I built it

이 프로젝트를 만든 이유는 Spot용 fiducial plate를 만들 때마다 같은 템플릿을 수작업으로 다시 수정하는 과정이 비효율적으로 느껴졌기 때문입니다. plate 규격은 고정하고, 실제로 자주 바뀌는 값인 tag ID, 텍스트, 로고만 빠르게 바꿀 수 있는 작은 도구가 있으면 훨씬 편하겠다고 생각했습니다.

## Stack

- Static HTML, CSS, JavaScript
- SVG composition in the browser
- `opentype.js` for text-to-path conversion
- GitHub Pages for deployment

## Notes

이 프로젝트 페이지는 데모 사이트와 저장소를 같이 연결해 두어서 검색에서 프로젝트를 찾은 뒤에도 바로 실제 웹앱으로 이동할 수 있게 구성했습니다. 장기적으로는 Spot 관련 다른 툴이나 robotics utility들도 여기에 함께 정리할 계획입니다.
