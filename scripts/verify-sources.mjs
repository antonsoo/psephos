import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

import { allotmentPages, allotmentReadings } from "../src/allotment-readings.ts";
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

const allotmentManifest = JSON.parse(await readFile("src/allotment-assets.json", "utf8"));
assert.deepEqual(
  JSON.parse(await readFile("public/sources/allotment-manifest.json", "utf8")),
  allotmentManifest,
);
for (const item of allotmentManifest) {
  const bytes = await readFile(`public/${item.path}`);
  assert.equal(bytes.length, item.bytes, item.path);
  assert.equal(createHash("sha256").update(bytes).digest("hex"), item.sha256, item.path);
}
console.log(
  `${allotmentManifest.length} allotment source, font and license identities also match.`,
);

const allotmentOrigin = JSON.parse(
  await readFile("public/sources/allotment-provenance.json", "utf8"),
);
for (const page of allotmentPages) {
  assert.ok(
    allotmentManifest.some((item) => item.path === page.path),
    page.path,
  );
  const origin = allotmentOrigin.pages.find((item) => item.path === page.path);
  if (origin) {
    assert.equal(origin.archiveLeaf, page.leaf, page.path);
    assert.ok(page.label.startsWith(origin.printedHeading), page.path);
  } else {
    const shared = provenance.pages.find((item) => item.path === page.path);
    assert.equal(shared?.leaf, page.leaf, page.path);
  }
}
for (const reading of allotmentReadings) {
  assert.ok(
    allotmentPages.some((page) => page.id === reading.leaf),
    reading.id,
  );
  for (const [phrase] of reading.phrases) assert.ok(reading.greek.includes(phrase), phrase);
}
console.log(
  "All five allotment viewer entries and contextual phrase links match their source records.",
);
