self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = { title: event.data.text(), body: 'Você tem uma nova mensagem.' };
  }

  const showNotification = async () => {
    await new Promise(resolve => setTimeout(resolve, 5000));

    const windowClients = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    });

    let clientIsFocused = false;

    for (const client of windowClients) {
      if (client.focused || client.visibilityState === 'visible') {
        clientIsFocused = true;
        break;
      }
    }

    if (!clientIsFocused) {
      const title = data.title || 'CMSO360';
      const options = {
        body: data.body || 'Você tem uma atualização importante.',
        icon: data.icon || '/images/favicon-16x16.png',
        badge: '/images/favicon-16x16.png',
        actions: data.actions || [{ action: 'open', title: 'Abrir' }],
        data: data,
      };

      return self.registration.showNotification(title, options);
    }

    return Promise.resolve();
  };

  event.waitUntil(showNotification());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const url = data.actionUrl || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus().then((c) => {
              if (url && c.url !== url) {
                c.navigate(url);
              }
              return c;
            });
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      })
  );
});
