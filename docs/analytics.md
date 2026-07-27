# GA4 analytics

이 블로그의 사용자 정의 분석 이벤트는 `public/js/analytics.js`에서 관리한다. 실제 GA4 전송은
`yieumyoon.github.io`에서만 허용하며, 로컬 개발 환경에서는 전송하지 않는다.

## 수집 원칙

- 페이지 종류, 글 slug, 글 태그처럼 콘텐츠 분석에 필요한 값만 수집한다.
- 링크의 표시 문구, URL 쿼리 문자열, 이메일 주소, 복사한 본문 내용은 수집하지 않는다.
- 내부 링크는 경로만, 외부 링크는 호스트 이름만 기록한다.
- 글 읽기 시간은 페이지가 화면에 보이고 브라우저에 포커스가 있을 때만 센다.
- 카드 노출은 카드의 50% 이상이 활성 화면에 1초 동안 표시되어야 기록한다.
- 복사한 코드, 오류 메시지와 스택은 수집하지 않는다.

## 이벤트 목록

| 이벤트 | 의미 | 주요 매개변수 |
| --- | --- | --- |
| `content_view` | 페이지 유형과 콘텐츠 정보가 포함된 방문 | `page_type`, `content_id`, `content_tags` |
| `article_impression` | 글 카드가 실제로 노출 | `content_area`, `content_item_id`, `content_position` |
| `article_open` | 홈/목록에서 글 선택 | `link_id`, `link_area`, `content_position` |
| `article_progress` | 글을 25/50/75/90/100% 읽음 | `content_id`, `progress_percent` |
| `article_read_time` | 실제 활성 읽기 시간이 15/30/60/120/300초에 도달 | `content_id`, `engaged_seconds` |
| `article_section_view` | 본문의 h2/h3 구간 도달 | `section_id`, `section_index`, `section_level` |
| `article_link_click` | 글 본문의 링크 선택 | `link_area`, `link_type`, `link_target` |
| `resource_open` | 글에서 외부 참고자료 열기 | `resource_type`, `link_target` |
| `resource_download` | 글에서 자료 파일 다운로드 | `resource_type`, `link_target` |
| `code_copy` | 코드 블록 복사 시도 결과 | `code_index`, `code_language`, `copy_status` |
| `article_navigation` | 이전/다음 글 선택 | `content_id`, `link_value` |
| `comments_load` | 댓글 영역 열기 | `action_area`, `action_id` |
| `project_impression` | 프로젝트 카드가 실제로 노출 | `content_area`, `content_item_id`, `content_position` |
| `project_open` | 프로젝트 링크 선택 | `link_id`, `content_position`, `link_target` |
| `resume_download` | 이력서 PDF 다운로드 | `link_id`, `link_target` |
| `contact_click` | 이메일/전화 연락 수단 선택 | `link_area`, `link_id`, `link_type` |
| `social_click` | GitHub/LinkedIn 등 소셜 링크 선택 | `link_area`, `link_id`, `link_target` |
| `rss_open` | RSS 링크 선택 | `link_area`, `link_target` |
| `theme_toggle` | 테마 변경 | `action_area`, `action_value` |
| `menu_toggle` | 모바일 메뉴 열기/닫기 | `action_area`, `action_value` (`open`/`closed`) |
| `back_to_top` | 맨 위로 이동 | `action_area`, `action_id` |
| `site_link_click` | 그 밖의 사이트 링크 선택 | `link_area`, `link_type`, `link_target` |
| `file_link_click` | 이력서 외 파일 링크 선택 | `link_area`, `link_target` |
| `page_not_found` | 사용자 지정 404 페이지 표시 | `page_path` |
| `client_error` | 제한된 브라우저·리소스 오류 | `error_type`, `error_name`, `error_source`, `error_line` |
| `web_vital` | 실제 방문자의 페이지 품질 지표 | `metric_name`, `metric_value`, `metric_rating`, `navigation_type` |

모든 사용자 정의 이벤트에는 `schema_version`, `page_type`, `content_id`, `content_tags`가
공통으로 붙는다. 값이 없는 항목은 전송하지 않는다.

## GA4 사용자 정의 정의

배포 후 GA4의 **관리 > 데이터 표시 > 사용자 정의 정의 > 사용자 정의 측정기준 만들기**에서
다음 이벤트 범위 측정기준을 등록한다. 이벤트 매개변수 이름은 아래 영문을 그대로 사용한다.

| 측정기준 이름 | 이벤트 매개변수 |
| --- | --- |
| Page type | `page_type` |
| Content ID | `content_id` |
| Content tags | `content_tags` |
| Link area | `link_area` |
| Link ID | `link_id` |
| Link value | `link_value` |
| Link type | `link_type` |
| Link target | `link_target` |
| Action area | `action_area` |
| Action ID | `action_id` |
| Action value | `action_value` |
| Article progress | `progress_percent` |
| Article read seconds | `engaged_seconds` |
| Content area | `content_area` |
| Content item ID | `content_item_id` |
| Content position | `content_position` |
| Section ID | `section_id` |
| Section index | `section_index` |
| Section level | `section_level` |
| Resource type | `resource_type` |
| Code index | `code_index` |
| Code language | `code_language` |
| Copy status | `copy_status` |
| Error type | `error_type` |
| Error name | `error_name` |
| Error source | `error_source` |
| Web vital name | `metric_name` |
| Web vital rating | `metric_rating` |
| Navigation type | `navigation_type` |

`schema_version`과 `error_line`은 디버깅용이므로 보고서에서 필요해질 때만 추가한다. 사용자 정의 정의는
등록 이후 수집되는 데이터부터 보고서에서 사용할 수 있다.

같은 화면에서 **사용자 정의 측정항목 만들기**를 선택하고 이벤트 범위의 `Web vital value`
측정항목을 이벤트 매개변수 `metric_value`, 측정 단위 `Standard`로 등록한다.

## 핵심 이벤트와 보고서

우선 `resume_download`, `contact_click`, `project_open`, `comments_load`를 핵심 이벤트 후보로
사용한다. GA4 **관리 > 데이터 표시 > 이벤트**에서 실제 이벤트가 들어온 것을 확인한 다음,
사이트 목표에 맞는 이벤트만 핵심 이벤트로 표시한다.

탐색 보고서는 다음 순서로 만들면 유용하다.

1. 글별 몰입도: 행 `Content ID`, 열 `Event name`, 값 `Event count`
2. 글 완독률: `article_progress`만 필터링하고 `Article progress`별 사용자 수 비교
3. 실제 읽기 시간: `article_read_time`만 필터링하고 `Article read seconds`별 사용자 수 비교
4. 링크 성과: 행 `Link area`, `Link ID`, 값 `Event count`
5. 이동 흐름: `article_open` → `article_progress` 50 → `article_progress` 90 → `article_navigation`
6. 카드 클릭률: `article_open` 사용자 수 ÷ `article_impression` 사용자 수
7. 구간별 이탈: `article_section_view`를 `Section index` 순서로 비교
8. 페이지 품질: `metric_name`별 `metric_value`의 75번째 백분위수와 `metric_rating` 비교
9. 오류 페이지: `page_not_found`와 `client_error`를 페이지 경로·기기별로 비교

GA4 실시간/DebugView에서는 이벤트 도착을 먼저 확인하고, 일반 보고서와 사용자 정의
측정기준에는 처리 시간이 걸릴 수 있다는 점을 감안한다.
