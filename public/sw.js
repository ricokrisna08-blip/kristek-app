// Service worker khusus buat nampilin push notification di tray browser.
// Di-copy apa adanya ke dist/sw.js oleh Metro web export, di-serve di
// path /sw.js -- lihat src/notifikasi/registerWebPush.ts yang register
// file ini.

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "KRISTEK", body: event.data.text() };
  }

  const title = payload.title || "KRISTEK";
  const options = {
    body: payload.body || "",
    data: payload.data || {},
    icon: "/favicon.ico",
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow("/");
    })
  );
});
