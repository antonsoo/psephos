import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium, firefox } from "playwright";
import { reviewServer } from "./review-server.mjs";

const out = resolve(process.argv[2] || "test-results/three-workshop-recovery");
await mkdir(out, { recursive: true });
const server = reviewServer("dist"),
  results = [];
const sha = (b) => createHash("sha256").update(b).digest("hex");
const source = JSON.parse(await readFile("src/allotment-assets.json", "utf8")).find(
  (f) => f.path === "sources/kenyon-leaf76.jpg",
);
const has = (p, id, text) => p.locator(`#${id}`).filter({ hasText: text }).waitFor();
const ready = (p) => has(p, "offline-status", "This edition is available offline,");
async function save(page, id) {
  const next = page.waitForEvent("download");
  await page.locator(`#${id}`).click();
  const d = await next;
  assert.equal(await d.failure(), null);
  return readFile(await d.path());
}
await server.start();
try {
  for (const [name, engine] of [
    ["chromium", chromium],
    ["firefox", firefox],
  ]) {
    const browser = await engine.launch();
    try {
      const context = await browser.newContext({ acceptDownloads: true }),
        pages = [],
        errors = [];
      for (const route of ["", "allotment.html", "attendance.html"]) {
        const p = await context.newPage();
        p.on("pageerror", (e) => errors.push(e.message));
        await p.goto(server.base + route);
        await ready(p);
        pages.push(p);
      }
      const [ballot, rows, attendance] = pages;
      await ballot.locator("#issue").click();
      await ballot.locator("#cast").click();
      await ballot.locator("#count-bronze").click();
      await ballot
        .locator("#note")
        .fill(
          "Keep the equal-vote observation while another workshop discovers damaged retention.",
        );
      await rows.locator("#keep-board").click();
      await rows.locator("#move-second").click();
      await rows
        .locator("#allotment-note")
        .fill("Keep the joint-chance comparison while attendance repairs its source page.");
      await attendance.locator("#attendance-pin").click();
      await attendance.locator("#attendance-balanced").click();
      await attendance
        .locator("#attendance-note")
        .fill("Keep the same-total comparison through a real outage and shared recovery.");
      await server.stop();
      await context.setOffline(true);
      await attendance.evaluate(async () => {
        const e = document.querySelector('meta[name="psephos-edition"]').content;
        await (await caches.open(`psephos-${e}`)).put(
          new URL("sources/kenyon-leaf76.jpg", location.href),
          new Response("Damaged attendance source."),
        );
      });
      await attendance.locator("#allotment-retry").click();
      await has(attendance, "allotment-scan-status", "does not match this edition");
      for (const p of pages) await has(p, "offline-status", "not fully available offline");
      assert.equal(await attendance.locator("#allotment-scan").isHidden(), true);
      const controls = ["save-json", "allotment-save-json", "attendance-save-json"],
        before = [];
      for (let i = 0; i < pages.length; i++) before.push(await save(pages[i], controls[i]));
      assert.equal(JSON.parse(before[2]).current.counts.join(), "2,2,2,2,2");
      assert.equal(JSON.parse(before[2]).pinned.counts.join(), "4,3,2,1,0");
      await server.start();
      await context.setOffline(false);
      for (const p of pages) await ready(p);
      await attendance.locator("#allotment-retry").click();
      await has(attendance, "allotment-scan-status", "checked against");
      const repaired = await attendance.evaluate(async () => {
        const e = document.querySelector('meta[name="psephos-edition"]').content;
        const response = await (await caches.open(`psephos-${e}`)).match(
          new URL("sources/kenyon-leaf76.jpg", location.href),
        );
        return [
          ...new Uint8Array(await crypto.subtle.digest("SHA-256", await response.arrayBuffer())),
        ]
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
      });
      assert.equal(repaired, source.sha256);
      for (let i = 0; i < pages.length; i++)
        assert.deepEqual(await save(pages[i], controls[i]), before[i]);
      assert.deepEqual(errors, []);
      results.push({
        browser: name,
        allThreePagesControlled: true,
        realServerOutage: true,
        attendanceSourceDamageWithdrawsAllReadiness: true,
        editableWorkSavedDuringOutage: true,
        allThreeReadyAfterRepair: true,
        repairedSourceSha256: repaired,
        allThreeRecordsByteIdenticalAfterRecovery: before.map(sha),
        errors,
      });
      console.log(
        `${name}: three workshops, real outage, shared damage, all notes/boards preserved and exact source repaired`,
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
