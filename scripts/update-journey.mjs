import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium, firefox } from "playwright";
import { reviewServer } from "./review-server.mjs";

const out = resolve(process.argv[2] || "test-results/update-journey");
await mkdir(out, { recursive: true });
const a = resolve(out, "a/dist"),
  b = resolve(out, "b/dist");
await cp("dist", a, { recursive: true });
await cp("dist", b, { recursive: true });
await writeFile(
  `${b}/favicon.svg`,
  `${await readFile(`${b}/favicon.svg`, "utf8")}\n<!-- Next edition for update review -->\n`,
);
execFileSync(process.execPath, [resolve("scripts/offline.mjs")], { cwd: resolve(out, "b") });
const edition = async (root) =>
  (await readFile(`${root}/attendance.html`, "utf8")).match(
    /name="psephos-edition" content="([a-f0-9]+)"/,
  )[1];
const editionA = await edition(a),
  editionB = await edition(b);
assert.notEqual(editionA, editionB);
const server = reviewServer(a);
const results = [];
const has = (page, id, value) => page.locator(`#${id}`).filter({ hasText: value }).waitFor();
const ready = (page) => has(page, "offline-status", "This edition is available offline,");
await server.start();
try {
  for (const [name, engine] of [
    ["chromium", chromium],
    ["firefox", firefox],
  ]) {
    server.use(a);
    const browser = await engine.launch();
    try {
      const context = await browser.newContext({ acceptDownloads: true });
      const attendance = await context.newPage();
      await attendance.goto(`${server.base}attendance.html`);
      await ready(attendance);
      const rows = await context.newPage();
      await rows.goto(`${server.base}allotment.html`);
      await ready(rows);
      await attendance.locator("#attendance-pin").click();
      await attendance.locator("#attendance-balanced").click();
      await attendance
        .locator("#attendance-note")
        .fill("Keep my unsaved attendance reasoning across the edition change.");
      server.use(b);
      await rows.evaluate(async () => {
        await (await navigator.serviceWorker.getRegistration()).update();
      });
      await has(rows, "edition-update", "close all Psephos tabs");
      await has(attendance, "edition-update", "close all Psephos tabs");
      await ready(rows);
      await ready(attendance);
      const failedDocument = await rows.evaluate(async () => {
        const edition = document.querySelector('meta[name="psephos-edition"]').content;
        const url = new URL("allotment.html", location.href);
        await (await caches.open(`psephos-${edition}`)).delete(url);
        return (await fetch(url)).status;
      });
      assert.equal(
        failedDocument,
        503,
        "An old document must not be replaced with a different edition under its old integrity claim",
      );
      await has(rows, "offline-status", "not fully available offline");
      await has(attendance, "offline-status", "not fully available offline");
      await has(attendance, "edition-update", "Save an editable copy of your work");
      const pending = attendance.waitForEvent("download");
      await attendance.locator("#attendance-save-json").click();
      const path = resolve(out, `${name}-before-update.json`);
      await (await pending).saveAs(path);
      const saved = JSON.parse(await readFile(path, "utf8"));
      assert.equal(saved.note, "Keep my unsaved attendance reasoning across the edition change.");
      assert.deepEqual(saved.current.counts, [2, 2, 2, 2, 2]);
      assert.deepEqual(saved.pinned.counts, [4, 3, 2, 1, 0]);
      // A same-origin page outside the application scope can observe activation
      // without itself keeping the old application worker alive.
      const monitor = await context.newPage();
      await monitor.goto(server.observer);
      assert.equal(await monitor.evaluate(() => navigator.serviceWorker.controller), null);
      await rows.close();
      await attendance.close();
      await monitor.waitForFunction(async (expected) => {
        const registration = await navigator.serviceWorker.getRegistration("/psephos/");
        if (!registration?.active) return false;
        const channel = new MessageChannel();
        return new Promise((resolve) => {
          const timeout = setTimeout(() => {
            channel.port1.close();
            resolve(false);
          }, 1000);
          channel.port1.onmessage = (event) => {
            clearTimeout(timeout);
            channel.port1.close();
            resolve(event.data?.edition === expected && event.data.complete === true);
          };
          registration.active.postMessage({ type: "inventory" }, [channel.port2]);
        });
      }, editionB);
      const reopened = await context.newPage();
      await reopened.goto(`${server.base}attendance.html`);
      await ready(reopened);
      assert.equal(
        await reopened.locator('meta[name="psephos-edition"]').getAttribute("content"),
        editionB,
      );
      assert.equal(await reopened.locator("#edition-update").isHidden(), true);
      await reopened.locator("#attendance-open").setInputFiles(path);
      await has(reopened, "attendance-file-status", "Attendance reopened");
      assert.equal(await reopened.locator("#attendance-note").inputValue(), saved.note);
      await has(reopened, "attendance-comparison", "A group is short");
      await context.setOffline(true);
      await reopened.reload();
      await ready(reopened);
      await reopened.locator("#attendance-open").setInputFiles(path);
      await has(reopened, "attendance-file-status", "Attendance reopened");
      assert.equal(await reopened.locator("#attendance-note").inputValue(), saved.note);
      const cachesLeft = await reopened.evaluate(() => caches.keys());
      assert.deepEqual(
        cachesLeft.filter((name) => name.startsWith("psephos-")),
        [`psephos-${editionB}`],
      );
      results.push({
        browser: name,
        waitingEditionExplainedOnBothPages: true,
        oldDocumentMismatchRefused: true,
        readinessWithdrawnOnBothPages: true,
        editableWorkSavedBeforeClose: true,
        nextEditionActivatedAfterApplicationTabsClosed: true,
        currentAndKeptCountsRestored: true,
        explanationRestoredOffline: true,
        oldCacheRemoved: true,
      });
      await context.close();
      console.log(
        `${name}: waiting edition, partial old-cache failure, explicit save/close/reopen, offline restoration`,
      );
    } finally {
      await browser.close();
    }
  }
  await writeFile(
    resolve(out, "receipt.json"),
    `${JSON.stringify({ editionA, editionB, results }, null, 2)}\n`,
  );
} finally {
  await server.stop();
}
