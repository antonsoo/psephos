import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium, firefox } from "playwright";

const base = new URL(process.argv[2] || "https://antonsoo.github.io/psephos/").href;
const out = resolve(process.argv[3] || "test-results/public");
await mkdir(out, { recursive: true });
const hash = (b) => createHash("sha256").update(b).digest("hex");
const assets = JSON.parse(await readFile("src/asset-manifest.json", "utf8"));
const original = await readFile("tests/fixtures/court-v1.json", "utf8");
const expected = await readFile("dist/index.html");
const expectedEdition = expected
  .toString()
  .match(/name="psephos-edition" content="([a-f0-9]+)"/)[1];
async function walk(directory) {
  const paths = [];
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const path = `${directory}/${item.name}`;
    if (item.isDirectory()) paths.push(...(await walk(path)));
    else paths.push(path);
  }
  return paths.sort();
}
async function canonical() {
  const response = await fetch(base, { cache: "no-store" });
  assert.equal(response.status, 200);
  assert.deepEqual(Buffer.from(await response.arrayBuffer()), expected);
}
await canonical();
const hosted = [];
const paths = await walk("dist");
let next = 0;
await Promise.all(
  Array.from({ length: 4 }, async () => {
    while (next < paths.length) {
      const file = paths[next++];
      const local = await readFile(file);
      const path = file.slice(5);
      const response = await fetch(new URL(path, base), { cache: "no-store" });
      assert.equal(response.status, 200, path);
      const remote = Buffer.from(await response.arrayBuffer());
      assert.deepEqual(remote, local, path);
      hosted.push({ path, bytes: local.length, sha256: hash(local) });
    }
  }),
);
hosted.sort((a, b) => a.path.localeCompare(b.path));
const records = [];
const waitText = (page, id, text) => page.locator(`#${id}`).filter({ hasText: text }).waitFor();
async function save(page, button, path) {
  const pending = page.waitForEvent("download");
  await page.locator(`#${button}`).click();
  const d = await pending;
  assert.equal(await d.failure(), null);
  await d.saveAs(path);
  return readFile(path);
}
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
      await context.addInitScript(() => {
        const create = URL.createObjectURL.bind(URL);
        window.psephosAuditBlobs = new Map();
        URL.createObjectURL = (blob) => {
          const url = create(blob);
          window.psephosAuditBlobs.set(url, blob);
          return url;
        };
      });
      const page = await context.newPage(),
        errors = [],
        external = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("request", (r) => {
        if (/^https?:/.test(r.url()) && new URL(r.url()).origin !== new URL(base).origin)
          external.push(r.url());
      });
      await page.goto(base);
      await waitText(page, "offline-status", "This edition is available offline,");
      assert.equal(
        await page.locator('meta[name="psephos-edition"]').getAttribute("content"),
        expectedEdition,
      );
      await page.locator("#issue").focus();
      await page.keyboard.press("Enter");
      await page.locator("#cast").click();
      await page.locator("#count-bronze").click();
      await waitText(page, "verdict", "Equal votes");
      await page.locator("#inspect-inference").click();
      await waitText(page, "inference-results", "252 arrangements fit");
      await page.locator("#inference").screenshot({ path: `${out}/${name}-${width}-possible.png` });
      for (let i = 0; i < 5; i++) await page.locator(`#known-${i}`).check();
      await waitText(page, "inference-results", "choice is forced: solid");
      await page.locator(".audit > summary").click();
      await page.locator("#audit-replace").click();
      assert.equal(await page.locator("#inspect-inference").isDisabled(), true);
      await waitText(page, "inference-results", "original bronze count is needed");
      await page.locator("#audit-none").click();
      await waitText(page, "inference-results", "choice is forced: solid");
      const displayed = {};
      for (const [id, path] of [
        ["tie", "sources/kenyon-p68.jpg"],
        ["imprint", "sources/kenyon-imprint.jpg"],
      ]) {
        if (id === "tie") {
          await page.locator("#reading").selectOption(id);
          await waitText(page, "scan-status", "Page LXVIII checked");
          await page.locator("#greek button").filter({ hasText: "ἂν δὲ ἴσαι" }).click();
          await waitText(page, "phrase-note", "feminine plural");
          await page.locator("#cite").click();
        } else {
          await page.locator("#scan-page").selectOption(id);
          await waitText(page, "scan-status", "Page Imprint checked");
        }
        const sha = await page.locator("#scan").evaluate(async (img) => {
          const bytes = await window.psephosAuditBlobs.get(img.src).arrayBuffer();
          return [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))]
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
        });
        assert.equal(sha, assets.find((a) => a.path === path).sha256);
        displayed[path] = sha;
      }
      await page
        .locator("#note")
        .fill(
          "The five known pierced choices force Juror 10 to be solid. With no individual choices known, five/five admits 252 assignments. The concealed grip and the published count reveal different information.",
        );
      const json = JSON.parse(await save(page, "save-json", `${out}/${name}-${width}.json`));
      assert.equal(json.version, 2);
      assert.deepEqual(json.knowledge, { target: 9, known: [0, 1, 2, 3, 4], inspected: true });
      const htmlPath = `${out}/${name}-${width}.html`;
      const html = await save(page, "save-html", htmlPath);
      const embedded = [...html.toString().matchAll(/data:[^;]+;base64,([A-Za-z0-9+/=]+)/g)].map(
        (m) => Buffer.from(m[1], "base64"),
      );
      for (const item of assets)
        assert.ok(
          embedded.some((b) => hash(b) === item.sha256),
          item.path,
        );
      const standalone = await context.newPage(),
        requested = [];
      standalone.on("request", (r) => {
        if (/^https?:/.test(r.url())) requested.push(r.url());
      });
      await standalone.goto(`file://${htmlPath}`);
      assert.deepEqual(requested, []);
      assert.equal(
        await standalone.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        true,
        "Standalone overflow",
      );
      await standalone
        .locator(".assignment-pair")
        .first()
        .screenshot({ path: `${out}/${name}-${width}-portable-assignments.png` });
      await standalone.close();
      await context.setOffline(true);
      await page.reload();
      await waitText(page, "offline-status", "This edition is available offline,");
      await waitText(page, "inference-results", "choice is forced: solid");
      const offline = await save(page, "save-html", `${out}/${name}-${width}-offline.html`);
      assert.equal(hash(offline), hash(html));
      await page.locator("#preset").selectOption("empty");
      for (let i = 0; i < 10; i++) {
        await page.locator("#issue").click();
        await page.locator("#cast").click();
      }
      await page.locator("#count-bronze").click();
      await page.locator("#inspect-inference").click();
      await waitText(page, "inference-results", "Unanimity is enough");
      await waitText(page, "inference-results", "1 arrangement fits");
      await context.setOffline(false);
      await page.locator("#open-file").setInputFiles({
        name: "legacy-court.json",
        mimeType: "application/json",
        buffer: Buffer.from(original),
      });
      await waitText(page, "file-status", "Court record reopened");
      assert.equal(await page.locator("#note").inputValue(), JSON.parse(original).note);
      await page.locator("#inspect-inference").click();
      await waitText(page, "inference-results", "252 arrangements fit");
      const migrated = JSON.parse(
        await save(page, "save-json", `${out}/${name}-${width}-migrated.json`),
      );
      assert.equal(migrated.version, 2);
      assert.deepEqual(migrated.knowledge.known, []);
      assert.deepEqual(errors, []);
      assert.deepEqual(external, []);
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        true,
      );
      records.push({
        browser: name,
        version: browser.version(),
        width,
        expectedEdition,
        splitAndForcedChoices: true,
        alteredCountRefusedForInference: true,
        unanimityOperatedOffline: true,
        legacyRecordMigrated: true,
        displayedSourceBytes: displayed,
        embeddedFileIdentities: assets.length,
        connectedHtmlSha256: hash(html),
        offlineHtmlSha256: hash(offline),
        errors,
        external,
      });
      await context.close();
      await canonical();
      console.log(
        `${name}/${width}: ${base} -> count, inference, source bytes, portable record, offline unanimity, old-record migration`,
      );
    }
  } finally {
    await browser.close();
  }
}
await canonical();
await writeFile(
  `${out}/receipt.json`,
  `${JSON.stringify({ base, publicHost: new URL(base).hostname === "antonsoo.github.io", requestRedirection: false, hosted, canonicalRecheckedAfterEveryJourney: true, records }, null, 2)}\n`,
);
