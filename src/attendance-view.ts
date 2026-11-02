import retained from "./allotment-assets.json";
import { allotmentPages, allotmentReadings } from "./allotment-readings";
import { esc } from "./allotment-view";
import { dataUrl } from "./assets";
import { LETTERS, ratio } from "./core/allotment";
import {
  type Attendance,
  type AttendanceRecord,
  attendanceChance,
  attendanceCurve,
  attendancePatterns,
  attendanceSummary,
  patternWeight,
} from "./core/attendance";

export const count = (value: number): string => value.toLocaleString("en-US");
export function attendanceSummaryHtml(state: Attendance): string {
  const s = attendanceSummary(state);
  return `<table class="attendance-summary"><caption>Current attendance</caption><tbody><tr><th scope="row">Present in total</th><td>${s.total} of ${state.population * 5}</td></tr><tr><th scope="row">Requested places</th><td>${s.needed} (${state.quota} per group)</td></tr><tr><th scope="row">Complete rows available</th><td>${s.fullRows}</td></tr><tr><th scope="row">Groups below the request</th><td>${s.shortGroups}</td></tr></tbody></table><p class="attendance-result">${s.meets ? "Every group meets the request." : s.total >= s.needed ? "Enough in total. Still short in a group." : "Not enough in total or in every group."}</p><p class="small">${
    s.meets
      ? `${s.fullRows} full five-person rows are possible in this teaching constraint.`
      : `${LETTERS.filter((_, i) => (s.shortages[i] as number) > 0)
          .map((letter) => `${letter} lacks ${s.shortages[LETTERS.indexOf(letter)]}`)
          .join("; ")}. The smallest group limits the full rows.`
  } The historical text does not tell us what officials did with an uneven daily turnout. This result is not a claim that an ancient court was cancelled.</p><p class="small">This attendance is recorded as <strong>${state.origin}</strong>. Its counts are ${state.counts.join("–")}, using the modern group tags A–E.</p>`;
}
export function attendanceProbabilityHtml(state: Attendance): string {
  const p = attendanceChance(state);
  const s = attendanceSummary(state);
  return `<p>Assume every subset of <strong>${s.total}</strong> distinct people from these ${state.population * 5} possible people is equally likely. What fraction has at least ${state.quota} in every group?</p><p class="attendance-probability">${count(p.favourable)} / ${count(p.possible)} <span class="small">≈ ${((100 * p.favourable) / p.possible).toFixed(2)}%</span></p><p class="small">Reduced exact fraction: ${ratio(p.probability)}. These are counts of individual subsets, not equally weighted count patterns.</p><p>The displayed pattern ${state.counts.join("–")} represents <strong>${count(patternWeight(state))}</strong> of those ${count(p.possible)} subsets. Its present counts already determine whether it meets the request. The probability above concerns an <em>unknown new sample</em> of that same size.</p><p>At least ${s.needed} total is necessary. A total of <strong>${s.guaranteedTotal}</strong> guarantees the per-group request within this finite model, however the arrivals are distributed: fewer can leave one group short. This guarantee is a mathematical bound, not a proposed historical attendance rule.</p>`;
}
export function attendanceSvg(state: Attendance): string {
  const s = attendanceSummary(state);
  const top = 100;
  const height = 180 + state.population * 35;
  const slots = LETTERS.map((letter, i) => {
    const x = 45 + i * 77;
    return `<text x="${x + 27}" y="80" text-anchor="middle">${letter}</text>${Array.from(
      { length: state.population },
      (_, j) => {
        const y = top + (state.population - j - 1) * 35;
        return `<rect x="${x}" y="${y}" width="54" height="26" fill="${j < (state.counts[i] as number) ? "#26766c" : "#edf4f3"}" stroke="#708d80" ${j < (state.counts[i] as number) ? "" : 'stroke-dasharray="3 3"'}/>`;
      },
    ).join(
      "",
    )}<text x="${x + 27}" y="${height - 64}" text-anchor="middle" font-size="16">${state.counts[i]} / ${state.population}</text>`;
  }).join("");
  const quotaY = top + (state.population - state.quota) * 35 - 4;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 455 ${height}" role="img" aria-label="${s.total} present; ${state.counts.join(", ")} in groups A to E; ${state.quota} requested per group; ${s.fullRows} complete rows. Modern finite-population model."><title>Attendance ${state.counts.join("–")}: ${s.meets ? "each group meets the request" : "a group is short"}</title><rect width="455" height="${height}" fill="#edf4f3"/><g fill="#153d39" font-family="Georgia,serif" font-size="20"><text x="22" y="33">Psephos: enough in every group?</text><text x="22" y="56" font-size="14">${state.population} possible per group; ${state.quota} requested.</text>${slots}<path d="M30 ${quotaY}H430" stroke="#98394a" stroke-width="3" stroke-dasharray="5 4"/><text x="22" y="${height - 35}" font-size="14">${s.total} present; ${s.fullRows} full rows; ${state.origin} example.</text><text x="22" y="${height - 14}" font-size="11">Modern teaching constraint; not a historical turnout. Anthony Mercer / PolyForm NC.</text></g></svg>`;
}
export function attendanceCurveSvg(state: Attendance): string {
  const curve = attendanceCurve(state.population, state.quota);
  const total = attendanceSummary(state).total;
  const current = curve[total];
  if (!current) throw new Error("The attendance total is outside the finite population.");
  const x = (n: number) => 55 + (580 * n) / (state.population * 5);
  const y = (favourable: number, possible: number) => 225 - (180 * favourable) / possible;
  const points = curve.map((p) => `${x(p.total)},${y(p.favourable, p.possible)}`).join(" ");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 690 290" role="img" aria-label="Exact-model chance of meeting every group, by total attendance. Current total ${total}: exact fraction ${ratio(current.probability)}. The table below gives every value."><title>More arrivals make the per-group condition more likely under uniform sampling.</title><rect width="690" height="290" fill="#edf4f3"/><g font-family="sans-serif" font-size="15" fill="#153d39">${[0, 25, 50, 75, 100].map((p) => `<path d="M55 ${225 - 1.8 * p}H635" stroke="#b6ccc4"/><text x="46" y="${230 - 1.8 * p}" text-anchor="end">${p}%</text>`).join("")}<polyline points="${points}" fill="none" stroke="#26766c" stroke-width="3"/><path d="M${x(total)} 225V${y(current.favourable, current.possible)}" stroke="#98394a" stroke-dasharray="4 4"/><circle cx="${x(total)}" cy="${y(current.favourable, current.possible)}" r="6" fill="#98394a"/><text x="55" y="253">0</text><text x="635" y="253" text-anchor="end">${state.population * 5}</text><text x="345" y="280" text-anchor="middle">Total attendees; current total ${total}</text><text x="345" y="24" text-anchor="middle">At least ${state.quota} in every group</text></g></svg>`;
}
export function attendanceCurveTable(state: Attendance): string {
  return `<table class="attendance-data"><caption>Exact model for every possible total</caption><thead><tr><th scope="col">Present</th><th scope="col">Favourable subsets</th><th scope="col">All subsets</th><th scope="col">Exact chance</th></tr></thead><tbody>${attendanceCurve(
    state.population,
    state.quota,
  )
    .map(
      (p) =>
        `<tr><td>${p.total}</td><td>${count(p.favourable)}</td><td>${count(p.possible)}</td><td>${ratio(p.probability)}</td></tr>`,
    )
    .join("")}</tbody></table>`;
}
export function attendanceComparison(record: AttendanceRecord): string {
  const kept = record.pinned;
  if (!kept)
    return '<p class="small">Keep this attendance to preserve the population, request, counts and whether it was constructed or sampled.</p>';
  const same =
    kept.population === record.current.population &&
    kept.quota === record.current.quota &&
    attendanceSummary(kept).total === attendanceSummary(record.current).total;
  return `<h3>Kept attendance</h3><p>Counts ${kept.counts.join("–")}; total ${attendanceSummary(kept).total}. ${attendanceSummary(kept).meets ? "Every group meets the request." : "A group is short."}</p><details><summary>Inspect kept counts and assumptions</summary>${attendanceSvg(kept)}<p class="small">${kept.population} possible per group, ${kept.quota} requested; recorded as ${kept.origin}.</p></details><p>${same ? "The population, request and total are the same. Different distributions can change whether every group meets the request; a uniform-sample probability at that total stays the same." : "The population, request or total differs. This comparison does not isolate a redistribution of the same total."}</p><button type="button" id="attendance-restore">Restore kept attendance</button> <button type="button" id="attendance-clear">Clear comparison</button>`;
}
export function attendanceCsv(record: AttendanceRecord): string {
  const rows: (string | number)[][] = [
    [
      "board",
      "kind",
      "A",
      "B",
      "C",
      "D",
      "E",
      "total",
      "favourable_or_weight",
      "all_subsets",
      "meets_request",
      "detail",
    ],
  ];
  for (const [label, state] of [
    ["current", record.current],
    ["kept", record.pinned],
  ] as const) {
    if (!state) continue;
    const s = attendanceSummary(state);
    const p = attendanceChance(state);
    rows.push([
      label,
      "displayed counts",
      ...state.counts,
      s.total,
      patternWeight(state),
      p.possible,
      String(s.meets),
      `${state.population} distinct possible people per group; ${state.quota} requested per group; ${state.origin}; modern A-E tags`,
    ]);
    for (const point of attendanceCurve(state.population, state.quota))
      rows.push([
        label,
        "uniform sample at total",
        "",
        "",
        "",
        "",
        "",
        point.total,
        point.favourable,
        point.possible,
        "",
        "Every individual subset of this size is equally likely; all five groups must meet the request",
      ]);
    for (const pattern of attendancePatterns(state))
      rows.push([
        label,
        "count pattern",
        ...pattern.counts,
        s.total,
        pattern.weight,
        p.possible,
        String(pattern.meets),
        "Count patterns have unequal weights; identity subsets are equiprobable",
      ]);
  }
  return `${rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\r\n")}\r\n`;
}
export async function attendanceReading(
  record: AttendanceRecord,
  signal: AbortSignal,
): Promise<string> {
  const saved = structuredClone(record);
  const files = new Map(
    await Promise.all(
      retained.map(async (file) => [file.path, await dataUrl(file, signal)] as const),
    ),
  );
  signal.throwIfAborted();
  const get = (path: string) => {
    const value = files.get(path);
    if (!value) throw new Error(`Missing source file: ${path}`);
    return value;
  };
  const inline = (text: string, mime: string): string => {
    const bytes = new TextEncoder().encode(text);
    let binary = "";
    for (let i = 0; i < bytes.length; i += 16384)
      binary += String.fromCharCode(...bytes.subarray(i, i + 16384));
    return `data:${mime};base64,${btoa(binary)}`;
  };
  const state = saved.current;
  const chance = attendanceChance(state);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; font-src data:; img-src data:; base-uri 'none'; form-action 'none'"><title>Psephos: attendance study</title><style>@font-face{font-family:Literata;src:url('${get("fonts/literata.woff2")}')}@font-face{font-family:SourceSans;src:url('${get("fonts/sourcesans3.woff2")}')}*{box-sizing:border-box}body{max-width:1050px;margin:0 auto;padding:25px;font-family:SourceSans,sans-serif;color:#153d39;background:#edf4f3;line-height:1.55;overflow-wrap:anywhere}h1,h2,h3,.greek{font-family:Literata,serif}.greek{font-size:22px}p{max-width:78ch}svg{width:100%;height:auto;max-width:690px}img{width:100%;height:auto}table{width:100%;border-collapse:collapse;font-size:16px}th,td{text-align:left;border-bottom:1px solid #b6ccc4;padding:8px 5px}th{font-weight:600}a{color:#185c52}button{display:none}.small{font-size:16px}section,article,figure{margin:30px 0}.note{white-space:pre-wrap}.attendance-probability{font-size:25px}.scroll{overflow-x:auto;max-width:100%}figure{margin-inline:0}dt{font-weight:600}dd{margin:0 0 14px}@media print{body{background:white;padding:0}h2,h3{break-after:avoid}svg,figure{break-inside:avoid}img{max-height:230mm;object-fit:contain}.pattern-appendix{display:none}a{color:inherit}}</style></head><body><h1>Enough in total. One group empty.</h1><p>A saved Psephos attendance experiment. The five groups, finite population, equal request and uniform-sampling rule are modern assumptions, not recovered daily turnout or a historical jury quota.</p><section><h2>Current counts</h2>${attendanceSvg(state)}${attendanceSummaryHtml(state)}</section><section><h2>Keep the comparison</h2>${attendanceComparison(saved).replace("<details>", "<details open>")}</section><section><h2>Your explanation</h2><p class="note">${esc(saved.note || "No explanation was written.")}</p></section><section><h2>A chance for an unknown sample</h2>${attendanceProbabilityHtml(state)}${attendanceCurveSvg(state)}<div class="scroll">${attendanceCurveTable(state)}</div><details class="pattern-appendix"><summary>All ${attendancePatterns(state).length} weighted count patterns at this total</summary><p>The weights sum to ${count(chance.possible)}. Successful patterns sum to ${count(chance.favourable)}. The CSV carries the complete list for both boards. This large appendix is omitted from printing.</p><div class="scroll"><table><thead><tr><th scope="col">A–E counts</th><th scope="col">Individual subsets</th><th scope="col">Every group meets?</th></tr></thead><tbody>${attendancePatterns(
    state,
  )
    .map(
      (pattern) =>
        `<tr><td>${pattern.counts.join("–")}</td><td>${count(pattern.weight)}</td><td>${pattern.meets ? "yes" : "no"}</td></tr>`,
    )
    .join(
      "",
    )}</tbody></table></div></details></section><section><h2>The Greek and its limits</h2>${allotmentReadings.map((r) => `<article><h3>${esc(r.title)} (${r.reference})</h3><p class="greek" lang="grc">${esc(r.greek)}</p><p>${esc(r.english)}</p><p class="small">${esc(r.note)}</p><dl>${r.phrases.map(([greek, transcription, meaning]) => `<dt lang="grc">${esc(greek)} <span lang="en">(${esc(transcription)})</span></dt><dd>${esc(meaning)}</dd>`).join("")}</dl></article>`).join("")}<p>The registered groups in 63.4 are approximately equal; this does not determine who arrives on a given day. The smallest represented group limits complete rows in this teaching model. We do not infer a historical response to uneven attendance. The ticket inserter, total ancient jury quota and later courtroom assignment are outside these calculations.</p><p>Research reference: David C. Mirhady and Carl Schwarz, “Dikastic Participation”, <i>Classical Quarterly</i> 61.2 (2011), 753–757, <a href="https://doi.org/10.1017/S0009838811000176">doi:10.1017/S0009838811000176</a>. Their random-arrival study motivates the question; this is a smaller exact model. The article is an external reference, not an embedded asset.</p></section><section><h2>Complete primary witnesses</h2><p>Kenyon’s edition first published 1920; the scanned imprint lists reprints through 1958. Leaf 77 and leaf 78 both print LXIV. The heading and archive leaf are retained separately. Source images, fonts and notices were checked against their retained SHA-256 identities before this reading was made.</p>${allotmentPages.map((page) => `<figure><figcaption>${esc(page.label)}; archive leaf ${page.leaf}</figcaption><img src="${get(page.path)}" alt="${esc(page.label)}; complete printed page"></figure>`).join("")}</section><section><h2>Reopen the study or inspect its evidence</h2><p><a download="psephos-attendance.json" href="${inline(JSON.stringify(saved, null, 2), "application/json")}">Editable attendance</a> · <a download="psephos-attendance.csv" href="${inline(attendanceCsv(saved), "text/csv")}">Complete exact CSV</a> · <a download="psephos-attendance.svg" href="${inline(attendanceSvg(state), "image/svg+xml")}">Count SVG</a></p><ul>${retained.map((file) => `<li>${file.mime.startsWith("image/") || file.mime.startsWith("font/") ? `${esc(file.path)} (embedded above)` : `<a download="${esc(file.path.split("/").at(-1))}" href="${get(file.path)}">${esc(file.path)}</a>`} (${file.bytes} bytes; SHA-256 ${file.sha256})</li>`).join("")}</ul></section><footer>Anthony Mercer. Code, diagrams, translation and notes: PolyForm Noncommercial. Font licenses and source notices are embedded above. No scripts or external assets are required.</footer></body></html>`;
}
