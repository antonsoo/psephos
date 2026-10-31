import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { gzipSync } from "node:zlib";
import AxeBuilder from "@axe-core/playwright";
import { chromium, firefox } from "playwright";
import { reviewServer } from "./review-server.mjs";

const out = resolve(process.argv[2] || "test-results/attendance");
await mkdir(out, { recursive: true });
const server = reviewServer("dist");
const assets = JSON.parse(await readFile("src/allotment-assets.json", "utf8"));
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const receipts = [];
const curves = [];
const has = (page, id, content) => page.locator(`#${id}`).filter({ hasText: content }).waitFor();
const ready = (page) => has(page, "offline-status", "This edition is available offline,");
const checked = (page) => has(page, "allotment-scan-status", "checked against");
async function download(page, id, name) {
  const pending = page.waitForEvent("download");
  await page.locator(`#${id}`).click();
  const d = await pending;
  assert.equal(await d.failure(), null);
  const path = resolve(out, name);
  await d.saveAs(path);
  return { path, bytes: await readFile(path) };
}
await server.start();
try {
  for (const [name, engine] of [
    ["chromium", chromium],
    ["firefox", firefox],
  ]) {
    const browser = await engine.launch();
    try {
      for (const width of [1440, 375, 320]) {
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
        await page.getByRole("link", { name: "Who turns up?" }).click();
        await checked(page);
        await ready(page);
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          true,
        );
        await page.screenshot({ path: resolve(out, `${name}-${width}-opening.png`) });
        await has(page, "attendance-summary", "10 of 20");
        await has(page, "attendance-summary", "Enough in total");
        await page.locator("#attendance-pin").focus();
        await page.keyboard.press("Enter");
        await page.locator("#attendance-inspect").click();
        await has(page, "attendance-probability", "7,776 / 184,756");
        await has(page, "attendance-probability", "1944/46189");
        await page.locator("#attendance-exchange").focus();
        await page.keyboard.press("Enter");
        await page.keyboard.press("Enter");
        await page.locator("#attendance-from").selectOption("1");
        await page.locator("#attendance-to").selectOption("3");
        await page.locator("#attendance-exchange").click();
        await has(page, "attendance-summary", "Every group meets");
        await has(page, "attendance-summary", "10 of 20");
        await has(page, "attendance-comparison", "The population, request and total are the same");
        await has(page, "attendance-probability", "7,776 / 184,756");
        await page
          .locator("#attendance")
          .screenshot({ path: resolve(out, `${name}-${width}-balanced.png`) });
        await page.locator("#attendance-worst").click();
        await has(page, "attendance-summary", "17 of 20");
        await has(page, "attendance-summary", "Still short in a group");
        await has(page, "attendance-probability", "56/57");
        await page.locator("#attendance-add-4").focus();
        await page.keyboard.press("Enter");
        await has(page, "attendance-summary", "18 of 20");
        await has(page, "attendance-summary", "Every group meets");
        assert.equal(await page.evaluate(() => document.activeElement.id), "attendance-add-4");
        await page.locator("#attendance-add-4").focus();
        await page.keyboard.press("Enter");
        await page.keyboard.press("Enter");
        assert.equal(await page.evaluate(() => document.activeElement.id), "attendance-remove-4");
        await page.locator("#attendance-restore").focus();
        await page.keyboard.press("Enter");
        assert.equal(await page.evaluate(() => document.activeElement.id), "attendance-restore");
        await has(page, "attendance-summary", "10 of 20");
        await page.locator("#attendance-balanced").click();
        await page.locator("#attendance-patterns > summary").click();
        await has(page, "attendance-pattern-count", "381 possible count patterns");
        assert.equal(await page.locator("[data-pattern]").count(), 16);
        await page.locator("#attendance-pattern-next").focus();
        await page.keyboard.press("Enter");
        await has(page, "attendance-pattern-count", "Showing 17–32");
        await page.locator("[data-pattern]").first().focus();
        await page.keyboard.press("Enter");
        assert.equal(await page.evaluate(() => document.activeElement.id), "attendance-pattern-16");
        await page.locator("#attendance-balanced").click();
        await page.locator("#attendance-patterns > summary").click();
        await page.locator("#attendance-sample-size").fill("");
        await page.locator("#attendance-sample").click();
        await has(page, "attendance-message", "Enter a whole sample size");
        await has(page, "attendance-summary", "10 of 20");
        await page.locator("#attendance-sample-size").fill("20");
        await page.locator("#attendance-sample").click();
        await has(page, "attendance-summary", "20 of 20");
        await has(page, "attendance-summary", "sampled");
        await page.locator("#attendance-sample-size").fill("10");
        await page.locator("#attendance-sample").click();
        await has(page, "attendance-summary", "10 of 20");
        await page.locator("#attendance-restore").click();
        await page.locator("#attendance-balanced").click();
        await page
          .locator("#attendance-note")
          .fill(
            "The same ten fill two rows only when each group has two. <Counts are known>; the 4.21% concerns a new uniform sample, not doubt about this board. παραπλησίως ἴσοι.",
          );
        await page.locator("#allotment-words button").filter({ hasText: "παραπλησίως" }).click();
        await has(page, "allotment-word-note", "Approximately equal");
        await page
          .locator("#allotment-reader")
          .screenshot({ path: resolve(out, `${name}-${width}-reader.png`) });
        const json = await download(
          page,
          "attendance-save-json",
          `${name}-${width}-attendance.json`,
        );
        const saved = JSON.parse(json.bytes);
        assert.deepEqual(saved.current.counts, [2, 2, 2, 2, 2]);
        assert.deepEqual(saved.pinned.counts, [4, 3, 2, 1, 0]);
        const csv = await download(page, "attendance-save-csv", `${name}-${width}-attendance.csv`);
        const svg = await download(page, "attendance-save-svg", `${name}-${width}-attendance.svg`);
        const html = await download(page, "attendance-save-html", `${name}-${width}-reading.html`);
        const content = html.bytes.toString();
        assert.doesNotMatch(content, /<script\b/i);
        assert.match(content, /&lt;Counts are known&gt;/);
        const embedded = [...content.matchAll(/data:[^;]+;base64,([A-Za-z0-9+/=]+)/g)].map((m) =>
          Buffer.from(m[1], "base64"),
        );
        for (const file of assets)
          assert.ok(
            embedded.some((b) => sha(b) === file.sha256),
            file.path,
          );
        const standalone = await context.newPage();
        const requests = [];
        standalone.on("request", (r) => {
          if (/^https?:/.test(r.url())) requests.push(r.url());
        });
        await standalone.goto(`file://${html.path}`);
        assert.deepEqual(requests, []);
        assert.equal(
          await standalone
            .locator("img")
            .evaluateAll(
              (images) =>
                images.length === 5 && images.every((i) => i.complete && i.naturalWidth > 0),
            ),
          true,
        );
        assert.equal(
          await standalone.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          true,
          "Portable attendance overflow",
        );
        const pending = standalone.waitForEvent("download");
        await standalone.getByRole("link", { name: "Editable attendance", exact: true }).click();
        const nativePath = resolve(out, `${name}-${width}-native.json`);
        await (await pending).saveAs(nativePath);
        assert.deepEqual(JSON.parse(await readFile(nativePath, "utf8")), saved);
        if (name === "chromium" && width === 1440) {
          await standalone.pdf({
            path: resolve(out, "attendance-reading.pdf"),
            format: "A4",
            printBackground: true,
            tagged: true,
          });
          await writeFile(
            "examples/attendance-reading.html.gz",
            gzipSync(html.bytes, { level: 9, mtime: 0 }),
          );
          await writeFile("examples/attendance-study.json", json.bytes);
          await writeFile("examples/attendance-study.csv", csv.bytes);
          await writeFile("examples/attendance-counts.svg", svg.bytes);
        }
        await standalone.close();
        await page.locator("#attendance-note").fill("changed explanation");
        await page.locator("#attendance-open").setInputFiles(json.path);
        await has(page, "attendance-file-status", "Attendance reopened");
        assert.equal(await page.locator("#attendance-note").inputValue(), saved.note);
        const invalid = structuredClone(saved);
        invalid.current.counts[0] = 5;
        await page.locator("#attendance-open").setInputFiles({
          name: "invalid-counts.json",
          mimeType: "application/json",
          buffer: Buffer.from(JSON.stringify(invalid)),
        });
        await has(page, "attendance-file-status", "within its stated population");
        assert.equal(await page.locator("#attendance-note").inputValue(), saved.note);
        await page.evaluate(() =>
          Object.defineProperty(navigator, "clipboard", {
            configurable: true,
            value: { writeText: () => Promise.reject(new Error("denied")) },
          }),
        );
        const oldUrl = page.url();
        await page.locator("#attendance-copy").click();
        await page.locator("#attendance-link").waitFor();
        assert.equal(page.url(), oldUrl);
        const link = await page.locator("#attendance-link").inputValue();
        assert.ok(!decodeURIComponent(link).includes("Counts are known"));
        const linked = await context.newPage();
        await linked.goto(link);
        await checked(linked);
        await has(linked, "attendance-summary", "Every group meets");
        await has(linked, "attendance-comparison", "A group is short");
        assert.equal(await linked.locator("#attendance-note").inputValue(), "");
        await linked.close();
        await page.locator("#attendance-patterns > summary").click();
        await page.getByText("Read the exact chance at every total", { exact: true }).click();
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          true,
          "Open tables overflow",
        );
        const audit = await new AxeBuilder({ page }).analyze();
        assert.deepEqual(
          audit.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
          [],
        );
        const slots = await page.locator('[data-group="0"][data-delta="1"]').boundingBox();
        assert.ok(slots.width >= 44 && slots.height >= 44);
        await server.stop();
        await page.reload();
        await checked(page);
        await ready(page);
        await page.locator("#attendance-open").setInputFiles(json.path);
        await has(page, "attendance-file-status", "Attendance reopened");
        const offline = await download(
          page,
          "attendance-save-html",
          `${name}-${width}-offline.html`,
        );
        assert.equal(sha(offline.bytes), sha(html.bytes));
        await server.start();
        assert.deepEqual(errors, []);
        assert.deepEqual(external, []);
        receipts.push({
          browser: name,
          width,
          passed: true,
          keyboardExchange: true,
          sameTotalDifferentFeasibility: true,
          guaranteeCounterexampleOperated: true,
          patternWeightingOperated: true,
          sampleWithoutReplacement: true,
          embeddedIdentities: assets.length,
          embeddedSourceImages: 5,
          zeroExternalPortableRequests: true,
          realOutageAndByteIdenticalReading: true,
          a11yViolations: audit.violations.length,
          htmlSha256: sha(html.bytes),
          errors,
          external,
        });
        console.log(
          `${name}/${width}: same total, weighted chances, guarantee witness, Greek, native studies, real outage`,
        );
        await context.close();
      }
      const context = await browser.newContext({ serviceWorkers: "block" });
      const page = await context.newPage();
      await page.goto(`${server.base}attendance.html`);
      await checked(page);
      await page.locator("#attendance-inspect").click();
      for (const population of [4, 6, 8]) {
        await page.locator("#attendance-population").selectOption(String(population));
        for (let quota = 1; quota <= population; quota++) {
          await page.locator("#attendance-quota").selectOption(String(quota));
          curves.push({
            browser: name,
            population,
            quota,
            points: await page
              .locator("#attendance-curve-table tbody tr")
              .evaluateAll((rows) =>
                rows.map((row) =>
                  [...row.querySelectorAll("td")].map((cell) =>
                    cell.textContent.replaceAll(",", ""),
                  ),
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
  await writeFile(resolve(out, "oracle-input.json"), `${JSON.stringify(curves, null, 2)}\n`);
} finally {
  await server.stop();
}
