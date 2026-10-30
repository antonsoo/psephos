import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium, firefox } from "playwright";
import { reviewServer } from "./review-server.mjs";

const out = resolve(process.argv[2] || "test-results/offline-audit");
await mkdir(out, { recursive: true });
const a = resolve(out, "edition-a/dist"),
  b = resolve(out, "edition-b/dist");
await cp("dist", a, { recursive: true });
await cp("dist", b, { recursive: true });
const originalHtml = await readFile(`${a}/index.html`, "utf8");
const editionA = originalHtml.match(/name="psephos-edition" content="([a-f0-9]+)"/)[1];
await writeFile(`${b}/index.html`, originalHtml.replace(/<meta name="psephos-edition"[^>]+>/g, ""));
await writeFile(
  `${b}/favicon.svg`,
  `${await readFile(`${b}/favicon.svg`, "utf8")}\n<!-- Update-audit edition B -->\n`,
);
execFileSync(process.execPath, [resolve("scripts/offline.mjs")], {
  cwd: resolve(out, "edition-b"),
});
const editionB = (await readFile(`${b}/index.html`, "utf8")).match(
  /name="psephos-edition" content="([a-f0-9]+)"/,
)[1];
assert.notEqual(editionA, editionB);
const server = reviewServer(a);
const results = [];
const ready = (page) =>
  page
    .locator("#offline-status")
    .filter({ hasText: "This edition is available offline," })
    .waitFor();
const incomplete = (page) =>
  page.locator("#offline-status").filter({ hasText: "not fully available offline" }).waitFor();
await server.start();
try {
  for (const [name, engine] of [
    ["chromium", chromium],
    ["firefox", firefox],
  ]) {
    server.use(a);
    const browser = await engine.launch();
    try {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(server.base);
      await ready(page);
      const observer = await context.newPage();
      await observer.goto(server.base);
      await ready(observer);
      for (const reader of [page, observer])
        await reader.evaluate(() => {
          window.inventoryNotices = 0;
          navigator.serviceWorker.addEventListener("message", (event) => {
            if (event.data?.type === "inventory-invalidated") window.inventoryNotices++;
          });
        });
      await context.setOffline(true);
      await page.evaluate(async () => {
        const edition = document.querySelector('meta[name="psephos-edition"]').content;
        const url = new URL("sources/kenyon-p67.jpg", location.href);
        const cache = await caches.open(`psephos-${edition}`);
        const good = await cache.match(url);
        await (await caches.open("psephos-unrelated-edition")).put(url, good);
        await cache.put(url, new Response("corrupt retained source"));
      });
      await page.locator("#retry-scan").click();
      await page
        .locator("#scan-status")
        .filter({ hasText: "does not match this edition" })
        .waitFor();
      await incomplete(page);
      await incomplete(observer);
      assert.equal(await page.locator("#scan").isHidden(), true);
      // A healthy file in another cache cannot replace the current edition.
      assert.equal(
        await page.evaluate(async () =>
          (await caches.open("psephos-unrelated-edition")).keys().then((r) => r.length),
        ),
        1,
      );
      await context.setOffline(false);
      await ready(page);
      await ready(observer);
      await page.locator("#retry-scan").click();
      await page.locator("#scan-status").filter({ hasText: "checked against" }).waitFor();
      const noticesBefore = await Promise.all(
        [page, observer].map((reader) => reader.evaluate(() => window.inventoryNotices)),
      );
      // No helper fetch and no synthetic inventory event: the worker must
      // notify clients when a plain image request discovers damaged storage.
      await server.stop();
      await page.evaluate(async () => {
        const edition = document.querySelector('meta[name="psephos-edition"]').content;
        await (await caches.open(`psephos-${edition}`)).put(
          new URL("sources/agora-ballots.jpg", location.href),
          new Response("damaged photo"),
        );
      });
      const failedImage = await page.evaluate(
        async () => (await fetch(new URL("sources/agora-ballots.jpg", location.href))).status,
      );
      assert.equal(failedImage, 503);
      await incomplete(page);
      await incomplete(observer);
      const noticesAfter = await Promise.all(
        [page, observer].map((reader) => reader.evaluate(() => window.inventoryNotices)),
      );
      assert.deepEqual(
        noticesAfter,
        noticesBefore.map((count) => count + 1),
      );
      assert.equal(
        await page.evaluate(
          async () => (await fetch(new URL("sources/agora-ballots.jpg", location.href))).status,
        ),
        503,
      );
      assert.deepEqual(
        await Promise.all(
          [page, observer].map((reader) => reader.evaluate(() => window.inventoryNotices)),
        ),
        noticesAfter,
      );
      const unknown = await page.evaluate(async () => {
        try {
          return (await fetch(new URL("not-an-offline-page.html", location.href))).status;
        } catch {
          return "network-failure";
        }
      });
      assert.equal(unknown, "network-failure");
      await server.start();
      assert.equal(
        await page.evaluate(
          async () => (await fetch(new URL("sources/agora-ballots.jpg", location.href))).status,
        ),
        200,
      );
      await ready(page);
      await ready(observer);
      const documentEdition = await page
        .locator('meta[name="psephos-edition"]')
        .getAttribute("content");
      // Ignore events from a port/window or a controller for another edition.
      await page.evaluate(() => {
        const before = document.getElementById("offline-status").textContent;
        navigator.serviceWorker.dispatchEvent(
          new MessageEvent("message", {
            data: { type: "inventory-invalidated", edition: "foreign" },
            source: navigator.serviceWorker.controller,
          }),
        );
        navigator.serviceWorker.dispatchEvent(
          new MessageEvent("message", {
            data: {
              type: "inventory-invalidated",
              edition: document.querySelector('meta[name="psephos-edition"]').content,
            },
          }),
        );
        if (document.getElementById("offline-status").textContent !== before)
          throw new Error("Unrelated readiness event was accepted");
      });
      await context.close();

      const updates = await browser.newContext();
      const old = await updates.newPage();
      await old.goto(server.base);
      await ready(old);
      await old.locator("#note").fill("Keep this explanation across an edition update.");
      server.use(b);
      await old.evaluate(async () => {
        await (await navigator.serviceWorker.getRegistration()).update();
      });
      await old.waitForFunction(
        async () =>
          (await navigator.serviceWorker.getRegistration()).waiting?.state === "installed",
      );
      assert.equal(
        await old.locator('meta[name="psephos-edition"]').getAttribute("content"),
        editionA,
      );
      await old.reload();
      await ready(old);
      assert.equal(
        await old.locator('meta[name="psephos-edition"]').getAttribute("content"),
        editionA,
      );
      const held = await old.evaluate(async () => ({
        names: await caches.keys(),
        edition: document.querySelector('meta[name="psephos-edition"]').content,
      }));
      assert.ok(held.names.includes(`psephos-${editionA}`));
      assert.ok(held.names.includes(`psephos-${editionB}`));
      await old.close();
      const next = await updates.newPage();
      await next.goto(server.base);
      await next.waitForFunction(
        (expected) => document.querySelector('meta[name="psephos-edition"]')?.content === expected,
        editionB,
      );
      await ready(next);
      assert.equal(
        await next.locator("#note").inputValue(),
        "Keep this explanation across an edition update.",
      );
      const active = await next.evaluate(async () => ({
        names: await caches.keys(),
        controlled: navigator.serviceWorker.controller !== null,
      }));
      assert.equal(active.controlled, true);
      assert.ok(active.names.includes(`psephos-${editionB}`));
      assert.ok(!active.names.includes(`psephos-${editionA}`));
      await updates.close();
      results.push({
        browser: name,
        initialEdition: documentEdition,
        explicitOfflineIntegrityFailureWithdrawsReadiness: true,
        nativeImageFailureWithdrawsReadiness: true,
        otherOpenPageAutomaticallyWithdrawsReadiness: true,
        repeatedFailureNotificationsCoalesced: true,
        otherEditionCacheNotUsed: true,
        uncachedNavigationNotInvented: true,
        connectedRecovery: true,
        foreignReadinessEventsIgnored: true,
        oldEditionKeptWhileOpen: true,
        nextEditionActivatedAfterClose: true,
        explanationPreservedAcrossUpdate: true,
      });
      console.log(
        `${name}: real integrity failures, worker notifications, named caches, old/new edition transition`,
      );
    } finally {
      await server.start().catch(() => {});
      await browser.close();
    }
  }
  await writeFile(
    `${out}/receipt.json`,
    `${JSON.stringify(
      {
        editionA,
        editionB,
        workerBuilderSha256: createHash("sha256")
          .update(await readFile("scripts/offline.mjs"))
          .digest("hex"),
        results,
      },
      null,
      2,
    )}\n`,
  );
} finally {
  await server.stop();
}
