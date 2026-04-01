// 考研打卡助手 - Service Worker
const CACHE_NAME = 'kaoyan-tracker-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/app.js',
  '/js/storage.js',
  '/js/charts.js',
  '/manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// 安装Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// 激活Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 拦截请求
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 如果在缓存中找到，返回缓存
        if (response) {
          return response;
        }
        
        // 否则从网络获取
        return fetch(event.request).then(response => {
        // 检查是否有效响应（允许 cors 和 basic 类型）
        if (!response || response.status !== 200) {
            return response;
          }
          
          // 克隆响应
          const responseToCache = response.clone();
          
          // 将新资源添加到缓存
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        });
      })
      .catch(() => {
        // 如果网络失败，可以返回一个离线页面
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
      })
  );
});

// 处理推送通知
self.addEventListener('push', event => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body || '学习时间到啦！快来打卡记录吧～',
    icon: 'icons/icon-192x192.png',
    badge: 'icons/icon-96x96.png',
    tag: 'study-reminder',
    renotify: true,
    actions: [
      {
        action: 'punch',
        title: '立即打卡'
      },
      {
        action: 'snooze',
        title: '稍后提醒'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || '考研打卡提醒', options)
  );
});

// 处理通知点击
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'punch') {
    // 点击"立即打卡"，打开应用
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'snooze') {
    // 点击"稍后提醒"，可以设置延迟提醒
    console.log('稍后提醒');
  } else {
    // 点击通知本身
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// 处理通知关闭
self.addEventListener('notificationclose', event => {
  console.log('通知被关闭');
});