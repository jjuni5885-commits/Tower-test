// 앱처럼 설치되게 하는 최소 서비스 워커. 새 버전이 올라오면 바로 받고, 인터넷이 끊기면 마지막 받은 판을 씀
var C='timeflex-v14';
self.addEventListener('install',function(e){self.skipWaiting();});
self.addEventListener('activate',function(e){e.waitUntil(self.clients.claim());});
self.addEventListener('fetch',function(e){
  if(e.request.method!=='GET')return;
  e.respondWith(fetch(e.request).then(function(r){var c=r.clone();caches.open(C).then(function(k){k.put(e.request,c);});return r;}).catch(function(){return caches.match(e.request);}));
});
