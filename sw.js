// SSNPS POLICE APP PRO - Service Worker V3 - OFFLINE READY
const CACHE_NAME = 'ssnps-v3-case-module';
const CORE_FILES = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-512.png'
];

// OPTIONAL - لو عندك الكتب ارفعهم في مجلد books/
const BOOKS_FILES = [
  './books/2060.pdf',
  './books/2008.pdf',
  './books/2015.pdf',
  './books/2018.pdf'
];

// تثبيت - يحفظ الملفات الأساسية
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Caching core files');
      // نحاول نحفظ الأساسي، الكتب لو ما موجودة ما يفشل التثبيت
      return cache.addAll(CORE_FILES).then(() => {
        // حاول تحفظ الكتب لكن لو فشلت ما مشكلة
        BOOKS_FILES.forEach(file => {
          cache.add(file).catch(() => console.log('Book not found yet:', file));
        });
      });
    })
  );
  self.skipWaiting();
});

// تفعيل - يمسح الكاش القديم
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// جلب - استراتيجية OFFLINE FIRST
self.addEventListener('fetch', event => {
  const req = event.request;
  
  // ما نكاش للـ POST (حفظ النتائج بكون في localStorage)
  if (req.method !== 'GET') return;

  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) {
        return cached; // رجع من الكاش لو موجود
      }
      // لو ما في الكاش، جيبو من النت واحفظو
      return fetch(req).then(response => {
        // احفظ نسخة للكاش للمرة الجاية
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
        }
        return response;
      }).catch(() => {
        // لو ماف نت وماف كاش - صفحة طوارئ
        if (req.destination === 'document') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
