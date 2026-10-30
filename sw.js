/* Generated from the complete production edition. */
const EDITION = "80a1776f6e15df80ae5d";
const CACHE = 'psephos-' + EDITION;
const FILES = [{"url":"/psephos/assets/index-C_P7tt-5.js","hash":"87262c7fd8afb8d27e7ef94c7e5442ce453ce63af0f00fb92a94fe8762bcde08","bytes":58788},{"url":"/psephos/assets/index-Dk6HhNuE.css","hash":"7c600bc0a1c767ba9cd8bd43f277740f7afc32bb1d5de29772fc5f3a22d85ea0","bytes":14635},{"url":"/psephos/favicon.svg","hash":"7bdcefd50abdaa41d4b05a497420be430c31b67df2cc01b23727ce1b2d40c74c","bytes":291},{"url":"/psephos/fonts/literata-OFL.txt","hash":"8742963604cd89dc81437811a850018fc03b2bfad686d7422c8235967c87614e","bytes":4389},{"url":"/psephos/fonts/literata.woff2","hash":"99efd2b91637e922059a38d459abeceade161dc868b47318fa3b9c99137293db","bytes":396664},{"url":"/psephos/fonts/provenance.json","hash":"a33529cd8d64a41671cbfa367a56f0180d399810f3434f8c00b6e0e07e3115a2","bytes":637},{"url":"/psephos/fonts/sourcesans3-OFL.txt","hash":"ed86f375d70bd39238d13b2ba5bd3bed20b3fe4847fa1356a63f380d2b26a8a5","bytes":4486},{"url":"/psephos/fonts/sourcesans3.woff2","hash":"5f16566f7a40d39b339ad26be151fa5a1ab1f0c2574c7a2e619765584a1acbd8","bytes":170188},{"url":"/psephos/index.html","hash":"3268db75473b56f38f052c0c409db9da29866fa62d8f785c35e5ba659bf226e5","bytes":16345},{"url":"/psephos/LICENSE.txt","hash":"62145e70388e9be739b404f904df6434bacaa748c9b5875c146791457fb83b81","bytes":1071},{"url":"/psephos/sources/agora-ballots.jpg","hash":"89d926d1e094338f1bdd20234973548fd2f995ef26463cb11550417cda148df3","bytes":172863},{"url":"/psephos/sources/CC-BY-SA-4.0.txt","hash":"28a9529c7d0bb4dc51f4bf5c116a3d16ef247a052f7591466768ddf563fd1cf5","bytes":20138},{"url":"/psephos/sources/kenyon-imprint.jpg","hash":"96f51e16079965e31b99add41a6b71c3e28c32c279b5d34cced161b15ec65d2f","bytes":204830},{"url":"/psephos/sources/kenyon-p67.jpg","hash":"a0041cfca79448bf40204d66308c73e5dbb5aa51a7ce186894b9f4114963bc71","bytes":823814},{"url":"/psephos/sources/kenyon-p68.jpg","hash":"459982e373f32e0e9fe0c4068d352dc593a05aba533262b58dc3255c75eda300","bytes":887885},{"url":"/psephos/sources/kenyon-title.jpg","hash":"155e06a7ebf0670c3a7d8f8a998e33b9143bdc994c4aa693a8a11fbb6e1ecb86","bytes":214963},{"url":"/psephos/sources/manifest.json","hash":"b0db5528eb81c924b26ee6f64fa481382eefe3ad6d32332fa6537ca7cb735325","bytes":2751},{"url":"/psephos/sources/NOTICE.txt","hash":"907edba211d28b9a62599348b6545bda51f7d4f811fda1174be4261944914613","bytes":3791},{"url":"/psephos/sources/perseus-grc2.xml","hash":"6e0c298a511e05d9e287860f1c98344f4c409ed5f6f18e8c9ef0cb6974ae8e1a","bytes":264047},{"url":"/psephos/sources/provenance.json","hash":"ca7ab5cbb5e0d3307c068b3ecdc4cbf5ecf9c4be162ff4d0bbdc5613646e8b79","bytes":3765}];
const allowed = new Map(FILES.map(file => [new URL(file.url, self.location.origin).href, file]));
const digest = async bytes => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), b => b.toString(16).padStart(2, '0')).join('');
async function invalidateClients() {
  const pages = await self.clients.matchAll({type:'window'});
  for (const page of pages) page.postMessage({type:'inventory-invalidated',edition:EDITION});
}
async function matches(response, file) {
  if (!response || !response.ok) return false;
  const bytes = await response.arrayBuffer();
  return bytes.byteLength === file.bytes && await digest(bytes) === file.hash;
}
async function fetchEdition(file) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(file.url, {cache:'reload', signal:controller.signal});
    if (!await matches(response.clone(), file)) throw new Error('Edition mismatch: ' + file.url);
    return response;
  } finally {clearTimeout(timeout);}
}
self.addEventListener('install', event => event.waitUntil((async () => {
  const cache = await caches.open(CACHE);
  try {
    for (const file of FILES) {
      const response = await fetchEdition(file);
      await cache.put(file.url, response);
    }
  } catch (error) { await caches.delete(CACHE); throw error; }
})()));
self.addEventListener('activate', event => event.waitUntil((async () => {
  for (const name of await caches.keys()) if (name.startsWith('psephos-') && name !== CACHE) await caches.delete(name);
  await self.clients.claim();
})()));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname === '/psephos/') url.pathname += 'index.html';
  url.search = ''; url.hash = '';
  const file = allowed.get(url.href);
  if (!file) return;
  event.respondWith((async () => {
    const saved = await caches.match(url.href, {cacheName:CACHE});
    if (saved && await matches(saved.clone(), file)) return saved;
    await invalidateClients();
    try {
      const response = await fetchEdition(file);
      try {await (await caches.open(CACHE)).put(file.url, response.clone());}
      catch {} // A connected read can succeed without claiming offline retention.
      return response;
    } catch {
      return new Response('This file is unavailable for the current Psephos edition. Reconnect and reopen the workshop.', {status:503, headers:{'Content-Type':'text/plain;charset=utf-8'}});
    }
  })());
});
self.addEventListener('message', event => {
  if (event.data?.type !== 'inventory' || !event.ports[0]) return;
  event.waitUntil((async () => {
    let complete = true;
    for (const file of FILES) {
      if (!await matches(await caches.match(file.url, {cacheName:CACHE}), file)) {
        if (event.data.repair !== true) {complete = false; break;}
        const response = await fetchEdition(file);
        await (await caches.open(CACHE)).put(file.url, response);
      }
    }
    event.ports[0].postMessage({edition:EDITION, complete, files:FILES.length});
  })().catch(() => event.ports[0].postMessage({edition:EDITION,complete:false})));
});
