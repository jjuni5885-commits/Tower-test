타임플렉스 안드로이드 앱(APK) 만들기 (v0.4부터, 타워플렉스 android 틀을 그대로 가져옴)
- 구조: 게임 한 파일(out/index.html)을 assets/index.html로 넣고, MainActivity가 전체 화면 WebView로 띄움
- 패키지 kr.timeflex.game (타워플렉스와 따로 설치됨), 최소 안드로이드 7(SDK 24), 대상 SDK 34, 세로 고정
- 앱 이름: res/values/strings.xml 타임플렉스, values-en TimeFlex. 아이콘은 tools/tficon.py가 그림(돌 고리 시간의 문)
- 진행 기록은 WebView localStorage. 같은 서명 키로 만든 새 APK는 덮어 설치되고 기록이 남음
1. 도구: apt-get install aapt apksigner zipalign dalvik-exchange android-sdk-platform-23 (JDK 필요)
2. 서명 키: keystore/timeflex.jks (별칭 timeflex). 아티팩트와 프로젝트 문서에는 올리지 않음. 사용자가 보관한 파일과 비밀번호를 받아 이 자리에 둘 것
3. 빌드: KS_PASS=비밀번호 VC=1 VN=0.4 ./build.sh ../out/index.html → build/timeflex.apk (버전 코드는 올릴 때마다 +1)
