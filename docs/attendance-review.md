# Attendance, allotment and work-preservation audit

The attendance bench exposes a missing condition in a full-row allotment model:
sufficient total arrivals do not guarantee sufficient arrivals in each letter
group. It makes that condition editable and inspectable, without inventing a
historical turnout rate or an official response absent from the ancient text.
The exact model and source boundaries are in [attendance-model.md](attendance-model.md).

## Try the actual work

Open [Who turns up?](https://antonsoo.github.io/psephos/attendance.html#attendance).
With four possible people in each group and a request for two:
1. Keep the initial `4–3–2–1–0` attendance. There are ten present and no complete
   row. Exchange A for E twice, then B for D once. The same total now supplies
   two complete rows. No person changed their letter group.
2. Inspect exact chances. An unknown uniform ten-person subset meets the request
   in `7,776 / 184,756` cases, about `4.21%`. The visible vector already determines
   its own feasibility; the probability concerns a **new unknown sample**.
3. Open the weighted patterns. There are 381 vectors at this total, but they
   have unequal weights. `2–2–2–2–2` represents 7,776 individual subsets;
   `4–3–2–1–0` represents 96. Choose a pattern to construct it at the same total.
4. Construct a failure just below the guarantee. `4–4–4–4–1` fails at total 17.
   Add one attendee to E. At total 18, no group in this finite population can be
   below two. Change the population and request to test the general bound.
5. Read **Letters within a tribe**, select **παραπλησίως ἴσοι**, and inspect the
   complete printed leaf. Approximately equal registered groups do not determine
   daily arrivals. Switch to the row clause and compare the two printed LXIV pages.
6. Keep your explanation, save editable JSON, CSV, SVG and the illustrated reading.
   Open the HTML locally and download its native JSON. Greek, five full primary
   images, actual fonts and licenses are embedded; no scripts or network are needed.
   The large weighted appendix remains in HTML/CSV but is omitted from printing.
7. Reopen JSON. Copy an explicit study link: both boards survive, the explanation
   stays out, and editing does not silently change the address. There is no autosave.

## Try the row-selection comparison

Open [One cube. Five tickets.](https://antonsoo.github.io/psephos/allotment.html#allotment).
Keep the default A1/B1 board and inspect chances. Move the second ticket down:
the individual chances stay `1/2`, but both-selected changes from `1/2` to `1/6`.
The kept comparison records that difference. Choose a colour strip with the
keyboard; focus remains available. Undo all four cubes and release a random
one: it has no chosen prefix. Read **One white cube, five tickets**, select its
Greek phrase, and inspect the complete page and the separate inserter clause.
The [earlier detailed journey](allotment-review.md#try-the-actual-work) covers the
unknown-placement assumption and portable studies.

## Defects reproduced before repair

The previous local allotment delivery was independently replayed from its retained
production build, rather than accepted from its review. The [before receipt](attendance-review/allotment-before.json)
and [after receipt](attendance-review/allotment-after.json) use the same operated cases.

| Trigger                                              | Observed before                              | Behavior after                                           |
| ---------------------------------------------------- | -------------------------------------------- | -------------------------------------------------------- |
| Press Enter on an enumerated colour order            | Re-render loses keyboard focus to BODY       | Focus remains on the corresponding order                 |
| Restore a kept board or clear it                     | Replaced comparison control loses focus      | Restore retains focus; clear returns to Keep             |
| Undo all cubes in a chosen order, then draw randomly | Retains a misleading chosen-prefix label     | Empty history restores random provenance                 |
| Firefox at 320px                                     | Native file input pushes document wider      | Document fits; ticket buttons remain at least 44px       |
| New edition waiting while earlier tabs stay open     | Repeated reload can keep earlier worker      | Separate notice explains save, close all tabs and reopen |
| Delayed attendance import after another file or edit | New functionality required explicit ordering | Newer selection and intervening work are preserved       |

The update review goes beyond a notice assertion: two workshops hold the earlier
edition, a waiting update exists, an old document is evicted, the incompatible
network document is refused, both tabs withdraw readiness, editable work is saved,
all app tabs close, the update activates, and both boards plus the explanation
reopen. The restored study then works offline. No unsaved work is silently replaced.

## Reproduce the production review

Build output is `dist/`, base `/psephos/`, with ballot, allotment and attendance
entry points. The local review uses one frozen build, edition
`5202dfb54367e0771cc2`: 34 precached files (5,011,814 bytes), plus the worker.

```sh
npm ci
npm run check
npm run test:attendance
python3 scripts/attendance-oracle.py test-results/attendance/oracle-input.json --csv examples/attendance-study.csv
npm run test:attendance-faults
npm run test:allotment
python3 scripts/allotment-oracle.py test-results/allotment/oracle-input.json
npm run test:allotment-audit
npm run test:browser
npm run test:audit
npm run test:update
```

The check passed lint, strict types, 27 semantic tests, retained-file identities,
source/phrase mappings and production build. The attendance browser matrix covers
Chromium/Firefox at 1440, 375 and 320px. It operates exchanges, keyboard controls,
sampling, pattern weights, guarantee witness, Greek, imports, links, native
downloads, script-free HTML and a real server outage. All 14 embedded source,
font and license identities match; offline export of the reopened same study is
byte-identical to the online export. Automated accessibility checks with the
exact tables open found no violations; this is not a full assistive-technology study.

The independent Python attendance oracle enumerates vectors rather than using
the application's polynomial calculation: **36 rendered configurations and 1,196
exact curve points**, plus complete CSV pattern lists for both boards. The row
oracle independently checks **60 configurations and 1,320 colour orders**.
Neither program imports application code.

## Retained receipts

| Boundary                                                             | Evidence                                                                                                                     |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Primary PDF retrieved and rendered again                             | [Source verification](attendance-review/source-verification.json)                                                            |
| Local complete check                                                 | [Check log](attendance-review/check.log)                                                                                     |
| Attendance learner matrix                                            | [Browser receipt](attendance-review/attendance-browser.json)                                                                 |
| Independent attendance numbers                                       | [Oracle result](attendance-review/attendance-oracle.json), [rendered inputs](attendance-review/attendance-oracle-input.json) |
| Export cancellation, source substitution, snapshot and stale imports | [Fault receipt](attendance-review/attendance-faults.json)                                                                    |
| Corrected row behavior                                               | [Before](attendance-review/allotment-before.json), [after](attendance-review/allotment-after.json)                           |
| Existing allotment and ballot journeys                               | [Allotment](attendance-review/allotment-browser.json), [ballots](attendance-review/ballot-regression.json)                   |
| Independent row numbers                                              | [Oracle result](attendance-review/allotment-oracle.json), [rendered inputs](attendance-review/allotment-oracle-input.json)   |
| Current retention and two-tab damage/recovery                        | [Offline regression](attendance-review/offline-regression.json)                                                              |
| Waiting edition and saved-work migration                             | [Update journey](attendance-review/edition-update.json)                                                                      |
| Clean installation/build and public availability                     | [Publication record](attendance-publication.md), recorded separately after deployment                                        |

The primary PDF was retrieved independently and pages 76–78 rendered again;
all three retained images match the renderer's output byte for byte. Complete
pages were visually inspected for readings and editorial supplies, including the
repeated LXIV heading. The external scholarly article is linked, not retained.

## Visual and portable review

All browser screenshots were opened for visual inspection, including both engines
at all three widths. The short A–E headings avoid the earlier overlapping “Group A”
labels at 320px. The groups' filled/absent slots and quota line duplicate the
numeric counts; Add and Remove remain keyboard-operable. Exact tables have a
labelled local scrolling region. The model does not require deciphering the curve:
the exact table and weighted list provide its numbers.
- [Operated comparison, desktop](assets/attendance-balanced-1440.png).
- [Operated comparison, phone](assets/attendance-balanced-375.png).
- [320px board](assets/attendance-balanced-320.png).
- [Greek and primary witness](assets/attendance-reader-1440.png).
- [Phone reader](assets/attendance-reader-375.png).
- [Editable example](../examples/attendance-study.json), [CSV](../examples/attendance-study.csv),
  [SVG](../examples/attendance-counts.svg), [compressed HTML](../examples/attendance-reading.html.gz),
  [13-page print example](../examples/attendance-reading.pdf).

The PDF's diagrams, comparison, curve, Greek and full-page witnesses were rendered
and inspected. This is a digital PDF review, not a physical printing claim.
The full-row constraint, equal finite groups and uniform sampling remain explicit
modern assumptions. They do not recover daily Athenian turnout or establish how
ancient officials handled shortages.
