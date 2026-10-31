import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { gzipSync } from "node:zlib";
import AxeBuilder from "@axe-core/playwright";
import { chromium, firefox } from "playwright";
import { reviewServer } from "./review-server.mjs";

const out = resolve(process.argv[2] || "test-results/allotment");
await mkdir(out, { recursive: true });
const server = reviewServer("dist");
const assets = JSON.parse(await readFile("src/allotment-assets.json", "utf8"));
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const receipts = [];
const oracleCases = [];
const text = (page, id, content) => page.locator(`#${id}`).filter({ hasText: content }).waitFor();
const ready = (page) => text(page, "offline-status", "This edition is available offline,");
const incomplete = (page) => text(page, "offline-status", "not fully available offline");
const checked = (page) => text(page, "allotment-scan-status", "checked against");
async function download(page, id, name) {
  const pending = page.waitForEvent("download");
  await page.locator(`#${id}`).click();
  const file = await pending;
  assert.equal(await file.failure(), null);
  const path = resolve(out, name);
  await file.saveAs(path);
  return { path, bytes: await readFile(path) };
}
async function chanceValues(page, after = false) {
  return page.locator(`#chances table:nth-of-type(${after ? 2 : 1}) tbody td`).allTextContents();
}
await server.start();
try {
  for (const [name, engine] of [
    ["chromium", chromium],
    ["firefox", firefox],
  ]) {
    const browser = await engine.launch();
    try {
      for (const width of [1440, 375]) {
        const context = await browser.newContext({
          viewport: { width, height: 1000 },
          acceptDownloads: true,
        });
        const page = await context.newPage();
        const errors = [];
        const external = [];
        page.on("pageerror", (e) => errors.push(e.message));
        page.on("request", (r) => {
          if (/^https?:/.test(r.url()) && new URL(r.url()).origin !== new URL(server.base).origin)
            external.push(r.url());
        });
        await page.goto(server.base);
        await page.getByRole("link", { name: "Allot the jurors" }).click();
        await checked(page);
        await ready(page);
        assert.equal(await page.locator('meta[name="psephos-edition"]').count(), 1);
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          true,
          `${name}/${width}: initial overflow`,
        );
        const targetSize = await page.locator(".ticket").first().boundingBox();
        assert.ok(targetSize.width >= 44 && targetSize.height >= 44);
        await page.screenshot({ path: resolve(out, `${name}-${width}-opening.png`) });
        await page.locator("#keep-board").focus();
        await page.keyboard.press("Enter");
        await page.locator("#inspect-chances").click();
        assert.deepEqual(await chanceValues(page), ["1/2", "1/2", "1/2", "1/1"]);
        await page.locator("#unfixed-placement summary").click();
        assert.deepEqual(await page.locator("#placement-chances tbody td").allTextContents(), [
          "1/2",
          "1/2",
          "1/4",
          "1/2",
        ]);
        await page.locator("#unfixed-placement summary").click();
        // Operate the actual slot buttons using a keyboard, not a helper API.
        await page.locator('[data-ticket="B1"]').focus();
        await page.keyboard.press("Enter");
        await page.locator('[data-ticket="B2"]').focus();
        await page.keyboard.press("Enter");
        await text(page, "pair-relation", "A1 is in row 1; B1 is in row 2.");
        assert.deepEqual(await chanceValues(page), ["1/2", "1/2", "1/6", "1/3"]);
        await text(page, "pinned-board", "1/2 kept; 1/6 current");
        await page
          .locator("#allotment")
          .screenshot({ path: resolve(out, `${name}-${width}-comparison.png`) });
        assert.equal(await page.locator(".order-strip").count(), 6);
        await page.locator('[data-order="1"]').click();
        await text(page, "draw-message", "chosen example");
        await text(page, "pair-outcome", "A1: selected for service. B1: rejected.");
        assert.deepEqual(await chanceValues(page, true), ["1/1", "0/1", "0/1", "0/1"]);
        assert.equal(await page.locator("#move-second").isDisabled(), true);
        await page.locator("#undo-cube").click();
        assert.equal(await page.locator("#cube-log li").count(), 3);
        await page.locator("#reset-cubes").click();
        for (let i = 0; i < 4; i++) await page.locator("#release-cube").click();
        assert.equal(await page.locator("#cube-log li").filter({ hasText: "white" }).count(), 2);
        assert.equal(await page.locator("#cube-log li").filter({ hasText: "black" }).count(), 2);
        assert.equal(await page.locator("#release-cube").isDisabled(), true);
        await page.locator("#reset-cubes").click();
        await page.locator("#row-count").selectOption("8");
        await page.locator("#white-count").selectOption("3");
        await page.locator("#second-ticket").selectOption("A2");
        await text(page, "pinned-board", "different setup");
        await page.locator("#shuffle-tickets").click();
        for (const letter of ["A", "B", "C", "D", "E"]) {
          assert.deepEqual(
            (await page.locator(`[data-ticket^="${letter}"]`).allTextContents()).sort(),
            Array.from({ length: 8 }, (_, i) => `${letter}${i + 1}`),
          );
        }
        assert.deepEqual(await chanceValues(page), ["3/8", "3/8", "3/28", "2/7"]);
        await page.locator("#row-count").selectOption("4");
        await page.locator("#white-count").selectOption("2");
        await page.locator("#first-ticket").selectOption("A1");
        await page.locator("#second-ticket").selectOption("B1");
        await page.locator("#move-second").click();
        // Keep a partial chosen sequence, then inspect conditional chances.
        await page.locator('[data-order="0"]').click();
        for (let i = 0; i < 3; i++) await page.locator("#undo-cube").click();
        assert.deepEqual(await chanceValues(page, true), ["1/1", "1/3", "1/3", "1/3"]);
        await page
          .locator("#allotment-note")
          .fill(
            "Same individual chance; different joint chance. <Fixed placement> is an assumption. κατὰ πέντε πινάκια εἷς.",
          );
        for (const [reading, leaf] of [
          ["letters", "76"],
          ["inserter", "77"],
          ["exception", "77"],
          ["court", "77"],
          ["cubes", "77"],
        ]) {
          await page.locator("#allotment-reading").selectOption(reading);
          await checked(page);
          assert.equal(await page.locator("#allotment-page").inputValue(), leaf);
          await page.locator("#allotment-words button").first().focus();
          await page.keyboard.press("Enter");
          assert.ok((await page.locator("#allotment-word-note").textContent()).includes("("));
        }
        await page.locator("#allotment-zoom").click();
        await page.locator("#allotment-scan-viewport").focus();
        await page.keyboard.press("ArrowDown");
        assert.ok(await page.locator("#allotment-scan-viewport").evaluate((e) => e.scrollTop > 0));
        await page.locator("#allotment-zoom").click();
        await page
          .locator("#allotment-reader")
          .screenshot({ path: resolve(out, `${name}-${width}-reader.png`) });
        for (const leaf of ["76", "77", "78", "title", "imprint", "77", "title", "76", "imprint"]) {
          await page.locator("#allotment-page").selectOption(leaf);
          await checked(page);
        }
        await page.locator("#allotment-page").selectOption("77");
        await checked(page);
        const json = await download(page, "allotment-save-json", `${name}-${width}-study.json`);
        const saved = JSON.parse(json.bytes);
        assert.equal(saved.study.drawMode, "chosen");
        assert.equal(saved.pinned.columns[1][0], 1);
        const csv = await download(page, "allotment-save-csv", `${name}-${width}-study.csv`);
        const svg = await download(page, "allotment-save-svg", `${name}-${width}-board.svg`);
        assert.match(svg.bytes.toString(), /before-draw joint chance 1\/6/);
        const html = await download(page, "allotment-save-html", `${name}-${width}-reading.html`);
        const content = html.bytes.toString();
        assert.doesNotMatch(content, /<script\b/i);
        assert.match(content, /&lt;Fixed placement&gt;/);
        const embedded = [...content.matchAll(/data:[^;]+;base64,([A-Za-z0-9+/=]+)/g)].map((m) =>
          Buffer.from(m[1], "base64"),
        );
        for (const asset of assets)
          assert.ok(
            embedded.some((b) => hash(b) === asset.sha256),
            asset.path,
          );
        const standalone = await context.newPage();
        const requests = [];
        standalone.on("request", (r) => {
          if (/^https?:/.test(r.url())) requests.push(r.url());
        });
        await standalone.goto(`file://${html.path}`);
        assert.equal(await standalone.locator("img").count(), 5);
        assert.equal(
          await standalone
            .locator("img")
            .evaluateAll((images) => images.every((i) => i.complete && i.naturalWidth > 0)),
          true,
        );
        const nativePending = standalone.waitForEvent("download");
        await standalone.getByRole("link", { name: "Editable study", exact: true }).click();
        const native = await nativePending;
        const nativePath = resolve(out, `${name}-${width}-native.json`);
        await native.saveAs(nativePath);
        assert.deepEqual(JSON.parse(await readFile(nativePath, "utf8")), saved);
        assert.deepEqual(requests, []);
        assert.equal(
          await standalone.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          true,
        );
        if (name === "chromium" && width === 1440) {
          await standalone.pdf({
            path: resolve(out, "allotment-reading.pdf"),
            format: "A4",
            printBackground: true,
            tagged: true,
          });
          await writeFile(
            "examples/allotment-reading.html.gz",
            gzipSync(html.bytes, { level: 9, mtime: 0 }),
          );
          await writeFile("examples/allotment-study.json", json.bytes);
          await writeFile("examples/allotment-study.csv", csv.bytes);
          await writeFile("examples/allotment-board.svg", svg.bytes);
        }
        await standalone.close();
        await page.locator("#allotment-note").fill("replace me");
        await page.locator("#allotment-open").setInputFiles(json.path);
        await text(page, "allotment-file-status", "Study reopened");
        assert.equal(await page.locator("#allotment-note").inputValue(), saved.note);
        const invalid = structuredClone(saved);
        invalid.study.columns[0] = [1, 1, 3, 4];
        await page.locator("#allotment-open").setInputFiles({
          name: "duplicate.json",
          mimeType: "application/json",
          buffer: Buffer.from(JSON.stringify(invalid)),
        });
        await text(page, "allotment-file-status", "duplicates");
        assert.equal(await page.locator("#allotment-note").inputValue(), saved.note);
        await page.evaluate(() =>
          Object.defineProperty(navigator, "clipboard", {
            configurable: true,
            value: { writeText: () => Promise.reject(new Error("denied")) },
          }),
        );
        const urlBefore = page.url();
        await page.locator("#allotment-copy").click();
        await page.locator("#allotment-link").waitFor();
        const shared = await page.locator("#allotment-link").inputValue();
        assert.equal(page.url(), urlBefore);
        assert.ok(!decodeURIComponent(shared).includes("Fixed placement"));
        const linked = await context.newPage();
        await linked.goto(shared);
        await checked(linked);
        assert.equal(await linked.locator("#allotment-note").inputValue(), "");
        await linked.locator("#inspect-chances").click();
        assert.deepEqual(await chanceValues(linked), ["1/2", "1/2", "1/6", "1/3"]);
        assert.deepEqual(await chanceValues(linked, true), ["1/1", "1/3", "1/3", "1/3"]);
        await linked.close();
        const audit = await new AxeBuilder({ page }).analyze();
        assert.deepEqual(
          audit.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
          [],
        );
        // A second entry point must agree about edition integrity.
        const ballotTab = await context.newPage();
        await ballotTab.goto(server.base);
        await ready(ballotTab);
        await context.setOffline(true);
        await page.evaluate(async () => {
          const edition = document.querySelector('meta[name="psephos-edition"]').content;
          await (await caches.open(`psephos-${edition}`)).put(
            new URL("sources/kenyon-leaf77.jpg", location.href),
            new Response("damaged new source page"),
          );
        });
        await page.locator("#allotment-retry").click();
        await text(page, "allotment-scan-status", "does not match this edition");
        assert.equal(await page.locator("#allotment-scan").isHidden(), true);
        await incomplete(page);
        await incomplete(ballotTab);
        await context.setOffline(false);
        await ready(page);
        await ready(ballotTab);
        await page.locator("#allotment-retry").click();
        await checked(page);
        assert.equal(await page.locator("#allotment-note").inputValue(), saved.note);
        await ballotTab.close();
        // Real server outage: no request interception fulfills the page.
        await server.stop();
        await page.reload();
        await checked(page);
        await ready(page);
        await page.locator("#allotment-open").setInputFiles(json.path);
        await text(page, "allotment-file-status", "Study reopened");
        const offline = await download(
          page,
          "allotment-save-html",
          `${name}-${width}-offline.html`,
        );
        assert.equal(hash(offline.bytes), hash(html.bytes));
        await server.start();
        assert.deepEqual(errors, []);
        assert.deepEqual(external, []);
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          true,
        );
        receipts.push({
          browser: name,
          width,
          passed: true,
          keyboardPlacement: true,
          selectedExampleDistinguished: true,
          embeddedIdentities: assets.length,
          embeddedSourcePages: 5,
          a11yViolations: audit.violations.length,
          realOutageReloadAndSameExport: true,
          crossPageDamageAndRepair: true,
          htmlSha256: hash(html.bytes),
          errors,
          external,
        });
        console.log(
          `${name}/${width}: placement, exact enumeration, source reader, native artifacts, shared study, two-page damage/recovery, real outage`,
        );
        await context.close();
      }
      // Worker-free faults: same-length substitution, late source response,
      // cancellation and snapshot isolation while the learner continues.
      const context = await browser.newContext({ serviceWorkers: "block", acceptDownloads: true });
      const page = await context.newPage();
      const damaged = Buffer.from(await readFile("public/sources/kenyon-leaf77.jpg"));
      damaged[100] ^= 1;
      await page.route("**/sources/kenyon-leaf77.jpg", (route) =>
        route.fulfill({ contentType: "image/jpeg", body: damaged }),
      );
      await page.goto(`${server.base}allotment.html`);
      await text(page, "allotment-scan-status", "failed its source check");
      await page.locator("#allotment-save-html").click();
      await text(page, "allotment-file-status", "failed its source check");
      await page.unroute("**/sources/kenyon-leaf77.jpg");
      await page.locator("#allotment-retry").click();
      await checked(page);
      let release;
      let entered;
      const gate = new Promise((r) => {
        release = r;
      });
      const started = new Promise((r) => {
        entered = r;
      });
      await page.route("**/sources/kenyon-leaf77.jpg", async (route) => {
        entered();
        await gate;
        await route.continue().catch(() => {});
      });
      await page.locator("#allotment-save-html").click();
      await started;
      await page.locator("#allotment-cancel").click();
      await text(page, "allotment-file-status", "Reading cancelled");
      release();
      await page.unroute("**/sources/kenyon-leaf77.jpg");
      let resume;
      let reached;
      const held = new Promise((r) => {
        resume = r;
      });
      const atFile = new Promise((r) => {
        reached = r;
      });
      await page.route("**/sources/kenyon-leaf77.jpg", async (route) => {
        reached();
        await held;
        await route.continue().catch(() => {});
      });
      await page.locator("#allotment-note").fill("Snapshot at start");
      const pending = page.waitForEvent("download");
      await page.locator("#allotment-save-html").click();
      await atFile;
      await page.locator("#allotment-note").fill("Later explanation");
      await page.locator("#move-second").click();
      resume();
      const saved = await pending;
      const path = resolve(out, `${name}-snapshot.html`);
      await saved.saveAs(path);
      const snapshotText = await readFile(path, "utf8");
      assert.match(snapshotText, /Snapshot at start/);
      assert.doesNotMatch(snapshotText, /Later explanation/);
      await text(page, "allotment-file-status", "Later changes remain");
      await page.unroute("**/sources/kenyon-leaf77.jpg");
      let finish;
      let began;
      const delayed = new Promise((r) => {
        finish = r;
      });
      const inFlight = new Promise((r) => {
        began = r;
      });
      await page.route("**/sources/kenyon-leaf77.jpg", async (route) => {
        began();
        await delayed;
        await route.continue().catch(() => {});
      });
      await page.locator("#allotment-retry").click();
      await inFlight;
      await page.locator("#allotment-reading").selectOption("letters");
      await checked(page);
      finish();
      assert.match(await page.locator("#allotment-scan").getAttribute("alt"), /leaf 76/);
      await page.unroute("**/sources/kenyon-leaf77.jpg");
      // Enumerated cases are read from the rendered controls for an independent Python audit.
      await page.locator("#inspect-chances").click();
      for (const rows of [4, 6, 8])
        for (let whites = 1; whites < rows; whites++) {
          await page.locator("#row-count").selectOption(String(rows));
          await page.locator("#white-count").selectOption(String(whites));
          for (const same of [true, false]) {
            await page.locator("#second-ticket").selectOption(same ? "B1" : "A2");
            oracleCases.push({
              browser: name,
              rows,
              whites,
              sameRow: same,
              chances: await chanceValues(page),
              beforePlacement: await page.locator("#placement-chances tbody td").allTextContents(),
              orders: await page
                .locator(".order-strip")
                .evaluateAll((nodes) =>
                  nodes.map((n) =>
                    [...n.querySelectorAll("span")].map((s) => s.textContent).join(""),
                  ),
                ),
            });
          }
        }
      await context.close();
    } finally {
      await browser.close();
    }
  }
  await writeFile(resolve(out, "browser.json"), `${JSON.stringify(receipts, null, 2)}\n`);
  await writeFile(resolve(out, "oracle-input.json"), `${JSON.stringify(oracleCases, null, 2)}\n`);
} finally {
  await server.stop();
}
