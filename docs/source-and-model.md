# The claim and its witness

The question is procedural: what is visible, which ballot is authoritative,
and what determines the outcome? This is not a simulator of a whole legal system.

## Exact mapping

| Source                               | Operable rule                                                                                       | Boundary                                                                              |
| ------------------------------------ | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| 68.2, opening through λαμβάνωσι      | Issue one pierced and one solid; refuse two of the same                                             | Refusal is app feedback; historical enforcement is not reconstructed                  |
| 68.3, final clause                   | Bronze counts; wood holds the unused vote; show a narrow opening                                    | Vessel outline is new; the opening is a precaution, not a proof of perfect prevention |
| 68.4, from the herald's announcement | Pierced supports first speaker; solid later speaker; conceal the axle; cast to the two destinations | The app combines the deposits into one action and isolates two views of the ends      |
| 69.1, opening                        | All have voted before the effective urn is emptied onto a board                                     | Ten jurors and a two-by-five board are modern teaching choices                        |
| 69.1, verdict clause                 | More wins; equal favors defendant                                                                   | A count of unused ballots or an extra-ballot exercise is not assigned a legal verdict |

The source's prosecution/defense terminology in 69.1 is displayed beside the
speaking-order terminology of 68.4. Neither ballot is inherently “valid” before
it is chosen and placed in the authoritative urn.

## Printed page identities

Internet Archive's derived PDF and original JP2 sequence differ because an
earlier scan is excluded from the PDF. Their zero-based indexes cannot be
substituted for one another. The image headings and paragraph boundaries were
visually inspected.

| Retained image   | Printed heading | Original JP2 leaf | Derived PDF page | Reading                   |
| ---------------- | --------------- | ----------------- | ---------------- | ------------------------- |
| `kenyon-p67.jpg` | LXVII           | 81                | 81               | 68.2–3; beginning of 68.4 |
| `kenyon-p68.jpg` | LXVIII          | 82                | 82               | 68.4 continued; 69.1–2    |

The complete archive page is rescaled proportionally to fit 1800×3000 pixels,
JPEG quality 90. No project crop, redrawing or recoloring is applied.
The upstream image hashes, URLs and conversion are in
`public/sources/provenance.json`; final hashes are in `manifest.json`.

The review caught and corrected a preceding-page image returned under the
initial assumed JP2 index. All retained artifacts and final browser review
were regenerated after the source correction.

## Transcription policy

The Greek follows Kenyon's **1920 printed witness**, not an unqualified
reconstruction of a papyrus. The ancient work survives with damage and
editorial intervention. Line-break hyphenation is joined; apostrophes,
punctuation and capitalization at excerpt openings are normalized. Words,
sub-word supplies, and editorial brackets are retained.

| Selection     | Editorial feature preserved    | Reading implication                                                            |
| ------------- | ------------------------------ | ------------------------------------------------------------------------------ |
| Urns, 68.3    | `[ἐμβάλλῃ]`                    | The editor supplies the verb in the prevention clause                          |
| Grip, 68.4    | `λα[βὼν ἅμα]`, `[αὐλίσκον]`    | The printed taking-together wording and tube are supplied in part              |
| Count, 69.1   | `διε[ψηφισ]μένοι`, `ὅ[πως]`    | Damage and restoration remain visible within words                             |
| Count, 69.1   | `[[δηλονότι τοῖς ἀντιδίκοις]]` | The apparatus treats this as a gloss to exclude; English keeps double brackets |
| Verdict, 69.1 | `[ἀριθμὸν]`                    | The editor supplies “number”; the tie clause itself is unbracketed             |

The count excerpt reads `καὶ ταῦτα ὅ[πως] αἱ κυρίαι προκείμεναι`, as in this
print. The retained Perseus XML instead reads `ἵν’ αὗται φανεραὶ προκείμεναι`.
The grip excerpt likewise follows the print's `λα[βὼν ἅμα]` rather than the
XML's `λαβόμενος`. These are substantive differences, not an OCR normalization.
The unchanged XML is a comparison witness under its own CC BY-SA license.

New English aims to make the clauses inspectable, not to reproduce Kenyon's
English translation. Sub-word supplies are sometimes bracketed as a complete
English phrase for readability. The contextual word notes are teaching aids,
not a general lexicon or a complete grammar.

## Model deductions and additions

Every simulated cast puts one ballot in each urn and uses opposite kinds.
Therefore pierced counts across both urns sum to the number of voters, as do
solid counts. The unused urn's distribution complements the effective urn's
distribution. This is a deduction from the paired model, not an additional
quotation from the ancient work.

The ten-person panel gives a small inspectable equality case. The application
does not infer that actual juries had ten members, or infer historical jury-size
rules from the damaged numerical passage in 68.1. It avoids that passage.

“Insert one” and “replace one” are modern interventions on a derived view.
An extra ballot changes the total. Replacing a solid with a pierced ballot
preserves the total while changing the split by one on each side. The latter
can reverse the original five-five outcome. This establishes a limit of that
single arithmetic check, not a judgment about the effectiveness of all ancient
precautions. No statistical or security guarantee is claimed.

The app keeps both accepted and refused attempts. Counted positions, results
and text are recomputed from the selected starting facts and action sequence.
Imported computed outcomes are rejected. The pinned observation and written
explanation are retained separately from procedural undo.

## Archaeological comparison and omissions

The photograph is Zde's image of bronze ballots displayed at the Museum of
the Ancient Agora. The approximate date around 300 BCE comes from that
photographer's caption. The institutional object comparison is the
Canellopoulos Museum's fourth-century ballot, Χ 600. The photograph is not a
dimensional specification or a claim that this particular object was used in
the text's described proceedings.

The work is conventionally attributed to Aristotle; authorship is debated.
This lesson concerns its late fourth-century institutional description. It
does not claim to reconstruct all periods of Athenian law. The app omits
allotment, qualifications, pay-tokens, evidence challenges, timing, penalty
assessment, particular causes of action, and historical litigation. Participation
was restricted and unequal. No modern legal advice or real dispute is modeled.
