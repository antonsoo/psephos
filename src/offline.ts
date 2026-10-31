export function installOffline(status: HTMLElement, portableCopy = "court record"): void {
  if (import.meta.env.DEV) {
    status.textContent = "Offline installation is available in the production build.";
    return;
  }
  if (!("serviceWorker" in navigator)) {
    status.textContent = `This browser cannot install an offline edition. Save ${portableCopy === "court record" ? "a" : "an"} ${portableCopy} to read offline.`;
    return;
  }
  const expected = document.querySelector<HTMLMetaElement>('meta[name="psephos-edition"]')?.content;
  let request = 0;
  const updateNotice = document.createElement("p");
  updateNotice.id = "edition-update";
  updateNotice.className = "small";
  updateNotice.hidden = true;
  status.after(updateNotice);
  const waitingMessage = `A newer Psephos edition is ready. Save an editable copy of your work, then close all Psephos tabs and reopen the workshop to use it. Reloading one open tab can keep the earlier edition active.`;
  function showUpdate(waiting: boolean): void {
    updateNotice.hidden = !waiting;
    updateNotice.textContent = waiting ? waitingMessage : "";
  }
  async function inspect(): Promise<void> {
    const id = ++request;
    const controller = navigator.serviceWorker.controller;
    if (!controller) {
      status.textContent = "Preparing this edition for offline reading…";
      return;
    }
    status.textContent = "Checking this edition’s offline files…";
    const channel = new MessageChannel();
    const timeout = window.setTimeout(() => {
      channel.port1.close();
      if (id === request)
        status.textContent = `Offline availability could not be confirmed. Save ${portableCopy === "court record" ? "a" : "an"} ${portableCopy} for a portable copy.`;
    }, 12_000);
    channel.port1.onmessage = (event: MessageEvent<unknown>) => {
      clearTimeout(timeout);
      channel.port1.close();
      if (id !== request || controller !== navigator.serviceWorker.controller) return;
      const value = event.data as { edition?: unknown; complete?: unknown; files?: unknown } | null;
      status.textContent =
        value?.edition === expected && value?.complete === true
          ? "This edition is available offline, including every source page."
          : `This edition is not fully available offline. Connect and reload, or save ${portableCopy === "court record" ? "a" : "an"} ${portableCopy}.`;
    };
    controller.postMessage({ type: "inventory", repair: navigator.onLine }, [channel.port2]);
  }
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    void inspect();
  });
  navigator.serviceWorker.addEventListener("message", (event: MessageEvent<unknown>) => {
    if (event.source !== navigator.serviceWorker.controller) return;
    const value = event.data as { type?: unknown; edition?: unknown } | null;
    if (
      (value?.type === "inventory-invalidated" || value?.type === "inventory-restored") &&
      value.edition === expected
    )
      void inspect();
  });
  window.addEventListener("psephos:asset-failure", () => {
    void inspect();
  });
  window.addEventListener("online", () => {
    void inspect();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void inspect();
  });
  void navigator.serviceWorker
    .register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL })
    .then((registration) => {
      showUpdate(!!registration.waiting && !!navigator.serviceWorker.controller);
      const watched = new WeakSet<ServiceWorker>();
      function watch(worker: ServiceWorker | null): void {
        if (!worker || watched.has(worker)) return;
        watched.add(worker);
        worker.addEventListener("statechange", () => {
          const hasUpdate =
            !!navigator.serviceWorker.controller &&
            (worker.state === "installed" || !!registration.waiting);
          showUpdate(hasUpdate);
          if (worker.state === "redundant" && !navigator.serviceWorker.controller) {
            ++request;
            status.textContent = `Offline installation did not complete. Reconnect and reload to try again, or save ${portableCopy === "court record" ? "a" : "an"} ${portableCopy}.`;
          } else void inspect();
        });
      }
      registration.addEventListener("updatefound", () => {
        watch(registration.installing);
      });
      // The first updatefound event can precede register() resolving.
      watch(registration.installing);
      return inspect();
    })
    .catch(() => {
      status.textContent = `Offline installation did not complete. The ${portableCopy} is a separate portable copy.`;
    });
}
