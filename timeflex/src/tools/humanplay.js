// 사람 흉내 판 시험: node tools/humanplay.js 판id 난이도 "탑,열,행;탑,열,행;..." [편성 탑들]
// 정한 칸에 차례로 세우고(금화가 될 때), 다 세우면 가장 낮은 단계 탑부터 강화. 능력 카드와 웨이브 시작은 봇이 맡음(봇은 탑을 세우지 않음)
const vm = require('vm'); const ctx = require('./fdload.js')();
const [id, dk = 'normal', plan = '', loadArg = ''] = process.argv.slice(2);
ctx.__h = { id, dk, plan, load: loadArg };
console.log(vm.runInContext(`(function(){ var A=__h, mi=-1; MAPS.forEach(function(M,i){ if(M.id===A.id) mi=i; });
  var P=A.plan.split(';').filter(Boolean).map(function(s){ var p=s.split(','); return { k:p[0], c:+p[1], r:+p[2] }; });
  var load=A.load ? A.load.split(',') : P.map(function(p){return p.k}).filter(function(k,i,a){return a.indexOf(k)===i});
  var g=newGame(mi,A.dk,{research:{},skills:{rain:1,wall:1,last:1},maxLv:5,cards:true,towers:load,towerStar:{},fuse:0});
  var B=makeBot(g,{skill:1,seed:5,allowed:[]}), pi=0, steps=0, mine=[], leaks={}, fail=[];
  while(!g.over && steps<60*60*50){
    if(pi<P.length){ var p=P[pi]; if(g.gold>=towerCost(g,p.k,0)){ var t=buildTower(g,p.k,p.c,p.r); if(t) mine.push(t); else fail.push(p.k+'@'+p.c+','+p.r); pi++; } }
    else { var lo=null; mine.forEach(function(t){ if(t.lvl<5 && (!lo||t.lvl<lo.lvl)) lo=t; }); if(lo){ var g0=g.gold; upgradeTower(g,lo,steps%2); } }
    botTick(B,DT); stepGame(g,DT); steps++;
    for(var q=0;q<g.ev.length;q++){ var ev=g.ev[q]; if(ev.t==='leak'&&!ev._c){ ev._c=1; leaks[ev.k+'@'+g.wave]=(leaks[ev.k+'@'+g.wave]||0)+1; } }
  }
  return A.id+' '+A.dk+' '+(g.over===1?'WIN '+starsOf(g)+'*':'LOSE')+' lives '+g.lives+'/'+g.maxLives+' wave '+g.wave+'/'+g.N+' towers '+mine.map(function(t){return t.k+t.lvl}).join(' ')+(fail.length?' FAIL '+fail.join(' '):'')+' leaks '+JSON.stringify(leaks);
})()`, ctx));
