# 타워 디펜스 테스트 (Tower-test)

지인 테스트용 저장소입니다. GitHub Pages로 바로 플레이할 수 있습니다.

- 첫 화면: https://jjuni5885-commits.github.io/Tower-test/
- 타임플렉스: https://jjuni5885-commits.github.io/Tower-test/timeflex/
- 타워플렉스: https://jjuni5885-commits.github.io/Tower-test/towerflex/

## 폴더

| 경로 | 내용 |
|---|---|
| `index.html` | 첫 화면(게임 고르기) |
| `timeflex/index.html` | 타임플렉스: 시간 전쟁 빌드본(한 파일). Pages가 이 파일을 보여 줌 |
| `timeflex/src/` | 타임플렉스 원본 소스. 개발 메모는 `src/docs/TIMEFLEX.md`, 엔진은 `src/docs/ENGINE.md` |
| `towerflex/index.html` | 타워플렉스: 차원전쟁 빌드본(한 파일) |
| `towerflex/src/` | 타워플렉스 원본 소스. 난이도 기록은 `src/docs/BALANCE.md` |

## 앱처럼 열기

- 각 게임 폴더의 `manifest.webmanifest`, `sw.js`, `icon-192.png`, `icon-512.png`가 크롬 '홈 화면에 추가'(전체 화면 앱)를 담당합니다. `src/template.html` 머리에 연결 줄이 들어 있어 다시 빌드해도 유지됩니다.
- 모든 페이지 맨 앞의 짧은 스크립트가 카카오톡 등 앱 안 브라우저에서 열리면 크롬(외부 브라우저)으로 다시 엽니다.

## 고치는 방법 (Claude가 직접 고쳐 올림)

1. 고칠 내용은 `timeflex/src/` 안의 파일을 고칩니다. 빌드본(`timeflex/index.html`)을 직접 고치지 않습니다.
2. 빌드: `cd timeflex/src && node tools/build.js` → `timeflex/out/index.html`(커밋하지 않음). 글꼴은 `src/font.css`(잘라 둔 것). 새 한글 글자를 넣었으면 글꼴을 다시 잘라 `src/font.css`를 바꿈(`tools/font_subset.py.txt`, npm @fontsource 필요)
3. 시험: `src/tools/README.txt`의 시험 명령(checkmaps, balprof, touchflow 등)
4. `timeflex/out/index.html`을 `timeflex/index.html`로 덮어쓰고 커밋, 푸시. 1~2분 뒤 같은 링크에 반영됨
5. 커밋 메시지에 버전과 바뀐 점을 적음(예: `타임플렉스 v1.5: 처치 효과 정리`)
6. 안드로이드 APK가 필요할 때만 Claude 작업 공간에서 서명해 따로 보냄(키는 이 저장소에 없음)

## 지켜야 할 것

- 서명 키(.jks)와 비밀번호는 절대 올리지 않습니다. 이 저장소는 공개입니다.
- 제미나이로 만든 원화 원본은 `타임플렉스_적_<적키>.png` 이름 규칙을 따릅니다.
- 진행 기록은 브라우저 localStorage(타임플렉스 `timeflex.v1`, 타워플렉스 `ironhold.v1`)에 있으므로 저장 키를 바꾸면 지인들 진행이 사라집니다.

## 버전

- 타임플렉스 v1.4 (2026-11-14): 15장 전체 적(약 140종, 탈것, 배, 하늘, 괴물 포함)을 같은 화풍으로, 처치 효과와 콤보 글자를 시대풍으로, 편성은 그 시대 이하 무기만(다른 시대 무기 고르기 모드), 관리자 모드 전체 탑
- 타임플렉스 v1.3 (2026-11-14): 적 60종을 탑, 맵과 같은 화풍의 코드 그림으로 새로 그림(앞/뒤/옆, 무릎 굽혀 걷기). 제미나이 원화는 꺼 둠
- 타임플렉스 v1.2 (2026-11-14): 적 원화 14종, 중반 이후 난이도 상향
- 타워플렉스 v2.3.1 (2026-11-14): 좁은 폰에서 웨이브 미리보기 칩 잘림, 모든 능력 카드에 붙던 조합! 배지 수정
