import { type Ballot, type Court, contents, observer, PANEL, tally } from "./core/model";

export const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

function glyph(ballot: Ballot, x: number, y: number, radius: number): string {
  return `<g transform="translate(${x} ${y})"><circle r="${radius}" fill="#a88a53" stroke="#4d482c" stroke-width="2"/><circle r="${radius * 0.78}" fill="none" stroke="#d5c18e" stroke-width="1.5"/><circle r="${radius * 0.34}" fill="#b99c65" stroke="#4d482c" stroke-width="2"/>${ballot === "pierced" ? `<circle r="${radius * 0.18}" fill="#153d39"/>` : `<circle r="${radius * 0.18}" fill="#b99c65"/>`}</g>`;
}
export function pairSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 620 230" role="img" aria-label="Two bronze disk ballots seen from the axle ends. Pierced: a through-hole. Solid: a closed end."><path d="M90 80H240M380 80H530" stroke="#c4d4cf" stroke-width="1"/>${glyph("pierced", 165, 88, 64)}${glyph("solid", 455, 88, 64)}<g fill="#153d39" text-anchor="middle" font-family="Source Sans 3, sans-serif" font-size="21"><text x="165" y="186">Pierced axle</text><text x="455" y="186">Solid axle</text><text x="165" y="212" font-size="17">First speaker</text><text x="455" y="212" font-size="17">Second speaker</text></g></svg>`;
}
export function observerSvg(covered: boolean, choice: Ballot): string {
  const end = (x: number): string =>
    covered
      ? `<g transform="translate(${x} 68)"><circle r="33" fill="#a88a53" stroke="#4d482c" stroke-width="2"/><rect x="-40" y="-18" width="80" height="36" rx="18" fill="#d8e5e1" stroke="#39675e" stroke-width="2"/><path d="M-28 -8H-9M9 8H28" stroke="#91aca2" stroke-width="2"/></g>`
      : glyph(choice, x, 68, 33);
  // Covered markup is deliberately identical for both private choices.
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 138" role="img" aria-label="${escapeHtml(observer(covered, choice))}">${end(67)}${end(213)}<g fill="#153d39" text-anchor="middle" font-family="Source Sans 3, sans-serif" font-size="16"><text x="67" y="125">One end</text><text x="213" y="125">Other end</text></g></svg>`;
}
export function urnSvg(count: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 620 175" role="img" aria-label="Bronze urn: ${count} counted ballots. Wooden urn: ${count} unused ballots. Both sides can occur in either urn."><defs><pattern id="wood-grain" width="14" height="20" patternUnits="userSpaceOnUse"><path d="M0 3H14M0 15H14" stroke="#84694c" fill="none"/></pattern></defs><path d="M97 21H233V42H220L237 105Q239 131 210 137H120Q91 131 93 105L110 42H97Z" fill="#659084" stroke="#234d44" stroke-width="2"/><path d="M137 26H193" stroke="#153d39" stroke-width="5"/><path d="M387 22H523V42H510L527 105Q529 131 500 137H410Q381 131 383 105L400 42H387Z" fill="#c2a782" stroke="#725b3d" stroke-width="2"/><path d="M387 22H523V42H510L527 105Q529 131 500 137H410Q381 131 383 105L400 42H387Z" fill="url(#wood-grain)"/><g fill="#153d39" text-anchor="middle" font-family="Source Sans 3, sans-serif" font-size="18"><text x="165" y="164">Bronze: counts</text><text x="455" y="164">Wood: unused</text><text x="165" y="94" font-size="34" fill="#fbfdfb">${count}</text><text x="455" y="94" font-size="34">${count}</text></g></svg>`;
}
export function boardSvg(court: Court): string {
  const ballots = court.counted ? contents(court, court.counted).sort() : [];
  const n = Math.max(PANEL, ballots.length);
  const pieces = Array.from({ length: n }, (_, i) => {
    const x = 58 + (i % 5) * 106;
    const y = 52 + Math.floor(i / 5) * 99;
    const ballot = ballots[i];
    return ballot
      ? glyph(ballot, x, y, 32)
      : `<circle cx="${x}" cy="${y}" r="32" fill="#dce8e3" stroke="#aac2b8" stroke-width="1.5" stroke-dasharray="3 5"/>`;
  }).join("");
  const numbers = court.counted ? tally(ballots) : null;
  const desc = numbers
    ? `${court.counted === "bronze" ? "Bronze" : "Wooden"} urn: ${numbers.pierced} pierced, ${numbers.solid} solid. ${n > PANEL ? "An extra ballot exceeds the ten training jurors." : "Ten displayed ballots."}`
    : "Ten empty positions. The count has not been opened.";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 ${n > PANEL ? 295 : 196}" role="img" aria-label="${escapeHtml(desc)}"><rect x="3" y="3" width="534" height="${n > PANEL ? 289 : 190}" rx="20" fill="#f6fbf8" stroke="#b7cdc1" stroke-width="2"/>${pieces}</svg>`;
}
export function verdict(court: Court): { title: string; body: string } {
  if (!court.counted)
    return {
      title: "The count is still closed.",
      body: "Let every training juror cast, then open an urn.",
    };
  if (court.counted === "wood") {
    const t = tally(contents(court, "wood"));
    return {
      title: "The unused urn cannot decide.",
      body: `${t.pierced} pierced and ${t.solid} solid are discarded choices. Read κύριος and ἄκυρος in 68.3: only bronze is authoritative. Each unused ballot is the opposite of a cast one in this paired model.`,
    };
  }
  const list = contents(court, "bronze");
  const t = tally(list);
  if (list.length !== PANEL)
    return {
      title: "The total exposes an extra ballot.",
      body: `${list.length} ballots for ${PANEL} training jurors. The exercise withholds a verdict from this altered count.`,
    };
  const title = t.tied
    ? "Equal votes. The defendant wins."
    : `The ${t.winner} wins${court.intervention === "replace" ? " the altered count" : ""}.`;
  return {
    title,
    body: `${t.pierced} pierced for the prosecutor; ${t.solid} solid for the defendant. ${t.tied ? "ἂν δὲ ἴσαι, ὁ φεύγων: equality favors the defendant." : "The greater number wins under 69.1."}${court.intervention === "replace" ? " One ballot was deliberately replaced. The total still matches ten: that check alone cannot establish an honest history." : ""}`,
  };
}
export function auditTable(court: Court): string {
  const rows = (["none", "extra", "replace"] as const)
    .map((kind) => {
      const possible = kind !== "replace" || court.votes.includes("solid");
      const list = contents(court, "bronze", kind);
      const t = tally(list);
      return `<tr${kind === court.intervention ? ' class="selected"' : ""}><th scope="row">${kind === "none" ? "Original" : kind === "extra" ? "Extra pierced" : "Solid replaced"}</th><td>${possible ? t.pierced : "—"}</td><td>${possible ? t.solid : "—"}</td><td>${possible ? list.length : "—"}</td><td>${possible ? (list.length === PANEL ? "Matches" : "Mismatch") : "No solid to replace"}</td></tr>`;
    })
    .join("");
  return `<table><caption>Modern interventions in the bronze count</caption><thead><tr><th scope="col">Count</th><th scope="col">Pierced</th><th scope="col">Solid</th><th scope="col">Total</th><th scope="col">Ten jurors?</th></tr></thead><tbody>${rows}</tbody></table>`;
}
