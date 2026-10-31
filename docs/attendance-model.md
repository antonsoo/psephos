# Enough people, not enough in each group

`attendance.html` asks a different question from `allotment.html`: can the
arrivals supply the full rows that the row-selection experiment assumes?
The learner keeps the total constant while exchanging **who attends**. Nobody
changes their registered letter group. A count is an observed condition; a
probability describes a separately stated unknown sample.

## Primary evidence and its limit

The retained witness is F. G. Kenyon, _Aristotelis Atheniensium Respublica_,
Oxford, first published 1920; the scanned imprint records reprints through 1958.
The work is conventionally attributed to Aristotle. Chapter 63.4 describes ten
approximately equal letter groups **within each tribe**. Chapter 64.2 describes
five frames on a device; 64.3 describes one cube per five tickets, also counting
the previously chosen inserter. The text does not specify a response to
insufficient daily attendance in a letter group.

| Claim                                 | Retained witness                         | What this does not establish                              |
| ------------------------------------- | ---------------------------------------- | --------------------------------------------------------- |
| Registered groups approximately equal | 63.4, archive leaf 76, printed LXII      | Equal numbers actually arriving on a particular day       |
| Five frames per device                | 64.2, archive leaf 77, printed LXIV      | Our finite group sizes or attendance counts               |
| One cube per five tickets             | 64.3, archive leaf 77                    | A historical rule cancelling a court for incomplete rows  |
| Inserter already counted separately   | 64.3, archive leaf 78, also printed LXIV | Inclusion of that person in ordinary-ticket probabilities |
| Subsequent courtroom allotment        | 64.4, archive leaf 78                    | That all selected people share a court                    |

The three full pages, title and imprint, Greek transcription, new English,
phrase notes, provenance, licenses and file identities are shared with the
[row-selection source audit](allotment-model.md). The two LXIV headings are
retained as printed, with the archive leaf identifying each image. The new
attendance reader initially opens the registered-groups clause.

Historical jury service concerned eligible male citizens with age and status
restrictions (63.3). The population below does not represent all Athenians.
David C. Mirhady and Carl Schwarz, “Dikastic Participation”, _Classical Quarterly_
61.2 (2011), 753–757, [doi:10.1017/S0009838811000176](https://doi.org/10.1017/S0009838811000176),
is a research reference for the turnout question. Our small finite-population
experiment and all numbers below are modern instructional choices, not a
reproduction of that article's model or estimates of historical participation.
The article is linked, not redistributed.

## Finite model

Represent five groups using modern tags A–E, with `m` distinct potential people
in each. Choose `m` from 4, 6 or 8 and request `q` per group, `1 <= q <= m`.
For attendance counts `c_A,...,c_E`, every count is between 0 and `m`.
The number of full rows available is `min(c_A,...,c_E)`; the request is met exactly
when every count is at least `q`. The inserter, total ancient jury quota,
arrangement of the actual devices and later courtroom allocation are excluded.

Default `m=4, q=2`:

| Constructed attendance | Total | Full rows | Every group has two? | Individual subsets represented |
| ---------------------- | ----: | --------: | -------------------- | -----------------------------: |
| 4–3–2–1–0              |    10 |         0 | no                   |         1 x 4 x 6 x 4 x 1 = 96 |
| 2–2–2–2–2              |    10 |         2 | yes                  |                    6^5 = 7,776 |

Replace an A attendee with an E attendee twice, then a B attendee with a D
attendee once. This changes the first vector into the second without changing
the total or anyone's group membership. Presets and exchanges are explicitly
**constructed**. Sampling is labelled **sampled**; a subsequent manual edit
changes that label back to constructed. A kept board preserves its own setup.

## Exact chance under an explicit assumption

Assume every subset of `N` distinct people from the `5m` potential people is
equally likely. This is sampling without replacement; it is not an assertion
about real jurors' independent decisions, companions or travel.

There are `C(5m,N)` subsets. A count vector has weight
`product_g C(m,c_g)`. The numerator sums this weight over vectors with total `N`
and every `c_g >= q`. Equivalently it is the coefficient of `x^N` in:

```text
( C(m,q)x^q + C(m,q+1)x^(q+1) + ... + C(m,m)x^m )^5
```

The application convolves five short integer polynomials. For `m=4,q=2,N=10`,
only the balanced successful vector exists. The result is
`7,776 / 184,756 = 1,944 / 46,189`, approximately `4.21%`.
There are 381 possible count vectors at this total. Treating those vectors as
equiprobable would give a different, incorrect result under the stated
individual-subset assumption. The UI exposes their unequal weights; CSV and
the script-free reading contain the complete list, not just a paginated sample.

These probabilities are for an **unknown new sample** with the displayed total.
Once a count vector is known, feasibility is determined. Changing its shape at
fixed `m,q,N` changes feasibility but not the chance of a new uniform sample.

All intermediates are exact integers. The largest total count is
`C(40,20)=137,846,528,820`, below `Number.MAX_SAFE_INTEGER`. Binomial coefficients
use BigInt intermediate arithmetic before conversion; coefficient sums and
products remain within the total number of subsets. Ratios reduce by integer
greatest common divisor. The curve includes `N=0` and `N=5m`.

## Necessary total versus guaranteed total

`5q` is necessary. It is sufficient only for some distributions. The sharp
guarantee for **all** distributions within this finite population is `4m+q`.
If one group has at most `q-1`, the other four can supply at most `4m`, giving
at most `4m+q-1` total. Conversely `[m,m,m,m,q-1]` fails at exactly that total.
The learner constructs this witness and adds one person to the short group.
This proves the model's bound; it does not prescribe an ancient attendance rule.

## Portable work and verification

The v1 editable record stores current and kept populations, quotas, counts,
constructed/sampled labels and a bounded explanation. Imports recompute all
results and reject malformed or oversized data. A late read cannot overwrite a
newer file selection or intervening work. No autosave is performed. Explicit
shared links omit the explanation and never update silently as the learner edits.

The HTML export captures a snapshot before asynchronous asset reads, verifies
all 14 embedded source/font/license identities and supports cancellation.
It contains no scripts or external assets. Its native JSON, CSV and SVG links
remain usable offline. The large count-pattern appendix stays in the HTML but
is omitted from print; the curve, comparison, source readings and complete
printed witnesses remain. CSV includes all patterns for both boards and no
free-text explanation. The illustration and count targets are usable at 320px.

`attendance-oracle.py` imports no application code. It independently enumerates
five-group vectors with `itertools.product`, weights them using `math.comb`,
reduces with `Fraction`, and checks all rendered curve rows for both browsers.
It separately checks the native CSV's complete weighted pattern lists.
