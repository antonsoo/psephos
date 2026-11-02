import retained from "./allotment-assets.json";
import { allotmentPages, allotmentReadings } from "./allotment-readings";
import { dataUrl } from "./assets";
import {
  type Allotment,
  type AllotmentRecord,
  beforePlacement,
  LETTERS,
  probabilities,
  ratio,
  ticketRow,
} from "./core/allotment";

export function esc(value: unknown): string {
  return String(value).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );
}
export function ticketStatus(study: Allotment, ticket: string): string {
  const cube = study.draws[ticketRow(study, ticket)];
  return cube === "W" ? "selected for service" : cube === "B" ? "rejected" : "undecided";
}
export function relation(study: Allotment): string {
  const [a, b] = study.pair;
  const first = ticketRow(study, a) + 1;
  const second = ticketRow(study, b) + 1;
  return first === second
    ? `${a} and ${b} share row ${first}.`
    : `${a} is in row ${first}; ${b} is in row ${second}.`;
}
export function chanceTable(study: Allotment, afterDraws = false): string {
  const p = probabilities(study, afterDraws);
  const [a, b] = study.pair;
  return `<table class="chance-table"><caption>${afterDraws ? "After the recorded cubes" : "Before any cubes are drawn"}</caption><thead><tr><th scope="col">Event</th><th scope="col">Exact chance</th></tr></thead><tbody><tr><th scope="row">${a} selected</th><td>${ratio(p.first)}</td></tr><tr><th scope="row">${b} selected</th><td>${ratio(p.second)}</td></tr><tr><th scope="row">Both selected</th><td>${ratio(p.both)}</td></tr><tr><th scope="row">${b} selected, given ${a} selected</th><td>${p.secondGivenFirst.denominator ? ratio(p.secondGivenFirst) : "undefined"}</td></tr></tbody></table><p class="small">${p.orders.length} compatible colour ${p.orders.length === 1 ? "order" : "orders"}. ${p.independent ? "Within this evidence, the joint chance equals the product of the individual chances." : "The joint chance differs from the product of the individual chances: these events are dependent."}${afterDraws ? " Conditioning on a recorded rejection can make a conditional chance undefined." : " This concerns the fixed placement above, before any draw."}</p>`;
}
export function placementTable(study: Allotment): string {
  const p = beforePlacement(study);
  const [a, b] = study.pair;
  return `<h3>Before placement is known</h3><p>A different modern assumption: independently shuffle each full letter column uniformly, then draw a uniform cube order. Do not condition on the displayed arrangement or the recorded draw.</p><table class="chance-table"><caption>Average over unknown placements</caption><thead><tr><th scope="col">Event</th><th scope="col">Exact chance</th></tr></thead><tbody><tr><th scope="row">${a} selected</th><td>${ratio(p.first)}</td></tr><tr><th scope="row">${b} selected</th><td>${ratio(p.second)}</td></tr><tr><th scope="row">Both selected</th><td>${ratio(p.both)}</td></tr><tr><th scope="row">${b} selected, given ${a} selected</th><td>${ratio(p.secondGivenFirst)}</td></tr></tbody></table><p class="small">${p.rowPlacements} equally likely ordered row placements for this pair, each with ${probabilities(study).orders.length} colour orders: ${p.count} cases. ${p.sameColumn ? "The tickets belong to the same column and must occupy different rows. Their selections remain dependent." : "The two letters are shuffled independently. Averaging over those unknown placements makes their selections independent, even though tickets sharing a fixed row move together."} These shuffle assumptions are not established by the ancient passage. Random placement and a fixed observed placement are different questions.</p>`;
}
export function boardSvg(study: Allotment): string {
  const height = 190 + study.rows * 48;
  const labels = LETTERS.map(
    (letter, column) =>
      `<text x="${63 + column * 64}" y="87" text-anchor="middle">${letter}</text>`,
  ).join("");
  const rows = Array.from({ length: study.rows }, (_, row) => {
    const y = 104 + row * 48;
    const cube = study.draws[row];
    const tickets = LETTERS.map((letter, col) => {
      const ticket = `${letter}${study.columns[col]?.[row]}`;
      const tracked = study.pair.includes(ticket);
      const stroke = study.pair[1] === ticket ? "#98394a" : "#153d39";
      return `<rect x="${35 + col * 64}" y="${y}" width="56" height="35" fill="${cube === "B" ? "#c7d7ce" : "#fbfdfb"}" stroke="${tracked ? stroke : "#7b9a8e"}" stroke-width="${tracked ? 3 : 1}"/><text x="${63 + col * 64}" y="${y + 24}" text-anchor="middle" fill="${stroke}" font-weight="${tracked ? 700 : 400}">${ticket}</text>`;
    }).join("");
    return `<text x="14" y="${y + 24}" font-size="14">${row + 1}</text>${tickets}<text x="365" y="${y + 24}" font-size="14">${cube === "W" ? "W: admit" : cube === "B" ? "B: reject" : "pending"}</text>`;
  }).join("");
  const joint = ratio(probabilities(study).both);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 450 ${height}" role="img" aria-label="${esc(relation(study))} Before-draw joint chance ${joint}. ${study.rows} full rows; ${study.whites} white cubes. Modern ordinary-ticket model; recorded ${study.drawMode} sequence: ${study.draws.join(" ") || "none"}."><title>${esc(relation(study))} ${study.whites} white cubes in ${study.rows} rows; before-draw joint chance ${joint}. Ordinary invented tickets; fixed-placement modern model, not a complete historical jury. ${esc(study.drawMode)} sequence: ${study.draws.join("") || "none"}.</title><rect width="450" height="${height}" fill="#edf4f3"/><g fill="#153d39" font-family="Georgia, serif" font-size="19"><text x="20" y="31">Psephos: one cube, five tickets</text><text x="20" y="56" font-size="14">${study.rows} rows / ${study.whites} white / ${study.rows - study.whites} black</text>${labels}${rows}<text x="20" y="${height - 59}" font-size="14">${study.pair.join(" + ")}: before-draw joint chance ${joint}</text><text x="20" y="${height - 35}" font-size="12">Modern ordinary-ticket model. Ath. Pol. 63–64.</text><text x="20" y="${height - 15}" font-size="12">Anthony Mercer / PolyForm NC. Not a courtroom assignment.</text></g></svg>`;
}
export function comparison(record: AllotmentRecord, expanded = false): string {
  const pinned = record.pinned;
  if (!pinned)
    return '<p class="small">Keep a board to preserve its placement, pair, cube supply and released sequence before making a change.</p>';
  const same =
    pinned.rows === record.study.rows &&
    pinned.whites === record.study.whites &&
    pinned.pair.join() === record.study.pair.join();
  return `<h3>Kept board</h3><p>${esc(relation(pinned))}</p>${same ? "" : chanceTable(pinned)}<details ${expanded ? "open" : ""}><summary>Inspect kept placement and draw</summary>${boardSvg(pinned)}<p class="small">Recorded cubes: ${pinned.draws.join(" ") || "none"} (${pinned.drawMode}).</p></details>${same ? `<p>Before-draw joint chance: <strong>${ratio(probabilities(pinned).both)} kept; ${ratio(probabilities(record.study).both)} current.</strong> The same pair, row count and cube supply are being compared. Each individual chance stays ${ratio(probabilities(record.study).first)}.</p>` : "<p>The pair or cube supply differs. This is a different setup; the comparison does not isolate a placement change.</p>"}<button type="button" id="restore-kept">Restore kept board</button> <button type="button" id="clear-kept">Clear comparison</button>`;
}
export function allotmentCsv(record: AllotmentRecord): string {
  const rows: (string | number)[][] = [
    ["board", "kind", "subject", "detail", "numerator", "denominator"],
  ];
  for (const [name, study] of [
    ["current", record.study],
    ["kept", record.pinned],
  ] as const) {
    if (!study) continue;
    rows.push([
      name,
      "assumptions",
      "fixed placement",
      `uniform colour orders; ${study.rows} full rows; ${study.whites} white; ${study.rows - study.whites} black; ordinary tickets only`,
      "",
      "",
    ]);
    rows.push([name, "recorded draw", study.drawMode, study.draws.join(" "), "", ""]);
    for (const [i, letter] of LETTERS.entries())
      for (const [r, identity] of (study.columns[i] ?? []).entries())
        rows.push([
          name,
          "ticket",
          `${letter}${identity}`,
          `row ${r + 1}; ${ticketStatus(study, `${letter}${identity}`)}`,
          "",
          "",
        ]);
    for (const after of [false, true]) {
      const p = probabilities(study, after);
      for (const [event, f] of [
        [study.pair[0], p.first],
        [study.pair[1], p.second],
        ["both selected", p.both],
        [`${study.pair[1]} given ${study.pair[0]}`, p.secondGivenFirst],
      ] as const)
        rows.push([
          name,
          after ? "after recorded cubes" : "before draw",
          event,
          f.denominator ? "selection chance" : "undefined",
          f.numerator,
          f.denominator,
        ]);
    }
    const placement = beforePlacement(study);
    for (const [event, f] of [
      [study.pair[0], placement.first],
      [study.pair[1], placement.second],
      ["both selected", placement.both],
      [`${study.pair[1]} given ${study.pair[0]}`, placement.secondGivenFirst],
    ] as const)
      rows.push([
        name,
        "before unknown placement",
        event,
        "independent uniform shuffles of full columns, then uniform cube order; ignores displayed arrangement and draws",
        f.numerator,
        f.denominator,
      ]);
    for (const order of probabilities(study).orders)
      rows.push([
        name,
        "colour order",
        order.join(" "),
        study.pair
          .map((t) => (order[ticketRow(study, t)] === "W" ? "selected" : "rejected"))
          .join(" / "),
        1,
        probabilities(study).orders.length,
      ]);
  }
  return `${rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\r\n")}\r\n`;
}
export function saveAllotmentFile(name: string, content: BlobPart, mime: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
export async function illustratedAllotment(
  record: AllotmentRecord,
  signal: AbortSignal,
): Promise<string> {
  const snapshot = structuredClone(record);
  const sources = new Map(
    await Promise.all(
      retained.map(async (item) => [item.path, await dataUrl(item, signal)] as const),
    ),
  );
  signal.throwIfAborted();
  const get = (path: string): string => {
    const value = sources.get(path);
    if (!value) throw new Error(`Missing retained file: ${path}`);
    return value;
  };
  const downloadable = (content: string, mime: string) => {
    const bytes = new TextEncoder().encode(content);
    let text = "";
    for (let i = 0; i < bytes.length; i += 16384)
      text += String.fromCharCode(...bytes.subarray(i, i + 16384));
    return `data:${mime};base64,${btoa(text)}`;
  };
  const p = probabilities(snapshot.study);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; font-src data:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>Psephos: kept allotment study</title><style>@font-face{font-family:Literata;src:url('${get("fonts/literata.woff2")}')}@font-face{font-family:SourceSans;src:url('${get("fonts/sourcesans3.woff2")}')}*{box-sizing:border-box}body{font-family:SourceSans,sans-serif;background:#edf4f3;color:#153d39;max-width:1000px;margin:0 auto;padding:24px;line-height:1.55;overflow-wrap:anywhere}h1,h2,h3,.greek{font-family:Literata,serif}.greek{font-size:22px}p{max-width:75ch}svg{width:100%;max-width:450px;height:auto}img{width:100%;height:auto}article,section{margin:35px 0}table{border-collapse:collapse;width:100%;font-size:16px}th,td{border-bottom:1px solid #7b9a8e;text-align:left;padding:8px}th{font-weight:600}a{color:#185c52;overflow-wrap:anywhere}.small{font-size:16px}.note{white-space:pre-wrap}button{display:none}dl{padding-left:12px}dt{font-weight:600}dd{margin:0 0 16px}.orders{display:flex;flex-wrap:wrap;gap:8px}.orders span{border:1px solid #7b9a8e;padding:5px 9px}figure{margin:25px 0}@media print{body{background:white;padding:0}h2,h3{break-after:avoid}figure,svg{break-inside:avoid}img{max-height:230mm;object-fit:contain}a{color:inherit}}</style></head><body><h1>One cube. Five tickets.</h1><p>A Psephos fixed-placement study. Ordinary invented tickets, not a reconstruction of an entire Athenian jury. Source: <i>Constitution of the Athenians</i>, 63–64. Anthony Mercer, PolyForm Noncommercial.</p><section><h2>Current board</h2><p>${esc(relation(snapshot.study))}</p>${boardSvg(snapshot.study)}<p>Recorded colour sequence: ${snapshot.study.draws.join(" ") || "none"}. Sequence recorded as <strong>${snapshot.study.drawMode}</strong>. Undo and imported studies are editable experiments, not records of a physical lottery.</p>${chanceTable(snapshot.study)}${placementTable(snapshot.study)}${snapshot.study.draws.length ? chanceTable(snapshot.study, true) : ""}<h3>All ${p.orders.length} equally likely colour orders</h3><p>W = white; B = black. Read left to right from row 1. Under a uniform permutation of distinguishable cubes, each colour string represents the same number of permutations.</p><div class="orders">${p.orders.map((order) => `<span>${order.join(" ")}: ${snapshot.study.pair.map((t) => `${t} ${order[ticketRow(snapshot.study, t)] === "W" ? "selected" : "rejected"}`).join("; ")}</span>`).join("")}</div></section><section><h2>Kept comparison</h2>${comparison(snapshot, true)}${snapshot.pinned ? chanceTable(snapshot.pinned) : ""}</section><section><h2>Your explanation</h2><p class="note">${esc(snapshot.note || "No explanation was written.")}</p></section><section><h2>Read the Greek</h2>${allotmentReadings.map((r) => `<article><h3>${esc(r.title)} (${r.reference})</h3><p class="greek" lang="grc">${esc(r.greek)}</p><p>${esc(r.english)}</p><p class="small">${esc(r.note)}</p><dl>${r.phrases.map(([greek, transliteration, meaning]) => `<dt lang="grc">${esc(greek)} <span lang="en">(${esc(transliteration)})</span></dt><dd>${esc(meaning)}</dd>`).join("")}</dl></article>`).join("")}</section><section><h2>Full printed witnesses</h2><p>Kenyon's edition first published 1920; this copy's imprint lists reprints through 1958. The chapter-64 page on archive leaf 77 prints LXIV where sequential numbering would give LXIII; the following leaf also prints LXIV. Both headings remain visible. Images were checked against the retained edition's SHA-256 identities before this reading was made.</p>${allotmentPages.map((page) => `<figure><figcaption>${esc(page.label)}; archive leaf ${page.leaf}</figcaption><img alt="${esc(page.label)}; complete printed source" src="${get(page.path)}"></figure>`).join("")}</section><section><h2>Assumptions and limits</h2><p>One teaching device with five letter groups from one tribe. Each column is full; row count is a teaching choice. Placement is fixed before a uniform draw without replacement. The ticket inserter is counted by the text but excluded from these ordinary tickets and their probabilities. The result is entry to a service pool, not assignment to the same court. Later court allotment and historical stopping rules are not modeled. Ticket swapping is a modern intervention. No chance calculation measures real-world resistance to cheating.</p><p>Eligible male citizens formed the historical pool, with age and status restrictions. This was not selection from all Athenians; women, enslaved people and resident foreigners were excluded.</p></section><section><h2>Reopen or inspect the retained bytes</h2><p><a download="psephos-allotment.json" href="${downloadable(JSON.stringify(snapshot, null, 2), "application/json")}">Editable study</a> · <a download="psephos-allotment.csv" href="${downloadable(allotmentCsv(snapshot), "text/csv")}">Exact CSV</a> · <a download="psephos-allotment.svg" href="${downloadable(boardSvg(snapshot.study), "image/svg+xml")}">Board SVG</a></p><ul>${retained.map((item) => `<li>${item.mime.startsWith("image/") || item.mime.startsWith("font/") ? `${esc(item.path)} (embedded above)` : `<a download="${esc(item.path.split("/").at(-1))}" href="${get(item.path)}">${esc(item.path)}</a>`} (${item.bytes} bytes; SHA-256 ${item.sha256})</li>`).join("")}</ul></section><footer>Code, translation, notes and diagrams: Anthony Mercer, PolyForm Noncommercial. Font licenses and source notices are embedded above. No scripts or external assets are required.</footer></body></html>`;
}
