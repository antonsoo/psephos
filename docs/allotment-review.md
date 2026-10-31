# Jury allotment workshop review

The new `allotment.html` makes a question operable that the ballot lesson did
not address: how fixed ticket placement changes the chance that two ordinary
jurors enter the service pool together. An additional experiment changes the
information assumption, averaging over independently uniform letter-column
placements before a uniform cube draw.

The reviewed source consists of `6082e50` (model and sources), `8699ca6` (UI and
portable work) and `016ce9a` (browser/oracle review and saved examples). The
receipts below concern **local source and production behavior**. No push,
deployment, hosted-byte comparison, registry release or remote CI success is
asserted for this addition. The existing live-site link remains the ballot
lesson; the new page is available in this checkout and its production build.

## Try the actual work

With Node 24 or later and the repository's installed Playwright Chromium and
Firefox browsers:

```sh
npm ci
npm run check
npm run preview
```

Open `http://127.0.0.1:4381/psephos/`, follow **Allot the jurors**, and:
1. Keep A1 and B1 in row 1 with four full rows and two white cubes. Press
   **Keep this board**, then **Inspect exact chances**.
2. Focus B1 and press Enter. Focus B2 and press Enter. Both individual chances
   remain `1/2`; joint selection becomes `1/6`, against `1/2` on the kept board.
3. Open **What if the placement is still random?** Both selected is `1/4` under
   the separately stated independent-column shuffle assumption, ignoring the
   displayed placement. Change the second identity to A2: same-column tickets
   cannot share a row, and the unknown-placement joint chance is `1/6`.
4. Return to A1/B1. Apply `W W B B`, then undo three cubes. Row 1 is selected;
   row 2's chance is `1/3`. Applying a strip records a **chosen** example.
   Reset, release four random cubes and verify exactly two whites and two blacks.
5. Read **One white cube, five tickets**, select its Greek phrase, then inspect
   the inserter exception and the courtroom purpose clause. Enlarge and pan the
   complete page. Switch leaf 77 to leaf 78: both really print LXIV.
6. Write an explanation. Save JSON, CSV, SVG and the illustrated reading. Open
   the HTML locally; its five scanned images, Greek, fonts, notes and native
   study download work without scripts or any network request. Print it.
7. Reopen the JSON and copy the explicit study link. Both boards and draws
   survive; the explanation is excluded from the link. Editing does not change
   the current address. This page does not autosave.

The board excludes the already chosen inserter and does not compute a total
historical jury quota. The source's letter groups are within a tribe; the modern
A–E tags and numbered identities are not ancient inscriptions. Both selected
for service does not mean assigned to the same court. The complete model,
editorial decisions and formulas are in [allotment-model.md](allotment-model.md).

## Reproduce the review

Production build output is **`dist/`**, base **`/psephos/`**, with `index.html` and
`allotment.html`. The browser scripts start their own production servers and
use real server outages, rather than synthesizing successful offline responses.

```sh
npm run test:allotment
python3 scripts/allotment-oracle.py test-results/allotment/oracle-input.json
npm run test:browser
npm run test:audit
```

The normal check runs lint, strict type checking, 21 semantic tests, retained
source/font/license identity checks, viewer/phrase mappings and a production
build. The independent Python program imports no application code: it checks
rendered chances against `fractions.Fraction` closed forms, and displayed orders
against `itertools.combinations`. It covers all 15 allowed row/quota pairs, both
pair relations and both browser engines: **60 setups and 1,320 colour orders**.
It also checks the separately displayed unknown-placement chances.

To independently check the retained source images, obtain the primary PDF and
render the exact cited pages. This needs `curl`, Python and Poppler's `pdftoppm`:

```sh
curl -L --fail -o kenyon.pdf https://archive.org/download/aristotelisathen00aris/aristotelisathen00aris.pdf
npm run verify:allotment-source -- --pdf kenyon.pdf
```

The verifier checks the primary PDF's hash, renders pages 76–78 at 2100 pixels
with JPEG quality 90, and byte-compares those complete images with the retained
ones. Poppler/JPEG version differences can change encoded bytes; do not infer a
wrong source from an encoding mismatch without checking versions and pixels.
The retrieved PDF and independently viewed archive leaf 77 agree on the chapter,
editorial supplies, apparatus and repeated LXIV heading. The supplied transcript
is a reading of Kenyon's pixels, with normalized punctuation, rather than an
uncorrected import from the pre-existing Perseus comparison file.

## Retained evidence

| Boundary                    | Result and artifact                                                                                                                                                                                                                                        |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Starting behavior           | [baseline.json](allotment-review/baseline.json): original ballot page, no allotment control or route                                                                                                                                                       |
| Primary artifact            | [source-verification.json](allotment-review/source-verification.json): independent PDF hash and exact three-page render comparison                                                                                                                         |
| Clean installation          | [clean-install.log](allotment-review/clean-install.log), [clean-check.log](allotment-review/clean-check.log): archived source, fresh dependencies, complete check                                                                                          |
| Built files                 | [build-identity.json](allotment-review/build-identity.json): all 31 files, including the worker, identical between clean and working builds                                                                                                                |
| Rebuilding annotated output | [rebuilt-edition.json](allotment-review/rebuilt-edition.json): unchanged bytes and one shared edition tag in each entry                                                                                                                                    |
| Documented commands         | [quickstart.json](allotment-review/quickstart.json): both dev and preview opened through the ballot-page navigation and operated                                                                                                                           |
| New learner journeys        | [browser.json](allotment-review/browser.json): Chromium/Firefox at 1440/375, no page errors, no external requests, no automated accessibility violations                                                                                                   |
| Independent numbers         | [oracle.json](allotment-review/oracle.json), [rendered cases](allotment-review/oracle-input.json)                                                                                                                                                          |
| Existing ballot lesson      | [ballot-regression.json](allotment-review/ballot-regression.json): casting, counts, inference, sources, downloads, outage, recovery, fault cases                                                                                                           |
| Worker transitions          | [offline-regression.json](allotment-review/offline-regression.json): corrupted retention, ordinary image requests, two-tab readiness, ignored foreign messages, waiting/active edition change                                                              |
| Portable result             | [Editable study](../examples/allotment-study.json), [CSV](../examples/allotment-study.csv), [SVG](../examples/allotment-board.svg), [compressed HTML](../examples/allotment-reading.html.gz), [12-page printed reading](../examples/allotment-reading.pdf) |

The new browser review verifies all **14** retained allotment asset identities
inside real illustrated downloads, including the five complete printed images
and actual font/license bytes. The reopened reading makes no HTTP requests.
Its native JSON download exactly matches the saved study. Export under an actual
server outage is byte-identical to the connected export of that same record.

Worker-free fault cases reject a same-length substituted source, preserve edits
on failed export, support export cancellation, capture the study when export
starts, and ignore a delayed old scan after another page is selected. The script
also refuses malformed imported columns without changing the current study.
A corrupted new scan in the current edition withdraws readiness from both the
allotment page and an already open ballot tab; reconnection repairs retention and
restores both without losing the explanation. A separate 50-switch Firefox
run reproduced the reused-image decoding problem and passed after detached
image decoding was introduced.

## Visual review and limits

Actual screenshots were opened and inspected, not accepted from HTTP status or
DOM assertions. The board uses five ordinary letter columns, with tracked
identities and W/B text duplicating colour. At 375 pixels the slot targets are
at least 44 by 44 pixels; the reader, controls and saved HTML fit without page
horizontal scrolling. Source images enlarge and pan with arrow keys. Low-contrast
dimming of incompatible outcomes was replaced with a dashed border and explicit
text. Long hashes wrap in the portable reading. Returning from enlarged to fitted
source view resets the pan to the top.
- [Opening](assets/allotment-opening-1440.png).
- [Operated comparison, desktop](assets/allotment-comparison-1440.png).
- [Operated comparison, phone](assets/allotment-comparison-375.png).
- [Greek and printed source, desktop](assets/allotment-reader-1440.png).
- [Greek and printed source, phone](assets/allotment-reader-375.png).

The PDF was also rendered and visually inspected: current and kept diagrams,
both information assumptions, exact tables, explanation, Greek/English and whole
source pages survive printing. This is a digital PDF review, not a physical
printing claim. Automated accessibility checks do not substitute for a full
assistive-technology user study. Historical attendance, incomplete rows, the
inserter's counting convention, total jury quotas and later courtroom assignment
remain outside the model.

For a future publication, review the source first, then publish the complete
`dist/` together; a second page must not be uploaded with stale worker metadata.
Only after hosted bytes and the public browser journey are checked should a new
Officina workshop route or live-edition claim be added. No catalogue link has
been made to an unavailable page during this local delivery.

Suggested repository description: “Operate Athenian jury allotment and voting;
read the Greek and inspect the exact chances.” Topics: `ancient-greek`, `athens`,
`sortition`, `probability`, `education`, `history`, `offline-first`.
