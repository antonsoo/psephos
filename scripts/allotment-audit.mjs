import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium, firefox } from "playwright";
import { reviewServer } from "./review-server.mjs";

const root = resolve(process.argv[2] || "dist");
const out = resolve(process.argv[3] || "test-results/allotment-audit");
const baseline = process.argv.includes("--baseline");
await mkdir(out, { recursive: true });
const server = reviewServer(root);
const results = [];
await server.start();
try {
  for (const [name, engine] of [
    ["chromium", chromium],
    ["firefox", firefox],
  ]) {
    const browser = await engine.launch();
    try {
      const page = await browser.newPage({ viewport: { width: 375, height: 1000 } });
      await page.goto(`${server.base}allotment.html`);
      await page.locator("#allotment-scan-status").filter({ hasText: "checked against" }).waitFor();
      await page.locator("#inspect-chances").click();
      await page.locator('[data-order="0"]').focus();
      await page.keyboard.press("Enter");
      const orderFocus = await page.evaluate(() => ({
        tag: document.activeElement.tagName,
        order: document.activeElement.getAttribute("data-order"),
      }));
      assert.equal(orderFocus.tag, baseline ? "BODY" : "BUTTON");
      if (!baseline) assert.equal(orderFocus.order, "0");
      for (let i = 0; i < 4; i++) await page.locator("#undo-cube").click();
      await page.locator("#release-cube").click();
      const drawMessage = await page.locator("#draw-message").textContent();
      assert.equal(drawMessage.includes("chosen prefix"), baseline);
      await page.locator("#reset-cubes").click();
      await page.locator("#keep-board").click();
      await page.locator("#restore-kept").focus();
      await page.keyboard.press("Enter");
      const restoreFocus = await page.evaluate(() => document.activeElement.id);
      assert.equal(restoreFocus, baseline ? "" : "restore-kept");
      if (!baseline) {
        await page.locator("#clear-kept").focus();
        await page.keyboard.press("Enter");
        assert.equal(await page.evaluate(() => document.activeElement.id), "keep-board");
        await page.locator("#release-cube").focus();
        for (let i = 0; i < 4; i++) await page.keyboard.press("Enter");
        assert.equal(await page.evaluate(() => document.activeElement.id), "undo-cube");
        await page.locator("#reset-cubes").click();
      }
      await page.setViewportSize({ width: 320, height: 800 });
      const pageWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const ticket = await page.locator(".ticket").first().boundingBox();
      if (!baseline) {
        assert.equal(pageWidth, 320);
        assert.ok(ticket.width >= 44 && ticket.height >= 44);
        await page
          .locator("#allotment")
          .screenshot({ path: resolve(out, `${name}-320-keyboard.png`) });
      }
      results.push({
        browser: name,
        baseline,
        orderFocus,
        restoreFocus,
        drawMessage,
        viewportWidth: 320,
        pageWidth,
        ticketWidth: ticket.width,
        ticketHeight: ticket.height,
      });
    } finally {
      await browser.close();
    }
  }
} finally {
  await server.stop();
}
const entry = await readFile(`${root}/allotment.html`);
await writeFile(
  resolve(out, "receipt.json"),
  `${JSON.stringify({ baseline, entrySha256: createHash("sha256").update(entry).digest("hex"), results }, null, 2)}\n`,
);
console.log(
  `${baseline ? "Baseline defects reproduced" : "Corrections verified"}: both engines, focus, draw provenance, 320px layout.`,
);
