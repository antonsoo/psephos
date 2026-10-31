import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium, firefox } from "playwright";

const base = new URL(process.argv[2] || "https://antonsoo.github.io/psephos/").href;
const out = resolve(process.argv[3] || "test-results/public-workshops");
await mkdir(out, { recursive: true });
const sha = (b) => createHash("sha256").update(b).digest("hex");
const manifest = JSON.parse(await readFile("src/allotment-assets.json", "utf8"));
const inventory = [];
async function walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const path = `${dir}/${e.name}`;
    if (e.isDirectory()) await walk(path);
    else {
      const b = await readFile(path);
      inventory.push({ path: path.slice(5), bytes: b.length, sha256: sha(b) });
    }
  }
}
await walk("dist");
inventory.sort((a, b) => a.path.localeCompare(b.path));
async function canonical(all = false) {
  const files = all
    ? inventory
    : inventory.filter((f) =>
        ["index.html", "allotment.html", "attendance.html", "sw.js"].includes(f.path),
      );
  for (const f of files) {
    const r = await fetch(new URL(f.path, base), { cache: "no-store" });
    assert.equal(r.status, 200, f.path);
    assert.equal(sha(Buffer.from(await r.arrayBuffer())), f.sha256, f.path);
  }
}
await canonical(true);
const edition = (await readFile("dist/attendance.html", "utf8")).match(
  /name="psephos-edition" content="([a-f0-9]+)"/,
)[1];
const records = [];
const has = (p, id, text) => p.locator(`#${id}`).filter({ hasText: text }).waitFor();
async function save(p, id, path) {
  const pending = p.waitForEvent("download");
  await p.locator(`#${id}`).click();
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
    for (const width of [1440, 375, 320])
      for (const lesson of ["attendance", "allotment"]) {
        const context = await browser.newContext({
          viewport: { width, height: 1000 },
          acceptDownloads: true,
        });
        await context.addInitScript(() => {
          const create = URL.createObjectURL.bind(URL);
          window.auditSourceBlobs = new Map();
          URL.createObjectURL = (b) => {
            const u = create(b);
            window.auditSourceBlobs.set(u, b);
            return u;
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
        await page
          .getByRole("link", {
            name: lesson === "attendance" ? "Who turns up?" : "Allot the jurors",
            exact: true,
          })
          .click();
        await has(page, "offline-status", "This edition is available offline,");
        assert.equal(
          await page.locator('meta[name="psephos-edition"]').getAttribute("content"),
          edition,
        );
        assert.equal(await page.evaluate(() => !!navigator.serviceWorker.controller), true);
        if (lesson === "attendance") {
          await page.locator("#attendance-pin").click();
          await page.locator("#attendance-exchange").focus();
          await page.keyboard.press("Enter");
          await page.keyboard.press("Enter");
          await page.locator("#attendance-from").selectOption("1");
          await page.locator("#attendance-to").selectOption("3");
          await page.locator("#attendance-exchange").click();
          await has(page, "attendance-summary", "Every group meets");
          await has(page, "attendance-comparison", "A group is short");
          await page.locator("#attendance-inspect").click();
          await has(page, "attendance-probability", "7,776 / 184,756");
          await page
            .locator("#attendance-note")
            .fill(
              "The same ten arrivals can fail or meet the group request. This is a modern model, not recovered Athenian turnout.",
            );
        } else {
          await page.locator("#keep-board").click();
          await page.locator("#inspect-chances").click();
          await page.locator("#move-second").click();
          await has(page, "chances", "1/6");
          await has(page, "pinned-board", "1/2");
          const order = page.locator(".order-strip").first();
          await order.focus();
          await page.keyboard.press("Enter");
          assert.equal(
            await page.evaluate(() => document.activeElement?.classList.contains("order-strip")),
            true,
          );
          for (let i = 0; i < 4; i++) await page.locator("#undo-cube").click();
          await page.locator("#release-cube").click();
          assert.doesNotMatch(await page.locator("#draw-message").textContent(), /chosen prefix/);
          await page
            .locator("#allotment-note")
            .fill(
              "Moving B1 changes the joint chance from 1/2 to 1/6 while each individual remains 1/2.",
            );
        }
        await page
          .locator(`#${lesson === "attendance" ? "attendance" : "allotment"}`)
          .screenshot({ path: resolve(out, `${name}-${width}-${lesson}.png`) });
        await page.locator("#allotment-reading").selectOption("letters");
        await has(page, "allotment-scan-status", "checked against");
        const displayed = await page.locator("#allotment-scan").evaluate(async (img) => {
          const blob = window.auditSourceBlobs.get(img.src);
          if (!blob) throw new Error("Displayed witness was not retained as a blob.");
          return [
            ...new Uint8Array(await crypto.subtle.digest("SHA-256", await blob.arrayBuffer())),
          ]
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
        });
        assert.equal(
          displayed,
          manifest.find((a) => a.path === "sources/kenyon-leaf76.jpg").sha256,
        );
        const prefix = lesson === "attendance" ? "attendance" : "allotment";
        const jsonPath = resolve(out, `${name}-${width}-${lesson}.json`);
        const json = await save(page, `${prefix}-save-json`, jsonPath);
        const htmlPath = resolve(out, `${name}-${width}-${lesson}.html`);
        const html = await save(page, `${prefix}-save-html`, htmlPath);
        const embedded = [...html.toString().matchAll(/data:[^;]+;base64,([A-Za-z0-9+/=]+)/g)].map(
          (m) => sha(Buffer.from(m[1], "base64")),
        );
        for (const a of manifest) assert.ok(embedded.includes(a.sha256), a.path);
        const portable = await context.newPage(),
          requests = [];
        portable.on("request", (r) => {
          if (/^https?:/.test(r.url())) requests.push(r.url());
        });
        await portable.goto(`file://${htmlPath}`);
        assert.deepEqual(requests, []);
        assert.equal(await portable.locator("script").count(), 0);
        const native = portable.locator(`a[download="psephos-${lesson}.json"]`);
        const pending = portable.waitForEvent("download");
        await native.click();
        const reopened = await pending;
        assert.deepEqual(await readFile(await reopened.path()), json);
        assert.ok(
          await portable.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        );
        await portable.close();
        await context.setOffline(true);
        await page.reload();
        await has(page, "offline-status", "This edition is available offline,");
        await page.locator(`#${prefix}-open`).setInputFiles(jsonPath);
        await has(
          page,
          `${prefix}-file-status`,
          lesson === "attendance" ? "Attendance reopened" : "Study reopened",
        );
        const offline = await save(
          page,
          `${prefix}-save-html`,
          resolve(out, `${name}-${width}-${lesson}-offline.html`),
        );
        assert.equal(sha(offline), sha(html));
        assert.deepEqual(errors, []);
        assert.deepEqual(external, []);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        records.push({
          browser: name,
          version: browser.version(),
          width,
          lesson,
          edition,
          displayedSourceSha256: displayed,
          embeddedIdentities: manifest.length,
          htmlSha256: sha(html),
          offlineByteIdentical: true,
          nativePortableStudyIdentical: true,
          errors,
          external,
        });
        await context.close();
        await canonical();
        console.log(
          `${name}/${width}: public ${lesson}, operated model, source bytes, portable study, offline reload`,
        );
      }
  } finally {
    await browser.close();
  }
}
await canonical(true);
await writeFile(
  resolve(out, "receipt.json"),
  `${JSON.stringify({ date: new Date().toISOString(), base, canonicalRecheckedAfterEveryJourney: true, inventory, records }, null, 2)}\n`,
);
