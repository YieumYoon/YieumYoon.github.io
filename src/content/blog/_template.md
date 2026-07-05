---
# Required
title: "글 제목"
summary: "목록, 검색 결과, 공유 카드에 보일 1-2문장 요약입니다."
date: "YYYY-MM-DD"
tags:
  - Tag
draft: true

# Optional publishing time
# - Default timezone is UTC.
# - Use time when the exact publish/write time matters.
# - Use an IANA timezone only when you want the displayed time to reflect a local place.
time: "HH:mm"
timezone: "UTC"

# Optional updated metadata
updatedDate: "YYYY-MM-DD"
updatedTime: "HH:mm"
updatedTimezone: "UTC"

# Optional social image
# - Absolute public path: "/open-graph.jpg"
# - External URL also works if the image is stable.
image: "/open-graph.jpg"
---

<!--
Post rules

1. Do not use a Markdown H1 (#) in the body.
   The Astro article template renders frontmatter.title as the only H1.

2. Start body sections with H2 (##), then use H3 (###) for subsections.

3. Keep frontmatter dates in ISO date format:
   date: "2026-07-05"
   time: "14:30"
   timezone: "UTC"

4. Keep draft: true while writing.
   Change to draft: false only when the post is ready to publish.

5. Delete unused optional frontmatter fields before publishing.
   For example, remove updatedDate/time/timezone if the post has never been updated.

6. Recommended summary style:
   - Concrete, not poetic.
   - 80-160 Korean characters, or one short English sentence.
   - Mention the object, action, and result.

7. Image style:
   - Prefer Markdown image syntax when possible.
   - Always write useful alt text.
   - Use HTML <img> only when you need width or special attributes.
-->

첫 문단에는 이 글을 왜 쓰는지, 독자가 무엇을 얻을 수 있는지 적습니다. 검색이나 목록에서 들어온 사람이 바로 맥락을 잡을 수 있도록 2-4문장 정도가 좋습니다.

## 배경

무엇을 보았는지, 만들었는지, 읽었는지, 혹은 어떤 문제가 있었는지 적습니다.

- 상황:
- 계기:
- 목표:

## 핵심 내용

글에서 가장 중요한 내용을 먼저 정리합니다. 기술 분석 글이면 결론을, 프로젝트 글이면 무엇을 만들었는지를, 회고 글이면 바뀐 생각을 여기에 둡니다.

## 과정

실제로 한 일을 시간순이나 판단순으로 적습니다.

1. 처음 시도한 것
2. 막힌 부분
3. 확인한 방법
4. 최종 선택

## 세부 내용

필요하면 하위 섹션을 사용합니다.

### 구현

코드, 도구, 설정, 라이브러리, 명령어를 설명합니다.

```bash
# command example
```

### 문제와 해결

문제:

원인:

해결:

### 비교

| 선택지 | 장점 | 단점 | 판단 |
| --- | --- | --- | --- |
| A |  |  |  |
| B |  |  |  |

## 결과

완성된 결과, 배운 점, 성능, 스크린샷, 링크를 정리합니다.

- Live demo:
- Repository:
- Reference:

## 알게 된 점

다음에 다시 사용할 수 있는 기준이나, 글을 쓰면서 생각이 바뀐 지점을 적습니다.

## 마무리하며

남은 질문, 다음에 해볼 일, 독자에게 묻고 싶은 것을 적습니다.

<!--
Post type presets

Project post:
- 배경
- 무엇을 만들었나
- 주요 기능
- 구현
- 문제와 해결
- 결과
- 다음 계획

Technical analysis:
- 호기심의 시작
- 관찰한 것
- 사용된 기술
- 직접 확인한 방법
- 한계
- 알게 된 점

Book/article review:
- 읽게 된 이유
- 핵심 주장
- 인상 깊은 부분
- 내 생각
- 지금의 기술/경험과 연결되는 점
- 남은 질문

Learning log:
- 오늘 한 것
- 막힌 것
- 해결한 것
- 내일 할 것

Personal essay:
- 계기
- 당시 상황
- 생각의 변화
- 지금 남은 것
-->
