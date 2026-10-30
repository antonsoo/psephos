# Psephos review

This is a **local, unpublished edition**. No GitHub repository, hosted bytes,
remote CI result, or deployment is claimed. The prepared build command is
`npm run build`, output `dist/`, base `/psephos/`.

## Reproduce the learner's work

1. Start the production preview. Receive a pair; pin the covered observation.
2. Select pierced. The private choice changes; the isolated observer SVG stays
   identical. Expose the ends and the distinction becomes visible.
3. Cover the ends, select solid and cast. Open bronze: five pierced, five solid,
   defendant wins. Open the Greek tie clause and select `ἂν δὲ ἴσαι`.
4. In the modern counting experiment, insert one pierced ballot. Eleven ballots
   fail the ten-juror total. Replace one solid instead: six/four still total ten.
5. Write an explanation and cite the clause. Save the illustrated record. Open
   it without a connection, download its editable JSON, and reopen that JSON.
6. Try “The wrong urn”: bronze is three/seven after the last solid vote; wood is
   seven/three. The latter gets no legal verdict.

The exercise is grounded in the
[source-to-action map and transcription audit](source-and-model.md). The small
panel and deliberate interventions remain explicitly modern.

## Observed browser behavior

Command: `npm run test:browser`. The driver serves the built edition on its own
temporary origin; generated working files go to `test-results/browser/`.
The retained [receipt](review/browser.json) records Chromium and Firefox at
1440×1000 and 375×1000, plus one adversarial-source context per browser.

All four viewport journeys operated the actual controls, including a keyboard
pair issue, faulty-pair refusal, concealed/exposed views, tie, both urns,
extra/replaced ballots, source phrases, panning, citations, notes, undo and redo.
They saved native JSON, SVG and illustrated HTML; reopened the script-free HTML;
and reopened its native editable-record download. Clipboard denial exposed a
selected ordinary link, which reopened the complete record. Editing did not
silently change the URL.

Every illustrated record embedded all **13** retained source, image, font,
license and provenance files with matching SHA-256 identities. The three image
elements contained both correct complete pages and the museum photograph.
The reopened HTML made no HTTP requests. No JavaScript page errors or external
origin requests occurred in the four app journeys. Axe reported no violations
in the reviewed states; this is not a human assistive-technology assessment.

The real origin server was stopped with `navigator.onLine` still true. Document
reload, source viewing and a second native illustrated export succeeded. Each
offline export matched the connected export byte for byte. Damaging the exact
edition's cached source then removed the readiness claim and refused the
missing valid bytes. Restoring the origin repaired the inventory and source
view. The check requires the affirmative readiness sentence, not a substring
that could also match “not fully available offline.”

Additional contexts refused a same-length source whose bytes were changed,
recovered after that route was removed, ignored a late preceding-page response,
preserved the export's earlier explanation while the live one changed, canceled
preparation without losing work, and refused to let a delayed file import
overwrite a newly edited explanation.

## Actual artifacts and visual review

The [artifact receipt](review/artifacts.json) pins the examples below:
- [Editable record](../examples/last-vote-record.json)
- [Count SVG](../examples/last-vote-count.svg)
- [Complete illustrated record, gzip](../examples/last-vote-record.html.gz)
- [Ten-page tagged A4 PDF](../examples/last-vote-record.pdf)

The PDF was produced from the actual downloaded HTML in Chromium. `pdfinfo`
reports ten pages, tagging, no JavaScript and no encryption. Text extraction
retains the Greek. Rendered pages were visually checked for flow, complete
source pages, photograph, source credits and the sample explanation. Physical
printing is untested.

All twelve browser screenshots were visually inspected. The retained selection
shows the [desktop opening](assets/workbench-1440.png),
[375px opening](assets/workbench-375.png),
[altered count](assets/altered-count-1440.png),
[Greek beside the full witness](assets/reading-1440.png), and
[Firefox phone reading](assets/reading-firefox-375.png).
The cool green stage keeps the two ballot ends distinct, the controls have
room to operate, and the reading remains legible on a phone. The phone lesson
is deliberately a long single column. The simplified end views and urns should
be read as diagrams; they do not reproduce finger anatomy or vessel archaeology.

The source review caught an off-by-one JP2 mapping and corrected the actual
images, not just their labels. Better source resolution also exposed additional
editorial supplies, which were transcribed accurately before regenerating all
retained artifacts. The final witness is printed LXVII/LXVIII, archive leaves
81/82; the source audit records the substantive differences from Perseus.

## Build and publication boundaries

`npm run check` passes lint, strict type checking, seven focused tests, all
13 retained-file checks and a production build. The exhaustive model exercise
covers all 1,024 ten-vote assignments. It checks the defined arithmetic and
source-concordance table; it is not independent scholarly review.

The [clean-install receipt](review/clean-build.json) records a fresh archive of
`ab62d8a`, Node **24.22.2**, and successful `npm ci`, `npm run check` and
the documented `gzip -dk` command. All **19** complete output files, **2,835,311
bytes**, match the reviewed Node 26 build byte for byte. The worker's verified
cache inventory contains 18 files; the generated worker itself is the nineteenth
output file. The [development receipt](review/development.json) separately
operates the pair, tie and correct source page from that clean checkout using
the documented `npm run dev` command, with no worker installed and no page or
console errors.

Browser evidence, clean-build identity and any future
publication must remain separate claims. The CI and branch-based Pages workflows
are prepared. Their checkout and setup-node `v7` tags were resolved read-only;
no workflow was remotely executed.

Suggested repository description: **Cast a concealed Athenian jury ballot,
audit the count, and read the Greek beside the printed witness.**

Suggested topics: `ancient-greek`, `athens`, `aristotle`, `legal-history`,
`interactive-learning`, `digital-humanities`, `offline-first`.
