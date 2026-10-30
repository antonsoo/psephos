import manifest from "./asset-manifest.json";

export const assets = manifest;
export type Asset = (typeof assets)[number];

export function asset(path: string): Asset {
  const found = assets.find((item) => item.path === path);
  if (!found) throw new Error(`Unknown retained file: ${path}`);
  return found;
}

async function editionCache(item: Asset): Promise<Response | undefined> {
  const edition = document.querySelector<HTMLMetaElement>('meta[name="psephos-edition"]')?.content;
  if (!edition || !/^[a-f0-9]{20}$/.test(edition) || !("caches" in window)) return;
  try {
    return await caches.match(new URL(`${import.meta.env.BASE_URL}${item.path}`, location.href), {
      cacheName: `psephos-${edition}`,
    });
  } catch {
    return;
  }
}

export async function verifiedBytes(item: Asset, signal?: AbortSignal): Promise<ArrayBuffer> {
  try {
    return await readVerifiedBytes(item, signal);
  } catch (error) {
    // Explicit offline reads can bypass the worker, notably in Firefox. An
    // integrity failure must also invalidate the page's earlier readiness claim.
    if (!signal?.aborted) window.dispatchEvent(new Event("psephos:asset-failure"));
    throw error;
  }
}

async function readVerifiedBytes(item: Asset, signal?: AbortSignal): Promise<ArrayBuffer> {
  const controller = new AbortController();
  const cancel = () => controller.abort(signal?.reason);
  if (signal?.aborted) cancel();
  else signal?.addEventListener("abort", cancel, { once: true });
  const timer = setTimeout(
    () => controller.abort(new DOMException("Source request timed out", "TimeoutError")),
    20_000,
  );
  let response: Response;
  let bytes: ArrayBuffer;
  try {
    // Firefox can reject a no-store fetch before the worker sees it when the
    // browser is explicitly offline. Read only this document's named edition;
    // the ordinary length/hash checks below still apply to every cached byte.
    const cached = !navigator.onLine ? await editionCache(item) : undefined;
    controller.signal.throwIfAborted();
    if (cached) response = cached;
    else {
      try {
        response = await fetch(`${import.meta.env.BASE_URL}${item.path}`, {
          cache: "no-store",
          signal: controller.signal,
        });
      } catch (error) {
        controller.signal.throwIfAborted();
        const fallback = await editionCache(item);
        if (!fallback) throw error;
        response = fallback;
      }
    }
    bytes = await response.arrayBuffer();
  } catch (error) {
    if (
      controller.signal.reason instanceof DOMException &&
      controller.signal.reason.name === "TimeoutError"
    ) {
      throw new Error(
        `Loading ${item.path} took too long. Check the connection and try again; your case has been kept.`,
      );
    }
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", cancel);
  }
  if (!response.ok)
    throw new Error(
      `Could not load ${item.path} (HTTP ${response.status}). Try again when the file is available.`,
    );
  if (bytes.byteLength !== item.bytes)
    throw new Error(
      `The downloaded ${item.path} does not match this edition. Reload the page before trying again.`,
    );
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  if (hash !== item.sha256)
    throw new Error(
      `The downloaded ${item.path} failed its source check. No substituted file will be used.`,
    );
  return bytes;
}

export async function dataUrl(item: Asset, signal?: AbortSignal): Promise<string> {
  const bytes = new Uint8Array(await verifiedBytes(item, signal));
  let binary = "";
  for (let i = 0; i < bytes.length; i += 16_384)
    binary += String.fromCharCode(...bytes.subarray(i, i + 16_384));
  return `data:${item.mime};base64,${btoa(binary)}`;
}
