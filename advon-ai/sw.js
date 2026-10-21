/* Advon AI — service worker: shows reminder notifications even when the app is closed. */
self.addEventListener('install', function(e){ self.skipWaiting(); });
self.addEventListener('activate', function(e){ e.waitUntil(self.clients.claim()); });
self.addEventListener('push', function(e){
  var d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { title: 'Advon AI', body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Advon AI', {
    body: d.body || '', icon: 'icon-192.png', badge: 'badge-72.png', tag: d.tag || undefined, renotify: !!d.tag,
    data: { url: d.url || './#today' }
  }));
});
self.addEventListener('notificationclick', function(e){
  e.notification.close();
  var url = new URL((e.notification.data && e.notification.data.url) || './#today', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(ws){
    for (var i = 0; i < ws.length; i++) { if (ws[i].url.indexOf(self.registration.scope) === 0) { ws[i].focus(); return ws[i].navigate(url); } }
    return self.clients.openWindow(url);
  }));
});
