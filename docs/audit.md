# Audit of Psephos

The initial local edition was `3c2c1e5`. This audit starts from that checkout
and reopens its evidence rather than treating a prior passing receipt as proof.

## A source failure contradicted the readiness footer

With the worker controlling the page and its full inventory initially retained,
the audit set each browser offline, damaged the source in the exact named cache,
and pressed Reload page. The source viewer refused it, but the footer still
said every source page was available. This was reproduced in Chromium and
Firefox. The earlier driver had manually dispatched `visibilitychange` before
checking readiness, which concealed the missing automatic update.

[Observed before](audit/readiness-before.json) ·
[Observed after](audit/readiness-after.json) ·
[Independent offline/update audit](audit/offline.json).

Verified asset failures now trigger an inventory check; the footer withdraws
its affirmative claim while that check runs. The worker separately notifies
its controlled pages when ordinary image/file requests discover missing or
damaged storage. Only the current controller and matching edition can cause
that notification to be accepted. Canceled source requests do not cause an
integrity warning.

`npm run test:audit` verifies the fix without a synthetic inventory event. It
also tests another cache holding a healthy copy, an uncached navigation, recovery
when the real origin returns, and a two-edition transition. Edition A keeps its
own files while B waits. After A's last page closes, B activates, old caches are
removed, and the saved explanation reopens. This is separate from a browser's
simulated offline flag and from a successful initial installation.

## A grip is not a guarantee about a later count

The original workbench could demonstrate concealed ends, but did not let a
learner distinguish that physical observation from a deduction after counting.
The new investigation makes that distinction operable. It requires an original,
complete bronze count and states every assumed known individual choice.

| Evidence at five pierced / five solid; target Juror 10 | Assignments | Target pierced | Target solid |
| ------------------------------------------------------ | ----------: | -------------: | -----------: |
| No individual choices known                            |         252 |            126 |          126 |
| Jurors 1–4 known pierced                               |           6 |              1 |            5 |
| Jurors 1–5 known pierced                               |           1 |              0 |            1 |

The learner can inspect two arrangements with identical evidence and different
target choices, then remove that ambiguity by adding assumptions. Nine other
choices are sufficient, but need not be necessary. A unanimous count fixes all
choices with no other individual knowledge. These are counts of logical
possibilities, not probabilities of human behavior. The labels are modern
teaching devices, not historical identifying marks. This does not reconstruct
ancient surveillance or establish how an actual juror voted.

The inference enumerates all 1,024 assignments. A separate factorial/binomial
oracle checks every tally and every possible distribution of assumed known
choices, for both end targets. It checks witness validity as well as counts.
The interface rejects the unused urn and deliberate count alterations, which
break the model premise. See the [equations and boundaries](source-and-model.md#deducing-a-hidden-choice).

Version 2 stores the target, explicit known-choice assumptions and inspection
state. Authentic version 1 records migrate with their procedural facts,
explanation, citations and pin preserved, and with no invented known choices.
An export freezes those assumptions along with the written explanation while
its source bytes are being prepared.

## The edition date did not identify the physical copy

Reopening the actual archive front matter exposed a bibliographic distinction:
the title names Kenyon and Clarendon; the imprint says first published 1920,
then lists reprints in 1925, 1937, 1951 and 1958. The catalogue's 1920 date does
not by itself date the scanned physical copy. The app now retains both full
pages, presents them in the source viewer and portable record, and states that
distinction. Original JP2 leaves 7/8 identify title/imprint; 81/82 identify the
printed text pages LXVII/LXVIII. The mapping is centralized and checked against
provenance, rather than duplicated in the viewer and audit script.

The image review also rechecked the supplied words and the double-bracketed
gloss against the complete printed pages, including the critical apparatus.
The [transcription audit](source-and-model.md#transcription-policy) keeps
substantive differences from the retained Perseus XML visible.

## Try the actual work

1. In **Cast the last ballot**, receive the pair. Pin the covered observation.
   Change solid to pierced: the private choice changes while the isolated
   observer drawing remains identical. Expose the ends to see the distinction.
2. Cover both ends, choose solid, cast and count bronze. The teaching panel is
   five/five; the tie rule favors the defendant. Read 69.1 and select
   `ἂν δὲ ἴσαι`. Cite the passage in your record.
3. Open **What can the count reveal?** Inspect with no other choices known:
   252 arrangements fit, with both target choices possible. Mark Jurors 1–5
   known: the target must be solid. Unmark Juror 5: six arrangements remain,
   including one with target pierced. The public count has not changed.
4. In the counting experiment replace a solid ballot with pierced. The total
   stays ten but the result changes. The inference refuses this altered count.
   Restore the original count; your observer assumptions return.
5. Select **Imprint** in the full-page viewer. Read the first-publication date
   and later reprints on the actual page. Write an explanation and save the
   illustrated record. Open it from disk, inspect the deduction and all four
   printed pages, download its native JSON, and reopen it in the app.
6. After the production footer confirms this edition's full inventory, disconnect
   and reload. Create an empty panel, cast ten solid choices and inspect:
   unanimity fixes the target without assuming any individual choice known.

Ten jurors, earlier votes, labels and the observer's assumptions are explicitly
modern. The app stores private choices; this is a learning tool, not a private
voting system or a model of an entire ancient trial.

## Observed local behavior and artifacts

The [complete browser receipt](audit/browser.json) covers Chromium and Firefox
at 1440×1000 and 375×1000. It operates casting, concealed/exposed views, both
urns, interventions, Greek phrases, the 252-to-one deduction, fewer known votes,
undo/redo, citations, explicit shared links and native downloads. All reviewed
states had zero Axe violations, page errors and external requests. This is not
a human assistive-technology assessment.

A separately stopped real origin, while `navigator.onLine` remains true,
permits reload, full-source viewing and another illustrated export. Connected
and disconnected exports match byte for byte. The [independent offline audit](audit/offline.json)
checks automatic withdrawal of readiness, ordinary image requests, named-cache
isolation, foreign notifications, origin recovery and waiting-edition activation.

The separate [production-journey driver](audit/production-journey-local.json)
compares every built file and operates all four browser/viewport combinations.
It hashes the bytes actually displayed as text-page and imprint images, checks
unanimity while offline, imports the authentic old record, and opens the actual
illustrated export on a phone. It uses no request redirection. Its recorded
localhost URL is local evidence, not a hosted-publication claim.

Every illustrated export embeds all **15** retained files with matching SHA-256
identities, including **five images**: two text pages, title, imprint and the
museum photograph. Fonts, source/license notices, provenance and the unchanged
comparison XML are actual embedded bytes. The script-free artifact makes no
HTTP requests when reopened. The [current artifact receipt](audit/artifacts.json)
pins the [editable record](../examples/last-vote-record.json),
[SVG](../examples/last-vote-count.svg),
[illustrated HTML, gzip](../examples/last-vote-record.html.gz) and
[browser-printed PDF](../examples/last-vote-record.pdf).

All twenty app screenshots and four standalone phone/desktop board screenshots
were visually inspected. The [desktop](assets/inference-1440.png) and
[phone](assets/inference-375.png) deduction views keep assumptions separate
from the exact table and witnesses. Portable records stack their boards on a
phone. The long mobile lesson deliberately retains the same reading order.
The 14-page tagged A4 PDF was rendered and visually inspected on every page.
The audit corrected a split comparison table and added page margins; complete
source-page headings and scans now stay on the same page. The PDF contains no
JavaScript or encryption and preserves extractable Greek. Physical printing is
untested.

## Build and publication evidence

The original [pre-audit review](review.md) remains historical evidence of its
own earlier build. Current validation uses `npm run check`, `npm run test:browser`,
`npm run test:audit` and `npm run test:public`. The build output is `dist/`,
base `/psephos/`. A clean Node 24 archive, public file identities, public browser
behavior, pinned-source access and remote CI are separate evidence boundaries.
The [fresh-archive receipt](audit/clean-build.json) records Node **24.22.2**,
`npm ci`, the full check and the documented gzip command. All **21** output
files (**3272335 bytes**) match the reviewed Node 26 build byte for byte;
20 belong to the verified offline inventory and the worker is the remaining
file. The [development receipt](audit/development.json) separately operates the
casting, inference and imprint with the documented development command and
no worker installed. Publication receipts will identify the reviewed source
and deployed edition.


## Initial public edition

[Open Psephos](https://antonsoo.github.io/psephos/). The reviewed source is
`2deaf7db790c343b8a6fbfedb6f88ee2755a04e1`; the deployed `gh-pages` commit is
`e1568f63fe5c54cfb40adf14384681fd32c68861`, edition
`80a1776f6e15df80ae5d`. Documentation-only commits following that review did not change that build.
The multi-page follow-up below supersedes its worker.

The [public-browser receipt](audit/public-browser.json) compares **every one of
21 hosted build files** byte for byte with the reviewed `dist/`, without request
redirection. It rechecks the canonical entry after each journey and at the end.
Chromium and Firefox, each at 1440 and 375 pixels, cast and count, operate the
252-to-one deduction, reject altered evidence, read and cite Greek, verify the
bytes actually displayed as the text page and imprint, and save native files.
The real downloaded standalone HTML opens at both widths without HTTP requests
or horizontal overflow. Disconnected reload, an identical illustrated export,
unanimity from an empty panel and authentic version 1 migration also pass on
the public edition. All eight public screenshots were visually inspected.

The [public-source receipt](audit/public-source.json) separately fetches **26
files at the immutable source commit**, including the review, screenshots,
all four native examples, model/reader/source mapping and all 15 retained
source/font/license assets. Each matches the actual Git object byte for byte.
A correct caption or HTTP 200 alone is not the basis for this result.

GitHub's branch-based **pages build and deployment** completed successfully.
The source **Check** and **Pages** workflows returned failure with empty step
lists. Those runs are not passing source CI, and are not used as evidence for
the local application build or the public learner journey. Their IDs, results
and available job steps are retained in the source receipt.


## Multi-page follow-up

A second pass caught a gap in the first fix. The page that discovered a bad
source withdrew readiness, but another open page kept its affirmative claim.
This was reproduced against the public edition in both browsers; the
[before receipt](audit/multi-page-before.json) preserves both footers.

Inventory inspection now notifies all controlled pages when it discovers
storage damage, including failures first found by a page's direct cached read.
The worker sends one invalidation per damaged episode. It verifies the entire
stored inventory before announcing restoration; all pages then recheck that
inventory. A single successful download cannot establish readiness. This
avoids a notification/reinspection feedback loop while also notifying other
pages when the origin returns without a browser `online` event.

The [fresh Node 24 build](audit/multi-page/clean-build.json) matches all 21 files
of the reviewed Node 26 output. The native JSON, SVG and illustrated HTML are
unchanged. The [complete browser regression](audit/multi-page/local-browser.json)
repeats casting, the deduction, source readings, actual artifacts and real
outages at both widths in both engines. All twenty screenshots were visually
inspected. The [two-page audit](audit/multi-page/local-readiness.json) checks
both footers on failure and recovery, rejects foreign notifications, checks
that a repeated failure produces no additional invalidation, and exercises a
waiting edition. The earlier receipts remain evidence of their own builds.
