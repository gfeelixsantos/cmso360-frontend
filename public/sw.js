const CACHE_NAME = "cmso360-pwa-v3";

const STATIC_ASSETS = [
  "/",
  "/images/android-chrome-192x192.png",
  "/images/android-chrome-512x512.png",
  "/images/favicon.ico",
];

// ============================================================
// PWA: Install - cache assets estáticos
// ============================================================
self.addEventListener("install", (event) => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => undefined);
    }),
  );
});

// ============================================================
// PWA: Activate - limpar caches antigos
// ============================================================
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// ============================================================
// PWA: Fetch - network-first com fallback seguro
// ============================================================
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Ignorar métodos não-GET
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  // Ignorar origens externas
  if (url.origin !== self.location.origin) {
    return;
  }

  // Ignorar APIs, HMR e manifest
  if (
    url.pathname.startsWith("/api") ||
    url.pathname.startsWith("/_next/webpack-hmr") ||
    url.pathname === "/manifest.webmanifest"
  ) {
    return;
  }

  // Network-first com fallback para cache
  event.respondWith(
    (async () => {
      try {
        // Tenta buscar da rede primeiro
        const networkResponse = await fetch(request);
        return networkResponse;
      } catch {
        // Se falhar, tenta servir do cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }
        // Se não está no cache, retorna erro básico
        return new Response("Offline", {
          status: 503,
          statusText: "Service Unavailable",
        });
      }
    })(),
  );
});

// ============================================================
// PUSH: Notificações Web Push
// ============================================================
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data.json();
  } catch (e) {
    data = { title: event.data.text(), body: "Você tem uma nova mensagem." };
  }

  const notificationPayload = {
    id: data.id || crypto.randomUUID(),
    title: data.title || "CMSO 360",
    message: data.body || "Você tem uma nova mensagem.",
    type: data.type || "info",
    actionUrl: data.actionUrl || "/dashboard",
    actionLabel: data.actionLabel || "Abrir",
    metadata: data.metadata || {},
    createdAt: new Date().toISOString(),
    date: new Date().toLocaleString("pt-BR"),
    read: false,
    dedupeKey: data.dedupeKey,
  };

  const showNotification = async () => {
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const windowClients = await self.clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    });

    let clientIsFocused = false;
    for (const client of windowClients) {
      if (client.focused || client.visibilityState === "visible") {
        clientIsFocused = true;
      }
    }

    if (!clientIsFocused) {
      const title = notificationPayload.title;
      const options = {
        body: notificationPayload.message,
        icon: data.icon || "/images/android-chrome-192x192.png",
        data: {
          actionUrl: notificationPayload.actionUrl,
        },
        actions: data.actions || [
          { action: "close-action", title: "Fechar" },
        ],
      };

      return self.registration.showNotification(title, options);
    }

    console.log("[SW] Aplicação ativa. Notificação silenciada.");
    return Promise.resolve();
  };

  const notifyClients = async () => {
    const windowClients = await self.clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    });

    await Promise.all(
      windowClients.map((client) =>
        client.postMessage({
          type: "app-notification",
          notification: notificationPayload,
        }),
      ),
    );
  };

  event.waitUntil(Promise.all([notifyClients(), showNotification()]));
});

// ============================================================
// PUSH: Click na notificação - focar/abrir app
// ============================================================
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        const targetUrl =
          event.notification?.data?.actionUrl ||
          "/";
        const isExternalTarget = /^https?:\/\//i.test(targetUrl);

        if (!isExternalTarget && clients.length > 0) {
          const client = clients[0];
          if ("navigate" in client) {
            return client.navigate(targetUrl).then(() => client.focus());
          }
          if ("focus" in client) {
            return client.focus();
          }
        }

        return self.clients.openWindow(targetUrl);
      }),
  );
});
