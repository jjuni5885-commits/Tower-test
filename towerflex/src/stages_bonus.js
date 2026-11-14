// ===== stages_bonus.js : 보너스 칸 12개 (자료만. 화면과 놀이는 bonus.js) =====
// 챕터마다 3, 6, 9판 뒤. game: 'gallery' 황금 과녁 사격 | 'memory' 탑 카드 짝 맞추기 | 'catch' 금화 받기
// lv(1~4)는 챕터가 갈수록 조금씩 빨라지고 까다로워지는 정도. 지도는 bnOpen(node)으로 열고 bnState(id)로 완료 표시를 읽는다
var BONUS_NODES = [
  { id: 'c1b1', ch: 1, after: 3, game: 'gallery', lv: 1, name: '말랑 사격장' },
  { id: 'c1b2', ch: 1, after: 6, game: 'memory', lv: 1, name: '탑 카드 놀이' },
  { id: 'c1b3', ch: 1, after: 9, game: 'catch', lv: 1, name: '금화 소나기' },
  { id: 'c2b1', ch: 2, after: 3, game: 'catch', lv: 2, name: '달밤의 금화' },
  { id: 'c2b2', ch: 2, after: 6, game: 'gallery', lv: 2, name: '호박등 사격장' },
  { id: 'c2b3', ch: 2, after: 9, game: 'memory', lv: 2, name: '어둠 속 카드' },
  { id: 'c3b1', ch: 3, after: 3, game: 'memory', lv: 3, name: '작전 카드' },
  { id: 'c3b2', ch: 3, after: 6, game: 'catch', lv: 3, name: '보급품 낙하' },
  { id: 'c3b3', ch: 3, after: 9, game: 'gallery', lv: 3, name: '사격 훈련장' },
  { id: 'c4b1', ch: 4, after: 3, game: 'gallery', lv: 4, name: '도깨비 과녁' },
  { id: 'c4b2', ch: 4, after: 6, game: 'catch', lv: 4, name: '엽전 받기' },
  { id: 'c4b3', ch: 4, after: 9, game: 'memory', lv: 4, name: '단청 카드 놀이' }
];
