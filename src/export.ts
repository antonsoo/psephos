import { assets, dataUrl } from "./assets";
import { contents, observer, replay, tally } from "./core/model";
import { type CourtRecord, serialize } from "./core/record";
import { auditTable, boardSvg, escapeHtml, observerSvg, pairSvg, verdict } from "./drawing";
import { readings } from "./readings";

export function saveFile(name: string, bytes: BlobPart, mime: string): void {
  const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
export function diagram(record: CourtRecord): string {
  const { court } = replay(record.preset, record.actions);
  const v = verdict(court);
  const inner = boardSvg(court)
    .replace(/^.*?<svg[^>]*>/s, "")
    .replace(/<\/svg>\s*$/, "");
  const height = court.counted && contents(court, court.counted).length > 10 ? 295 : 196;
  const t = court.counted ? tally(contents(court, court.counted)) : null;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 620 ${height + 230}" role="img" aria-labelledby="title description"><title id="title">${escapeHtml(v.title)}</title><desc id="description">${escapeHtml(v.body)} Starting rehearsal: ${escapeHtml(record.preset)}. Ten is a modern training panel size, not an ancient jury size. Diagram by Anthony Mercer, MIT. Source: Constitution of the Athenians 68.2–69.1, Kenyon 1920.</desc><rect width="620" height="${height + 230}" fill="#edf4f3"/><g font-family="Georgia, serif" fill="#153d39"><text x="30" y="38" font-size="23">Psephos: ${court.counted === "wood" ? "unused wooden urn" : "bronze count"}</text><text x="30" y="67" font-size="17">${court.counted ? `${t?.pierced} pierced / ${t?.solid} solid; intervention: ${court.intervention}` : "Count still closed"}</text></g><g transform="translate(30 90)">${inner}</g><g font-family="Georgia, serif" fill="#153d39" font-size="16"><text x="30" y="${height + 124}">${escapeHtml(v.title)}</text><text x="30" y="${height + 155}">Modern ten-person teaching panel; schematic drawing.</text><text x="30" y="${height + 181}">Athenaion Politeia 68–69. Anthony Mercer / MIT.</text></g></svg>`;
}

export async function illustrated(record: CourtRecord, signal: AbortSignal): Promise<string> {
  const snapshot = structuredClone(record);
  const { court, steps } = replay(snapshot.preset, snapshot.actions);
  const source = new Map(
    await Promise.all(
      assets.map(async (item) => [item.path, await dataUrl(item, signal)] as const),
    ),
  );
  signal.throwIfAborted();
  const get = (path: string): string => {
    const value = source.get(path);
    if (!value) throw new Error(`Missing retained file: ${path}`);
    return value;
  };
  const v = verdict(court);
  const r = readings
    .map(
      (item) =>
        `<article><h3>${escapeHtml(item.title)} · ${item.reference}</h3><p lang="grc" class="greek">${escapeHtml(item.greek)}</p><p>${escapeHtml(item.english)}</p><p class="small">${escapeHtml(item.note)}</p><dl>${item.phrases.map((phrase) => `<dt lang="grc">${escapeHtml(phrase.greek)} <span lang="en">(${escapeHtml(phrase.transliteration)})</span></dt><dd>${escapeHtml(phrase.meaning)}</dd>`).join("")}</dl></article>`,
    )
    .join("");
  const eventList = steps
    .map(
      (item, i) =>
        `<li><strong>${item.accepted ? "Accepted" : "Refused"}:</strong> ${escapeHtml(item.message)} <span class="small">(${escapeHtml(snapshot.actions[i]?.type ?? "")} · source: ${escapeHtml(item.source)})</span></li>`,
    )
    .join("");
  const observation = snapshot.observation
    ? `<h3>Pinned observation</h3>${observerSvg(snapshot.observation.covered, snapshot.observation.choice)}<p>Private choice: ${snapshot.observation.choice}. ${escapeHtml(observer(snapshot.observation.covered, snapshot.observation.choice))}</p>`
    : "<p>No observation pinned.</p>";
  return `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:; base-uri 'none'; form-action 'none'"><title>Psephos · illustrated court record</title><style>
@font-face{font-family:Literata;src:url('${get("fonts/literata.woff2")}')}@font-face{font-family:'Source Sans 3';src:url('${get("fonts/sourcesans3.woff2")}')}*{box-sizing:border-box}body{font:19px/1.6 'Source Sans 3',sans-serif;color:#153d39;background:#fbfdfb;max-width:1000px;margin:auto;padding:40px}h1,h2,h3,.greek{font-family:Literata,Georgia,serif}h1{font-size:42px;line-height:1.2}h2{margin-top:2.3em}h3{font-size:23px}p,dd{max-width:76ch}svg{max-width:560px;width:100%;height:auto;display:block}img{max-width:100%;height:auto}a{color:#185c52;overflow-wrap:anywhere}.greek{font-size:22px;line-height:1.9}.small,figcaption{font-size:15px}dt{font-weight:600}dd{margin:0 0 1em 0}article{margin-bottom:3em}.explanation{white-space:pre-wrap;border-left:4px solid #26766c;padding-left:20px}table{border-collapse:collapse;max-width:100%;font-size:16px}th,td{padding:8px;text-align:left;border-bottom:1px solid #aac2b8}nav{display:flex;gap:20px;flex-wrap:wrap}.scan{max-height:1100px;object-fit:contain}details{margin:1em 0}@media print{body{padding:0;font-size:11pt}h1{font-size:28pt}h2,h3,dt{break-after:avoid}figure{break-inside:avoid}.scan{max-height:24cm}nav{display:none}.greek{font-size:13pt}a{color:inherit}.new-page{break-before:page}svg{max-height:9cm}}
</style></head><body><header><p>Psephos · a saved learning record</p><h1>Two ballots. One unseen vote.</h1><p>Modern ten-person training panel; starting rehearsal: ${escapeHtml(snapshot.preset)}. These votes are invented.</p><nav><a href="data:application/json;charset=utf-8,${encodeURIComponent(serialize(snapshot))}" download="psephos-court-record.json">Download editable JSON</a><a href="data:image/svg+xml;charset=utf-8,${encodeURIComponent(diagram(snapshot))}" download="psephos-count.svg">Download count diagram</a></nav><p class="small">Open this HTML without a connection. Use the browser's Print command for PDF. Reopen the JSON in Psephos to continue editing.</p></header><main><h2>${escapeHtml(v.title)}</h2>${boardSvg(court)}<p>${escapeHtml(v.body)}</p><p>Bronze contains the chosen ballots; wood contains their unused opposites. Only bronze is authoritative under 68.3. The ten positions and vessel drawings are new teaching devices.</p><h3>Current observer view</h3>${observerSvg(court.covered, court.choice)}<p>Private selection: ${court.choice}. ${escapeHtml(observer(court.covered, court.choice))}</p>${observation}<h3>Your explanation</h3><p class="explanation">${escapeHtml(snapshot.note || "No explanation recorded.")}</p><p>Selected sources: ${
    snapshot.citations.length
      ? snapshot.citations
          .map((id) => {
            const item = readings.find((s) => s.id === id);
            return escapeHtml(`${item?.title} (${item?.reference})`);
          })
          .join("; ")
      : "none"
  }. The prose is preserved, not graded.</p><h2>The rehearsal sequence</h2><p>${snapshot.preset === "empty" ? "No prior votes." : snapshot.preset === "last-vote" ? "Nine invented prior votes: five pierced, four solid." : "Nine invented prior votes: three pierced, six solid."}</p><ol>${eventList || "<li>No actions recorded.</li>"}</ol>${court.counted === "bronze" ? `<h3>Modern counting interventions</h3>${auditTable(court)}<p>A matching total alone does not establish a ballot's history. Interventions are deliberate modern exercises, outside the described ancient procedure.</p>` : ""}<h2>The pair and its meaning</h2>${pairSvg()}<h2 class="new-page">Read the procedure</h2>${r}<h2 class="new-page">The complete printed witness</h2><figure><img class="scan" src="${get("sources/kenyon-p67.jpg")}" alt="Complete Kenyon 1920 printed page LXVII, including the critical apparatus"><figcaption>Printed LXVII, Internet Archive leaf 81, 68.2–3.</figcaption></figure><figure class="new-page"><img class="scan" src="${get("sources/kenyon-p68.jpg")}" alt="Complete Kenyon 1920 printed page LXVIII, including the critical apparatus"><figcaption>Printed LXVIII, Internet Archive leaf 82, 68.4–69.</figcaption></figure><h2>Surviving objects</h2><figure><img src="${get("sources/agora-ballots.jpg")}" alt="Bronze ballots with projecting pierced and solid axles, Museum of the Ancient Agora"><figcaption>Zde, 2022, Museum of the Ancient Agora; objects dated around 300 BCE by the photographer. Wikimedia's rescaled 1280-pixel image. <a href="https://commons.wikimedia.org/wiki/File:Ballots,_ca_300_BC,_AGMA,_225285.jpg">Original and attribution</a>, <a href="${get("sources/CC-BY-SA-4.0.txt")}" download="CC-BY-SA-4.0.txt">CC BY-SA 4.0</a>.</figcaption></figure><h2>Boundaries and credits</h2><p>This is a study of the procedure in Constitution of the Athenians 68.2–69.1, conventionally attributed to Aristotle, within its late fourth-century BCE setting. Authorship is debated. It is not a reconstruction of every Athenian court or an actual dispute. The training panel, pinning, simultaneous deposits, isolated observer views and counting interventions are new. The count tests a described rule, not the merits of any litigation. The work omits juror selection, evidence challenges, pay and penalty assessment. This learning app stores private choices and is not a private voting system. Ancient participation was unequal and restricted.</p><p>The Greek is transcribed from the retained print. Brackets preserve the editor's supplies or bracketed text; punctuation and opening capitalization are normalized. The new English, notes and diagrams are by Anthony Mercer.</p><p><a href="${get("sources/NOTICE.txt")}" download="psephos-source-notice.txt">Full source notice</a> · <a href="${get("sources/provenance.json")}" download="psephos-source-provenance.json">Source provenance</a> · <a href="${get("fonts/provenance.json")}" download="psephos-font-provenance.json">Font provenance</a> · <a href="${get("sources/perseus-grc2.xml")}" download="perseus-grc2.xml">Unchanged Perseus comparison XML</a> (Trustees of Tufts University, CC BY-SA 4.0; variant readings) · <a href="${get("sources/CC-BY-SA-4.0.txt")}" download="CC-BY-SA-4.0.txt">CC BY-SA license</a> · <a href="${get("LICENSE.txt")}" download="LICENSE.txt">MIT code, diagrams and new translations</a> · <a href="${get("fonts/literata-OFL.txt")}" download="literata-OFL.txt">Literata OFL</a> · <a href="${get("fonts/sourcesans3-OFL.txt")}" download="sourcesans3-OFL.txt">Source Sans 3 OFL</a>.</p></main></body></html>`;
}
