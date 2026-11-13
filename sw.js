/* Essencia Agenda: abre sin conexión. Página: primero internet (3 s), si falla usa la copia guardada. */
var CACHE = "essencia-v4";
var FILES = ["./", "./index.html", "./hark.css", "./hark.js", "./logo_essencia_hd.jpg", "./essencia_icon_512.jpg"];
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
function guardar(req, res) { if (res && res.ok) { var copia = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copia); }); } return res; }
self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === "navigate") {
    e.respondWith(new Promise(function (ok) {
      var listo = false;
      var t = setTimeout(function () { caches.match("./index.html").then(function (r) { if (r && !listo) { listo = true; ok(r); } }); }, 3000);
      fetch(req, { cache: "no-store" }).then(function (r) {
        guardar("./index.html", r.clone ? r.clone() : r);
        if (!listo) { listo = true; clearTimeout(t); ok(r); }
      }).catch(function () {
        clearTimeout(t);
        caches.match("./index.html").then(function (r) { if (!listo) { listo = true; ok(r || new Response("Sin conexión", { status: 503 })); } });
      });
    }));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(function (hit) {
    var red = fetch(req).then(function (r) { return guardar(req, r); }).catch(function () { return hit; });
    return hit || red;
  }));
});
