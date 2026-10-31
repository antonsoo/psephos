import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium, firefox } from "playwright";
import { reviewServer } from "./review-server.mjs";

const out = resolve(process.argv[2] || "test-results/attendance-faults");
await mkdir(out, { recursive: true });
const server = reviewServer("dist");
const results = [];
const has = (p, id, text) => p.locator(`#${id}`).filter({ hasText: text }).waitFor();
await server.start();
try {
  for (const [name, engine] of [
    ["chromium", chromium],
    ["firefox", firefox],
  ]) {
    const browser = await engine.launch();
    try {
      const context = await browser.newContext({ serviceWorkers: "block", acceptDownloads: true });
      const page = await context.newPage();
      const errors = [],
        downloads = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("download", (d) => downloads.push(d));
      await page.goto(`${server.base}attendance.html`);
      await has(page, "allotment-scan-status", "checked against");
      await page.getByRole("link", { name: "Back to the board" }).click();
      assert.equal(new URL(page.url()).hash, "#attendance");
      const damaged = Buffer.from(await readFile("public/sources/kenyon-leaf77.jpg"));
      damaged[100] ^= 1;
      await page.route("**/sources/kenyon-leaf77.jpg", (route) =>
        route.fulfill({ contentType: "image/jpeg", body: damaged }),
      );
      await page.locator("#attendance-note").fill("Preserve this work.");
      await page.locator("#attendance-save-html").click();
      await has(page, "attendance-file-status", "failed its source check");
      assert.equal(downloads.length, 0);
      assert.equal(await page.locator("#attendance-note").inputValue(), "Preserve this work.");
      await page.unroute("**/sources/kenyon-leaf77.jpg");
      let release, reached;
      let gate = new Promise((r) => {
        release = r;
      });
      let started = new Promise((r) => {
        reached = r;
      });
      await page.route("**/sources/kenyon-leaf77.jpg", async (route) => {
        reached();
        await gate;
        await route.continue().catch(() => {});
      });
      await page.locator("#attendance-save-html").click();
      await started;
      await page.locator("#attendance-cancel").click();
      await has(page, "attendance-file-status", "Reading cancelled");
      release();
      await page.unroute("**/sources/kenyon-leaf77.jpg");
      assert.equal(downloads.length, 0);
      gate = new Promise((r) => {
        release = r;
      });
      started = new Promise((r) => {
        reached = r;
      });
      await page.route("**/sources/kenyon-leaf77.jpg", async (route) => {
        reached();
        await gate;
        await route.continue().catch(() => {});
      });
      await page.locator("#attendance-note").fill("Snapshot before later work.");
      const pending = page.waitForEvent("download");
      await page.locator("#attendance-save-html").click();
      await started;
      await page.locator("#attendance-note").fill("Later work remains in the live study.");
      await page.locator("#attendance-balanced").click();
      release();
      const d = await pending;
      const path = resolve(out, `${name}-snapshot.html`);
      await d.saveAs(path);
      const html = await readFile(path, "utf8");
      assert.match(html, /Snapshot before later work/);
      assert.doesNotMatch(html, /Later work remains/);
      assert.match(html, /4–3–2–1–0/);
      await has(page, "attendance-file-status", "Later edits remain here");
      await has(page, "attendance-summary", "Every group meets");
      await page.unroute("**/sources/kenyon-leaf77.jpg");
      await page.evaluate(() => {
        const original = File.prototype.text;
        window.releaseStudyRead = null;
        File.prototype.text = async function () {
          if (this.name.startsWith("held"))
            await new Promise((r) => {
              window.releaseStudyRead = r;
            });
          return original.call(this);
        };
      });
      const first = JSON.parse(await readFile("examples/attendance-study.json", "utf8"));
      first.note = "Old file must not overwrite a new choice.";
      const second = structuredClone(first);
      second.note = "Latest selected file.";
      const upload = (fileName, study) =>
        page.locator("#attendance-open").setInputFiles({
          name: fileName,
          mimeType: "application/json",
          buffer: Buffer.from(JSON.stringify(study)),
        });
      await upload("held-first.json", first);
      await page.waitForFunction(() => !!window.releaseStudyRead);
      await upload("newer.json", second);
      await has(page, "attendance-file-status", "Attendance reopened");
      await page.evaluate(() => window.releaseStudyRead());
      // An explicit task barrier waits for the held continuation, not an arbitrary timeout.
      await page.evaluate(() => new Promise((r) => setTimeout(r, 0)));
      assert.equal(await page.locator("#attendance-note").inputValue(), second.note);
      await upload("held-edited.json", first);
      await page.waitForFunction(() => !!window.releaseStudyRead);
      await page.locator("#attendance-note").fill("My intervening edit.");
      await page.evaluate(() => window.releaseStudyRead());
      await has(page, "attendance-file-status", "Attendance changed while this file was opening");
      assert.equal(await page.locator("#attendance-note").inputValue(), "My intervening edit.");
      assert.deepEqual(errors, []);
      results.push({
        browser: name,
        passed: true,
        sameLengthSubstitutionRejected: true,
        cancellationWithoutDownload: true,
        exportSnapshotPreserved: true,
        lateImportCannotReplaceLatestChoice: true,
        editDuringImportPreserved: true,
        readerFragmentOperated: true,
        errors,
      });
      console.log(
        `${name}: source substitution, cancellation, snapshot, late import and intervening edits`,
      );
      await context.close();
    } finally {
      await browser.close();
    }
  }
} finally {
  await server.stop();
}
await writeFile(resolve(out, "receipt.json"), `${JSON.stringify(results, null, 2)}\n`);
