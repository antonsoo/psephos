import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { gzipSync } from "node:zlib";
import AxeBuilder from "@axe-core/playwright";
import { chromium, firefox } from "playwright";
import { reviewServer } from "./review-server.mjs";

const out = resolve(process.argv[2] || "test-results/browser");
await mkdir(out, { recursive: true });
const dist = resolve("dist");
const hash = (b) => createHash("sha256").update(b).digest("hex");
const assets = JSON.parse(await readFile("src/asset-manifest.json", "utf8"));
const server = reviewServer(dist);
const start = () => server.start();
const stop = () => server.stop();
const receipts = [];
async function expectText(page, id, expected) {
  await page
    .locator(`#${id}`)
    .filter({
      hasText: expected === "available offline" ? "This edition is available offline," : expected,
    })
    .waitFor();
}
async function download(page, id, name) {
  const pending = page.waitForEvent("download");
  await page.locator(`#${id}`).click();
  const d = await pending;
  assert.equal(await d.failure(), null);
  const path = resolve(out, name);
  await d.saveAs(path);
  return { path, bytes: await readFile(path) };
}
await start();
const base = server.base;
try {
  for (const [name, engine] of [
    ["chromium", chromium],
    ["firefox", firefox],
  ]) {
    const browser = await engine.launch({ headless: true });
    try {
      for (const width of [1440, 375]) {
        const context = await browser.newContext({
          viewport: { width, height: 1000 },
          acceptDownloads: true,
          reducedMotion: "reduce",
        });
        const page = await context.newPage();
        const errors = [];
        const external = [];
        page.on("pageerror", (e) => errors.push(e.message));
        page.on("request", (r) => {
          if (
            !r.url().startsWith(base.slice(0, base.indexOf("/psephos/"))) &&
            /^https?:/.test(r.url())
          )
            external.push(r.url());
        });
        await page.goto(base);
        await expectText(page, "scan-status", "checked against");
        await expectText(page, "offline-status", "available offline");
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          true,
          `${name}/${width}: horizontal overflow`,
        );
        await page.screenshot({ path: resolve(out, `${name}-${width}-opening.png`) });
        await page.locator("summary").filter({ hasText: "Try issuing" }).click();
        await page.locator("#two-pierced").click();
        await expectText(page, "action-message", "Refuse this pair");
        await page.locator("#issue").focus();
        await page.keyboard.press("Enter");
        assert.equal(await page.locator("#choose-pierced").isEnabled(), true);
        await page.locator("#pin").click();
        const observerBefore = await page.locator("#observer-drawing").innerHTML();
        await page.locator("#choose-pierced").check();
        assert.equal(await page.locator("#observer-drawing").innerHTML(), observerBefore);
        await expectText(page, "comparison", "private choice has changed");
        await page.locator("#covered").uncheck();
        assert.notEqual(await page.locator("#observer-drawing").innerHTML(), observerBefore);
        await expectText(page, "observation-text", "Exposed pierced");
        await page.locator("#covered").check();
        await page.locator("#choose-solid").check();
        await page.locator("#cast").click();
        await page.locator("#count-bronze").click();
        await expectText(page, "verdict", "Equal votes. The defendant wins.");
        assert.match(
          await page.locator("#board svg").getAttribute("aria-label"),
          /5 pierced, 5 solid/,
        );
        await page.locator(".audit > summary").click();
        await page.locator("#audit-extra").click();
        await expectText(page, "verdict", "extra ballot");
        await page.locator("#audit-replace").click();
        await expectText(page, "verdict", "prosecutor wins the altered count");
        await expectText(page, "audit-message", "Ten ballots still match");
        await page
          .locator("#workbench")
          .screenshot({ path: resolve(out, `${name}-${width}-altered.png`) });
        await page.locator("#audit-none").click();
        await page.locator("#inspect-inference").click();
        await expectText(page, "inference-results", "252 arrangements fit");
        await page
          .locator("#inference")
          .screenshot({ path: resolve(out, `${name}-${width}-inference-open.png`) });
        await page.locator("#know-nine").click();
        await expectText(page, "inference-results", "choice is forced: solid");
        for (const id of [5, 6, 7, 8]) await page.locator(`#known-${id}`).uncheck();
        await expectText(page, "inference-results", "1 arrangement fits");
        await page.locator("#known-4").uncheck();
        await expectText(page, "inference-results", "6 arrangements fit");
        await page.locator("#known-4").check();
        await expectText(page, "inference-results", "choice is forced: solid");
        await page
          .locator("#inference")
          .screenshot({ path: resolve(out, `${name}-${width}-inference-forced.png`) });

        await page.locator("#reading").selectOption("tie");
        await expectText(page, "scan-status", "Page LXVIII checked");
        await page.locator("#greek button").filter({ hasText: "ἂν δὲ ἴσαι" }).click();
        await expectText(page, "phrase-note", "feminine plural");
        await page.locator("#cite").click();
        await page.locator("#zoom").click();
        await page.locator("#scan-viewport").focus();
        await page.keyboard.press("ArrowDown");
        assert.ok(await page.locator("#scan-viewport").evaluate((el) => el.scrollTop > 0));
        await page.locator("#zoom").click();
        await page
          .locator("#reader")
          .screenshot({ path: resolve(out, `${name}-${width}-reading.png`) });
        await page
          .locator("#note")
          .fill(
            "Five and five acquit under ἂν δὲ ἴσαι. Replacing a solid ballot leaves ten in total but changes the result. <This is my explanation.>",
          );
        await page.locator("#scan-page").selectOption("imprint");
        await expectText(page, "scan-status", "Page Imprint checked");
        assert.match(await page.locator("#scan").getAttribute("alt"), /1958/);
        const json = await download(page, "save-json", `${name}-${width}-court.json`);
        const saved = JSON.parse(json.bytes);
        assert.deepEqual(saved.citations, ["tie"]);
        assert.equal(saved.version, 2);
        assert.deepEqual(saved.knowledge, { target: 9, known: [0, 1, 2, 3, 4], inspected: true });
        assert.ok(saved.observation);
        assert.ok(saved.actions.some((a) => a.pair === "two-pierced"));
        const svg = await download(page, "save-svg", `${name}-${width}-count.svg`);
        assert.match(svg.bytes.toString(), /5 pierced \/ 5 solid/);
        const html = await download(page, "save-html", `${name}-${width}-illustrated.html`);
        const content = html.bytes.toString();
        assert.doesNotMatch(content, /<script\b/i);
        assert.match(content, /&lt;This is my explanation\.&gt;/);
        assert.match(content, /Juror 10’s choice is forced: solid/);
        assert.match(content, /REPRINTED|lists reprints/);
        const embeddedImages = [
          ...content.matchAll(/<img[^>]+src="data:image\/jpeg;base64,([^"]+)"/g),
        ].map((m) => Buffer.from(m[1], "base64"));
        assert.equal(embeddedImages.length, 5);
        for (const item of assets.filter((a) => a.mime === "image/jpeg"))
          assert.ok(
            embeddedImages.some((b) => hash(b) === item.sha256),
            item.path,
          );
        const embeddedFiles = [...content.matchAll(/data:[^;]+;base64,([A-Za-z0-9+/=]+)/g)].map(
          (m) => Buffer.from(m[1], "base64"),
        );
        for (const item of assets)
          assert.ok(
            embeddedFiles.some((b) => hash(b) === item.sha256),
            `Embedded ${item.path}`,
          );
        const standalone = await context.newPage();
        const assetRequests = [];
        standalone.on("request", (r) => {
          if (/^https?:/.test(r.url())) assetRequests.push(r.url());
        });
        await standalone.goto(`file://${html.path}`);
        assert.match(await standalone.locator("body").textContent(), /Five and five acquit/);
        assert.deepEqual(assetRequests, []);
        const native = standalone.getByRole("link", {
          name: "Download editable JSON",
          exact: true,
        });
        const nativeDownload = standalone.waitForEvent("download");
        await native.click();
        const nativePath = resolve(out, `${name}-${width}-reopened.json`);
        await (await nativeDownload).saveAs(nativePath);
        assert.deepEqual(JSON.parse(await readFile(nativePath, "utf8")), saved);
        if (name === "chromium" && width === 1440) {
          await standalone.pdf({
            path: resolve(out, "illustrated-record.pdf"),
            format: "A4",
            printBackground: true,
            tagged: true,
          });
          await writeFile(
            resolve("examples/last-vote-record.html.gz"),
            gzipSync(html.bytes, { level: 9, mtime: 0 }),
          );
          await writeFile(resolve("examples/last-vote-record.json"), json.bytes);
          await writeFile(resolve("examples/last-vote-count.svg"), svg.bytes);
        }
        await standalone.close();
        await page.locator("#note").fill("Changed live note");
        await page.locator("#open-file").setInputFiles(json.path);
        await expectText(page, "file-status", "Court record reopened");
        assert.equal(await page.locator("#note").inputValue(), saved.note);
        // Exercise the explicit ordinary-link fallback, with no clipboard permission.
        await page.evaluate(() => {
          Object.defineProperty(navigator, "clipboard", {
            configurable: true,
            value: { writeText: () => Promise.reject(new Error("denied")) },
          });
        });
        const beforeHref = page.url();
        await page.locator("#copy-link").click();
        await page.locator("#share-text").waitFor();
        assert.equal(page.url(), beforeHref);
        const link = await page.locator("#share-text").inputValue();
        const linked = await context.newPage();
        await linked.goto(link);
        assert.equal(await linked.locator("#note").inputValue(), saved.note);
        await expectText(linked, "verdict", "Equal votes");
        await expectText(linked, "inference-results", "choice is forced: solid");
        await linked.close();
        const audit = await new AxeBuilder({ page }).analyze();
        assert.deepEqual(
          audit.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
          [],
        );
        // Real server outage while navigator.onLine remains true: no synthetic route fulfills the page.
        await stop();
        await page.reload();
        await expectText(page, "verdict", "Equal votes");
        assert.equal(await page.evaluate(() => navigator.onLine), true);
        await expectText(page, "scan-status", "checked against");
        const offline = await download(page, "save-html", `${name}-${width}-offline.html`);
        assert.equal(hash(offline.bytes), hash(html.bytes));
        await page.evaluate(async () => {
          const edition = document.querySelector('meta[name="psephos-edition"]').content;
          const cache = await caches.open(`psephos-${edition}`);
          await cache.put(
            new URL("sources/kenyon-p67.jpg", location.href),
            new Response("damaged source"),
          );
        });
        await page.locator("#retry-scan").click();
        await expectText(page, "scan-status", "HTTP 503");
        await expectText(page, "offline-status", "not fully available offline");
        assert.equal(await page.locator("#scan").isHidden(), true);
        await start();
        await page.evaluate(() => dispatchEvent(new Event("online")));
        await expectText(page, "offline-status", "available offline");
        await page.locator("#retry-scan").click();
        await expectText(page, "scan-status", "checked against");
        await page.locator("#preset").selectOption("wooden-urn");
        await page.locator("#issue").click();
        await page.locator("#cast").click();
        await page.locator("#count-bronze").click();
        await expectText(page, "verdict", "3 pierced for the prosecutor; 7 solid");
        await page.locator("#count-wood").click();
        await expectText(page, "verdict", "7 pierced and 3 solid are discarded");
        await page.locator("#undo").click();
        await expectText(page, "verdict", "defendant wins");
        await page.locator("#redo").click();
        await expectText(page, "verdict", "unused urn cannot decide");
        assert.deepEqual(errors, []);
        assert.deepEqual(external, []);
        receipts.push({
          browser: name,
          width,
          passed: true,
          a11yViolations: audit.violations.length,
          realOutageReload: true,
          splitCountAndFiveKnownChoicesOperated: true,
          observerKnowledgeRetainedInArtifactsAndLinks: true,
          offlineArtifactSha256: hash(offline.bytes),
          htmlSha256: hash(html.bytes),
          embeddedSourceImages: embeddedImages.length,
          embeddedFileIdentities: assets.length,
          damagedCacheRefusedAndRepaired: true,
          errors,
          external,
        });
        console.log(
          `${name}/${width}: concealed choice, tie, both urns, interventions, Greek, native artifacts, actual outage, accessibility`,
        );
        await context.close();
      }
      // In a worker-free context a substituted scan must fail its retained identity.
      const context = await browser.newContext({ serviceWorkers: "block" });
      const page = await context.newPage();
      const wrongSource = Buffer.from(await readFile("public/sources/kenyon-p67.jpg"));
      wrongSource[100] ^= 1;
      await page.route("**/sources/kenyon-p67.jpg", (route) =>
        route.fulfill({ contentType: "image/jpeg", body: wrongSource }),
      );
      await page.goto(base);
      await expectText(page, "scan-status", "failed its source check");
      assert.equal(await page.locator("#scan").isHidden(), true);
      await page.locator("#save-html").click();
      await expectText(page, "file-status", "failed its source check");
      await page.unroute("**/sources/kenyon-p67.jpg");
      await page.locator("#retry-scan").click();
      await expectText(page, "scan-status", "checked against");
      // A late source response must not replace the page selected afterwards.
      let release;
      const gate = new Promise((r) => {
        release = r;
      });
      let started;
      const entered = new Promise((r) => {
        started = r;
      });
      await page.route("**/sources/kenyon-p67.jpg", async (route) => {
        started();
        await gate;
        await route.continue().catch(() => {});
      });
      await page.locator("#retry-scan").click();
      await entered;
      await page.locator("#reading").selectOption("tie");
      await expectText(page, "scan-status", "Page LXVIII checked");
      release();
      assert.match(await page.locator("#scan").getAttribute("alt"), /LXVIII/);
      await page.unroute("**/sources/kenyon-p67.jpg");
      await page.locator("#issue").click();
      await page.locator("#cast").click();
      await page.locator("#count-bronze").click();
      await page.locator("#inspect-inference").click();
      await page.locator("#know-nine").click();
      // Export captures inputs before its first asynchronous source request.
      let releaseExport;
      const exportGate = new Promise((r) => {
        releaseExport = r;
      });
      let exportStarted;
      const exportEntered = new Promise((r) => {
        exportStarted = r;
      });
      await page.route("**/sources/agora-ballots.jpg", async (route) => {
        exportStarted();
        await exportGate;
        await route.continue().catch(() => {});
      });
      await page.locator("#note").fill("Captured before source loading");
      const pending = page.waitForEvent("download");
      await page.locator("#save-html").click();
      await exportEntered;
      await page.locator("#note").fill("Changed during source loading");
      await page.locator("#know-none").click();
      releaseExport();
      const d = await pending;
      const path = resolve(out, `${name}-snapshot.html`);
      await d.saveAs(path);
      const html = await readFile(path, "utf8");
      assert.match(html, /Captured before source loading/);
      assert.doesNotMatch(html, /Changed during source loading/);
      assert.match(html, /Juror 10’s choice is forced: solid/);
      const nativeSnapshot = JSON.parse(
        decodeURIComponent(html.match(/data:application\/json;charset=utf-8,([^"]+)/)[1]),
      );
      assert.equal(nativeSnapshot.knowledge.known.length, 9);
      await expectText(page, "inference-results", "252 arrangements fit");
      await page.unroute("**/sources/agora-ballots.jpg");
      let releaseCancel;
      const cancelGate = new Promise((r) => {
        releaseCancel = r;
      });
      let cancelStarted;
      const cancelEntered = new Promise((r) => {
        cancelStarted = r;
      });
      await page.route("**/sources/agora-ballots.jpg", async (route) => {
        cancelStarted();
        await cancelGate;
        await route.continue().catch(() => {});
      });
      await page.locator("#save-html").click();
      await cancelEntered;
      await page.locator("#cancel-export").click();
      await expectText(page, "file-status", "Preparation canceled");
      releaseCancel();
      await page.unroute("**/sources/agora-ballots.jpg");
      assert.equal(await page.locator("#note").inputValue(), "Changed during source loading");
      // A delayed file read must not overwrite an explanation edited in the meantime.
      await page.evaluate(() => {
        const original = File.prototype.text;
        File.prototype.text = function () {
          return original.call(this).then(
            (text) =>
              new Promise((resolveRead) => {
                window.finishFileRead = () => {
                  File.prototype.text = original;
                  resolveRead(text);
                };
              }),
          );
        };
      });
      await page.locator("#open-file").setInputFiles(resolve(out, `${name}-1440-court.json`));
      await page.waitForFunction(() => typeof window.finishFileRead === "function");
      await page.locator("#note").fill("Keep the work edited during import");
      await page.evaluate(() => window.finishFileRead());
      await expectText(page, "file-status", "work changed while the file was being read");
      assert.equal(await page.locator("#note").inputValue(), "Keep the work edited during import");
      await context.close();
      receipts.push({
        browser: name,
        sourceSubstitutionRefused: true,
        sourceRecovery: true,
        staleSourceIgnored: true,
        exportSnapshotPreserved: true,
        exportCancellationKeptWork: true,
        delayedImportKeptWork: true,
      });
    } finally {
      await browser.close();
    }
  }
  await writeFile(resolve(out, "receipt.json"), `${JSON.stringify({ base, receipts }, null, 2)}\n`);
} finally {
  await stop();
}
