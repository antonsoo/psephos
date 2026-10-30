import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

import { sourcePages } from "../src/source-pages.ts";

const manifest = JSON.parse(await readFile("src/asset-manifest.json", "utf8"));
assert.deepEqual(JSON.parse(await readFile("public/sources/manifest.json", "utf8")), manifest);
assert.equal(await readFile("LICENSE", "utf8"), await readFile("public/LICENSE.txt", "utf8"));
for (const item of manifest) {
  const bytes = await readFile(`public/${item.path}`);
  assert.equal(bytes.length, item.bytes, item.path);
  assert.equal(createHash("sha256").update(bytes).digest("hex"), item.sha256, item.path);
  if (item.printedPage) assert.equal(bytes.subarray(0, 3).toString("hex"), "ffd8ff", item.path);
}
console.log(
  `${manifest.length} source, font and license files match their retained SHA-256 identities.`,
);

const provenance = JSON.parse(await readFile("public/sources/provenance.json", "utf8"));
for (const page of Object.values(sourcePages)) {
  const retained = manifest.find((item) => item.path === page.image);
  const origin = provenance.pages.find((item) => item.path === page.image);
  assert.equal(retained?.printedPage, page.label, page.image);
  assert.equal(origin?.leaf, page.leaf, page.image);
  assert.equal(origin?.printedPage, page.label, page.image);
}
console.log("All four source-viewer entries match the retained page and archive-leaf mapping.");
