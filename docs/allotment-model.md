# One cube, five tickets

This is a modern probability experiment alongside a source reading. It is not a
complete simulation of Athenian selection, a reconstructed release mechanism,
or an estimate of historical fraud rates.

## The primary witness

Read Kenyon's _Aristotelis Atheniensium Respublica_, first published Oxford 1920,
chapters 63.2–64.4. The scanned copy lists reprints through 1958. The complete
newly retained PDF pages 76–78 were independently downloaded, rendered and
visually inspected, including their apparatus. The PDF has SHA-256
`2769f1feea49780c864ce0118723f02082df9177ede52ff511574f5fdcb9ba91`.
- [The copy at Internet Archive](https://archive.org/details/aristotelisathen00aris).
- [Chapter 63, leaf 76](https://archive.org/details/aristotelisathen00aris/page/n76/mode/1up).
- [Chapter 64, leaf 77](https://archive.org/details/aristotelisathen00aris/page/n77/mode/1up).
- [Following context, leaf 78](https://archive.org/details/aristotelisathen00aris/page/n78/mode/1up).
- [Retained provenance](../public/sources/allotment-provenance.json).
- [Exact asset manifest](../public/sources/allotment-manifest.json).

The chapter-64 page actually prints **LXIV**, where sequential pagination would
suggest LXIII. The next leaf also prints LXIV. These are two different pages;
selecting by heading alone would be ambiguous. The workshop identifies both
heading and archive leaf. It neither silently relabels nor crops the witness.

The selected Greek is newly transcribed from these pixels, not copied from the
existing lesson's Perseus file. Brackets retain Kenyon's supplies, including
partial words (`δέ[ῃ λαχεῖν]`, `[ἀριθμό]ν`) and the supply crossing the boundary
between two words (`[πέντε ἐ]ν`). Punctuation and elision apostrophes are normalized.
Close English and contextual word notes are new; the apparatus remains available
to question this particular edition rather than treating its supplies as undamaged
ancient writing.

The [Center for Hellenic Studies' jury-selection account](https://www-current.chs.harvard.edu/discussion-series-athenian-law-lectures-5/)
explains the usual material interpretation: letters over vertical ticket slots,
white/black lots deciding horizontal rows, then a separate courtroom assignment.
The schematic adopts that row interpretation. The ancient text by itself does
not specify the app's hardware drawing, a random-number algorithm, or statistical
independence of ticket placement.

## What the words support

| Passage   | Source statement                                                                             | Workshop consequence                                                                     |
| --------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 63.2      | Two allotment devices for each tribe                                                         | One displayed device is only part of a tribe's procedure                                 |
| 63.4      | Ten approximately equal letter groups, tribe by tribe                                        | Columns are groups within one tribe, not different tribes                                |
| 64.2      | An allotted inserter puts tickets into the matching letter frame; five frames in each device | Tickets stay within their column; free swapping is a modern intervention                 |
| 64.3      | Bronze black/white cubes; one per five tickets                                               | A full five-ticket row shares a decision                                                 |
| 64.3, end | The inserter is included in the number                                                       | No ordinary-ticket row chance is assigned to him; total historical quota is not computed |
| 64.4      | Selected jurors draw a further lot for a court                                               | Both selected for service does not mean both in the same court                           |

A–E and the numbers are **modern teaching identifiers**, not reproductions or
transliterations of ancient Greek inscriptions. They distinguish invented
identities while the source reader supplies the actual Greek. Choosing five
represented letter groups, four/six/eight complete rows, and equal full columns
are explicit instructional choices. Real attendance, vacancies, inserter places,
uneven groups, all ten tribes, historical stopping rules and subsequent court
assignment remain outside the model. Drawing every row is an explanatory
completion. A fixed cube quota selects `5W` ordinary tickets on this board, not
a claimed complete ancient jury.

## Condition on a fixed placement

Let `R` be the number of full rows and `W` the number of white cubes. A uniform
permutation of `W` distinguishable white and `R-W` distinguishable black cubes
has `R!` orders. Each colour string corresponds to `W! (R-W)!` of them. Therefore
all `choose(R,W)` colour strings have the same probability.

Each ordinary ticket has marginal selection probability `W/R`. For two distinct
tickets:

| Fixed placement | Both selected     | Second selected given first |
| --------------- | ----------------- | --------------------------- |
| Same row        | `W/R`             | `1`                         |
| Different rows  | `W(W-1)/(R(R-1))` | `(W-1)/(R-1)`               |

For `R=4`, `W=2`, individual chances stay `1/2` when B1 changes rows. The joint
chance changes from `1/2` to `1/6`; the conditional chance changes from `1` to
`1/3`. Both differ from independent per-person coin tossing.

After a prefix of cubes, the model filters the same complete strings to those
matching that prefix. It counts the surviving events exactly. If the first
identity has already been rejected, conditioning on its selection has a zero
denominator: the conditional chance is **undefined**, not zero.

The diagram and outcome strips expose every colour string. Choosing one records
a chosen example; it does not claim a fresh random trial. Random release uses
Web Crypto with rejection sampling to choose uniformly from the remaining cube
slots. Fisher–Yates shuffles stay within columns. All random and chosen studies
are editable; undo is a teaching action, not a physical lottery receipt.

## Before placement is known

The optional second question introduces **another modern assumption**: each full
column is independently and uniformly shuffled, followed by a uniform cube order.
For two tickets in different columns, their ordered row positions are uniform
across `R²` possibilities. The average joint selection chance is `(W/R)²`, so
their selections are independent before placement is observed. That includes both
same-row and different-row possibilities; it does not contradict the fixed-board
calculation. Two tickets in one column must occupy different rows, so their joint
chance remains `W(W-1)/(R(R-1))`.

The app counts every relevant ordered pair of row positions and colour string;
the independent oracle uses exact closed forms. These shuffle assumptions are
not inferred from the ancient text. The two questions distinguish the information
being conditioned on rather than declaring a general historical independence
result. The optional calculation deliberately ignores the displayed placement and
recorded draw, as its heading says.

## Records and portable work

An editable version-1 allotment file contains both complete boards, both pairs,
white supply, ordered released cubes, whether a chosen prefix was used, and a
bounded explanation. Derived probabilities are recomputed, never trusted from a
file. Duplicate/missing tickets, impossible cube prefixes, invalid pair identities,
unknown formats and excessive input are refused without replacing current work.
An import also refuses to overwrite edits made while its file was being read.

The explicit study link contains the two experiments and draws, but excludes the
explanation. Editing does not rewrite the address. The page does not autosave.

The CSV carries current/kept placements, prefix and mode, fixed-placement chances,
unknown-placement chances and every colour order. It does not include free-text
notes that could become spreadsheet formulas. JSON and illustrated HTML preserve
the explanation. The SVG describes only the current board and its fixed-placement
before-draw joint chance. The illustrated HTML embeds all five source images
(three new pages plus the existing title and imprint), actual fonts and licenses,
Greek/English/word notes, exact chances, both boards and native JSON/CSV/SVG links.
It needs no script or connection; its CSP excludes executable content.

Each source/font/license asset is length- and SHA-256-checked before display or
export. Source failures withdraw the complete edition's readiness, including in
an already open ballot lesson. All HTML entries receive the same content-derived
edition ID; rebuilding an annotated tree strips old metadata first. A source
response arriving after another page was selected cannot replace the newer page.
A detached image is decoded before replacing the visible witness, avoiding
Firefox's reused-image decode race.
