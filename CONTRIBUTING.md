# Contributing

Run `npm ci`, `npm run check`, and `npm run dev` with Node 24 or later.
Keep legal rules, source transcription, drawing and browser interaction separate.
Before changing a historical claim, inspect the complete retained page and its
apparatus. Document uncertainty and translation decisions in
`docs/source-and-model.md`.

Retained sources have file identities in both `src/asset-manifest.json` and
`public/sources/manifest.json`. Updating an identity is a source review decision:
visually check the actual content, record the upstream file and any conversion
in `public/sources/provenance.json`, update both manifests, and run
`npm run verify:sources`. A correct filename or caption is not evidence that a
replacement image is the right page.

Use `npm run format` after source edits. For UI or export changes, build and
run `npm run test:browser` with Playwright's Chromium and Firefox available.
The driver starts its own origin and writes disposable output under
`test-results/browser/`. Review desktop and 375px screenshots, actual native
downloads, the reopened HTML, and the PDF; automated counts alone do not
establish a useful learner experience.

Do not commit `dist/`, uncompressed generated HTML, credentials or tracking.
Keep one compact example, source notices and a concise review receipt.
