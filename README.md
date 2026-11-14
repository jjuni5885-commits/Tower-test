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

## 고치는 방법 (Claude에게 맡길 때)

1. 고칠 내용은 `src/` 안의 파일을 고칩니다. 빌드본(`index.html`)을 직접 고치지 않습니다.
2. 빌드: 해당 게임 폴더의 `src`에서 `node tools/build.js` → `out/index.html`이 생김
3. 시험: `src/tools/README.txt`와 `src/docs/*.md`의 시험 명령을 돌림
4. `out/index.html`을 게임 폴더의 `index.html`로 덮어쓰고 커밋. 1~2분 뒤 같은 링크에 반영됨
5. 커밋 메시지에 버전과 바뀐 점을 적음(예: `타임플렉스 v1.3: 원화 16종 추가`)

## 지켜야 할 것

- 서명 키(.jks)와 비밀번호는 절대 올리지 않습니다. 이 저장소는 공개입니다.
- 제미나이로 만든 원화 원본은 `타임플렉스_적_<적키>.png` 이름 규칙을 따릅니다.
- 진행 기록은 브라우저 localStorage(타임플렉스 `timeflex.v1`, 타워플렉스 `ironhold.v1`)에 있으므로 저장 키를 바꾸면 지인들 진행이 사라집니다.

## 버전

- 타임플렉스 v1.2 (2026-11-14): 적 원화 14종, 중반 이후 난이도 상향
- 타워플렉스 v2.3 (2026-11-14)
