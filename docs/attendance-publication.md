# Three-workshop publication, 2026-10-31

The reviewed Psephos edition is available at:
- [Who turns up?](https://antonsoo.github.io/psephos/attendance.html#attendance)
- [One cube. Five tickets.](https://antonsoo.github.io/psephos/allotment.html#allotment)
- [Two ballots. One unseen vote.](https://antonsoo.github.io/psephos/#workbench)

The [audit](attendance-review.md) records the original local defects and operated
repairs; [the attendance model](attendance-model.md) keeps source evidence and
modern assumptions separate. The earlier local-only allotment review is retained
as a historical record, not presented as evidence of this publication.

| Boundary                      | Observed result                                                                                                               |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Reviewed source               | `7842151`; clean-install evidence committed in `6a807c3`                                                                      |
| Production                    | `npm ci` then `npm run check`, output `dist/`, base `/psephos/`                                                               |
| Build identity                | All 35 files identical between working and fresh-install builds                                                               |
| Edition                       | `5202dfb54367e0771cc2`; 34 precached files, 5,011,814 bytes, plus `sw.js`                                                     |
| Source publication            | Initial source/evidence push `6a807c3`; later commits add documentation and example wording without changing runtime bytes    |
| Pages publication             | Fast-forward `gh-pages` commit `1d68af56f2697db63d9210eb195f0c1333d287dd`; native Pages build reports `built` for that commit |
| Canonical bytes               | All 35 public files match the reviewed build, including every source, font, license and worker                                |
| Public new-workshop matrix    | Chromium and Firefox at 1440, 375 and 320px; both workshops, 12 journeys                                                      |
| Public existing ballot matrix | Chromium and Firefox at 1440 and 375px; four journeys                                                                         |
| Remote workflow boundary      | Check and Pages runs for `6a807c3` report failure with zero executed steps; no remote CI success is claimed                   |
| Registry                      | No registry release or version tag                                                                                            |

[Machine-readable deployment/workflow receipt](attendance-review/publication.json),
[clean build inventory](attendance-review/clean-build.json),
[public workshop receipts and hosted identities](attendance-review/public-workshops.json),
[public ballot receipt](attendance-review/public-ballots.json).

The public workshop journeys begin at the ballot page and use its actual
navigation. Each operates the new model, inspects the displayed source-image
bytes, saves native JSON and an illustrated reading, checks all 14 embedded
asset identities, opens the script-free reading without network requests, and
downloads its identical native JSON. After current-worker takeover, the network
is disabled, the public page is reloaded, the saved study reopened, and its new
HTML export must be byte-identical. Canonical entries and the worker are checked
again after every journey; the complete hosted inventory is checked at both ends.
No application request is redirected to a local successful response.

The separate public ballot review operates casting, altered counts, deduction,
source bytes, portable records, offline unanimity and old-record migration.
Local review additionally stops the real server, damages retained files, and
operates a waiting-edition migration across two workshops. A final
[three-workshop recovery](attendance-review/three-workshop-recovery.json) opens
ballots, row selection and attendance together, damages the attendance source
during an actual server outage, checks all three withdrawn readiness statuses,
saves each editable study, reconnects and repairs the exact source hash, and
requires every saved record to remain byte-identical after recovery. Public offline mode
and a local physical server outage are distinct observations.

All screenshots were visually inspected. The standalone example's explanation
was subsequently made natural prose while retaining an escaped ampersand; it was
saved again through the actual controls and its 13-page tagged PDF inspected.
That artifact wording change does not alter the production application.

Reproduce against the reviewed `dist/`:

```sh
node scripts/public-workshops.mjs https://antonsoo.github.io/psephos/ test-results/public-workshops
node scripts/public-browser.mjs https://antonsoo.github.io/psephos/ test-results/public-ballots
node scripts/three-workshop-recovery.mjs
```

A browser's verified offline edition can later be evicted by the browser.
Readiness is an observation about the complete current cache, not a permanent
storage guarantee. Save the editable study and illustrated reading when the
work must survive eviction or a future edition change.
