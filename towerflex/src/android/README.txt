타워플렉스: 차원전쟁 안드로이드 앱(APK) 만들기 (v2.1부터, 옛 이름 철옹성, 최후의 화살 귀염판)
- 구조: 게임 한 파일(out/index.html)을 assets/index.html로 넣고, MainActivity가 전체 화면 WebView로 띄움(file:///android_asset/index.html)
- 패키지 kr.towerflex.game (v2.1에서 새 키, 새 패키지. 옛 kr.lastarrow.cute와 따로 설치됨), 최소 안드로이드 7(SDK 24), 대상 SDK 34, 세로 고정, 화면 꺼짐 방지, 진동 권한, 몰입 모드
- 앱 이름은 res/values-*/strings.xml (13개 언어)
- 뒤로 가기: window.__appBack()에 먼저 물어 창 닫기, 탑 칸 닫기, 전투 중 일시 정지. 더 닫을 게 없으면 앱을 뒤로 보냄
- 앱이 뒤로 갈 때 window.__appPause(), 돌아오면 window.__appResume()
- 진행 기록은 WebView localStorage. 같은 서명 키로 만든 새 APK는 덮어 설치되고 기록이 남음
1. 도구: apt-get install aapt apksigner zipalign dalvik-exchange android-sdk-platform-23 (JDK 필요)
2. 서명 키: keystore/towerflex.jks (별칭 towerflex). 아티팩트와 프로젝트 문서에는 올리지 않음. 사용자가 보관한 파일을 받아 이 자리에 둘 것. 키를 잃으면 새 패키지로만 낼 수 있음
3. 빌드: KS_PASS=비밀번호 VC=8 VN=2.2 ./build.sh ../out/index.html → build/towerflex.apk (버전 코드는 올릴 때마다 +1, v2.1은 7)
4. 확인: build.sh 끝에서 apksigner verify, aapt dump badging, unzip -v 로 resources.arsc가 Stored인지
