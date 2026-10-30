import "./style.css";
import { asset, verifiedBytes } from "./assets";
import {
  type Action,
  type Ballot,
  contents,
  initial,
  observer,
  PANEL,
  type Preset,
  replay,
} from "./core/model";
import { fresh, fromLink, parseRecord, recordLink, serialize } from "./core/record";
import { auditTable, boardSvg, escapeHtml, observerSvg, pairSvg, urnSvg, verdict } from "./drawing";
import { diagram, illustrated, saveFile } from "./export";
import { inferenceAvailable, inferenceReport } from "./inference-view";
import { installOffline } from "./offline";
import { reading, readings } from "./readings";
import { sourcePage } from "./source-pages";

function el<T extends HTMLElement = HTMLElement>(id: string): T {
  const found = document.getElementById(id);
  if (!found) throw new Error(`Missing control: ${id}`);
  return found as T;
}
const button = (id: string, handler: () => void): void => {
  el(id).addEventListener("click", handler);
};
let record = fresh();
let redo: Action[] = [];
let revision = 0;
let readingId = "pair";
let loadId = 0;
let scanController: AbortController | null = null;
let scanUrl: string | null = null;
let exportController: AbortController | null = null;
let initialMessage = "";
try {
  const stored =
    localStorage.getItem("psephos-record-v2") ?? localStorage.getItem("psephos-record-v1");
  if (stored) {
    record = parseRecord(stored);
    initialMessage = "Your saved rehearsal was reopened from this browser.";
  }
} catch (error) {
  initialMessage = error instanceof Error ? error.message : "The saved record could not be read.";
}
try {
  const shared = fromLink(location.hash);
  if (shared) {
    record = shared;
    initialMessage = "Shared rehearsal opened. Counts were recomputed from its actions.";
  }
} catch (error) {
  initialMessage = error instanceof Error ? error.message : "The shared record could not be read.";
}

function keep(): void {
  revision++;
  try {
    localStorage.setItem("psephos-record-v2", serialize(record));
    el("autosave").textContent = "Kept in this browser. Save a file for a separate copy.";
  } catch {
    el("autosave").textContent =
      "Browser storage is unavailable. Save an editable record to keep your work.";
  }
  el("share-fallback").hidden = true;
}
function announce(message: string, source: string): void {
  el("action-message").textContent = message;
  el("action-source").dataset.reading = source;
}
function act(action: Action): void {
  if (record.actions.length >= 200) {
    announce(
      "This record has reached 200 actions. Save it and restart the rehearsal; your explanation will stay.",
      "count",
    );
    return;
  }
  record.actions.push(action);
  redo = [];
  keep();
  render();
  const latest = replay(record.preset, record.actions).steps.at(-1);
  if (latest) announce(latest.message, latest.source);
}
function renderCitations(): void {
  el("citations").innerHTML = record.citations.length
    ? `<p>Selected passages:</p><ul>${record.citations.map((id) => `<li>${escapeHtml(reading(id).title)} (${reading(id).reference}) <button type="button" class="text-button" data-remove="${id}" aria-label="Remove ${escapeHtml(reading(id).title)} citation">Remove</button></li>`).join("")}</ul>`
    : '<p class="small">Select a passage below the Greek to cite it here.</p>';
  el<HTMLButtonElement>("cite").disabled = record.citations.includes(readingId);
  el("cite").textContent = record.citations.includes(readingId)
    ? "Passage added to record"
    : "Add passage to my record";
}
function renderInference(): void {
  const { court } = replay(record.preset, record.actions);
  const available = inferenceAvailable(court);
  el<HTMLSelectElement>("target-juror").value = String(record.knowledge.target);
  el<HTMLSelectElement>("target-juror").disabled = !available;
  for (let i = 0; i < PANEL; i++) {
    const field = el<HTMLInputElement>(`known-${i}`);
    field.checked = record.knowledge.known.includes(i);
    field.disabled = !available || i === record.knowledge.target;
    el(`known-value-${i}`).textContent =
      i === record.knowledge.target
        ? "target"
        : field.checked
          ? (court.votes[i] ?? "not yet cast")
          : "unknown";
  }
  for (const id of ["know-none", "know-nine", "inspect-inference"])
    el<HTMLButtonElement>(id).disabled = !available;
  el("inspect-inference").textContent = record.knowledge.inspected
    ? "Recheck compatible arrangements"
    : "Inspect compatible arrangements";
  el("inference-results").innerHTML = inferenceReport(court, record.knowledge);
}
function render(): void {
  const { court, steps } = replay(record.preset, record.actions);
  const completed = court.votes.length === PANEL;
  el<HTMLSelectElement>("preset").value = record.preset;
  el("workbench-title").textContent =
    record.preset === "empty"
      ? "Cast the panel’s ballots."
      : record.preset === "wooden-urn"
        ? "Which urn tells the truth?"
        : "Cast the last ballot.";
  el("training-intro").textContent =
    record.preset === "empty"
      ? "Ten jurors in a modern training panel. None has cast yet."
      : "Ten jurors in a modern training panel. Nine invented votes are already in the urns.";
  el("progress").textContent = completed
    ? "Panel complete"
    : `Juror ${court.votes.length + 1} of ${PANEL}`;
  el("cast-count").textContent = `${court.votes.length} of ${PANEL} have cast`;
  el("pair-caption").textContent = completed
    ? "Every training juror has cast. Open an urn below."
    : court.issued
      ? "One of each received. Choose the ballot that will count."
      : "Receive one of each, in plain view of both litigants.";
  for (const id of ["issue", "two-pierced", "two-solid"])
    el<HTMLButtonElement>(id).disabled = completed || court.issued;
  for (const kind of ["pierced", "solid"] as const) {
    el<HTMLInputElement>(`choose-${kind}`).disabled = !court.issued;
    el<HTMLInputElement>(`choose-${kind}`).checked = court.choice === kind;
  }
  el<HTMLButtonElement>("cast").disabled = !court.issued || completed;
  el<HTMLInputElement>("covered").checked = court.covered;
  el("urn-drawing").innerHTML = urnSvg(court.votes.length);
  el("observer-drawing").innerHTML = observerSvg(court.covered, court.choice);
  el("observation-text").textContent = observer(court.covered, court.choice);
  if (record.observation) {
    const pinned = record.observation;
    const same = observer(pinned.covered, pinned.choice) === observer(court.covered, court.choice);
    el("comparison").innerHTML =
      `<h4>Pinned: ${pinned.choice}, ${pinned.covered ? "covered" : "exposed"}</h4><p>${same ? "The isolated observer view is the same." : "The isolated observer view is different."} ${pinned.choice !== court.choice ? "The private choice has changed." : "The private choice is the same."}</p><p class="small">${same && pinned.choice !== court.choice ? "The covered ends conceal this difference in the drawing." : "Compare the grip and the private selection separately."}</p>`;
  } else
    el("comparison").innerHTML =
      "<p>Pin a view, then change the private choice. Does the visible view change?</p>";
  el("board").innerHTML = boardSvg(court);
  const result = verdict(court);
  el("verdict").innerHTML =
    `<h4>${escapeHtml(result.title)}</h4><p>${escapeHtml(result.body)}</p><a href="#reader" data-reading="${court.counted === "wood" ? "urns" : "tie"}">Read the clause</a>`;
  el("verdict").classList.toggle(
    "altered",
    court.intervention !== "none" || court.counted === "wood",
  );
  el("audit-table").innerHTML =
    court.counted === "bronze"
      ? auditTable(court)
      : "<p>Complete the panel and open bronze to compare the totals.</p>";
  for (const id of ["audit-none", "audit-extra", "audit-replace"])
    el<HTMLButtonElement>(id).disabled = court.counted !== "bronze";
  el("audit-message").textContent =
    court.counted !== "bronze"
      ? "Open the bronze count to try this experiment."
      : court.intervention === "none"
        ? "The original count is shown. Try the two changes separately."
        : court.intervention === "extra"
          ? `${contents(court, "bronze").length} ballots: the total exceeds ten jurors.`
          : "Ten ballots still match ten jurors. One altered ballot changes the split without changing the total.";
  const start = initial(record.preset);
  el("starting-facts").textContent =
    record.preset === "empty"
      ? "The training panel begins empty."
      : `Nine invented prior votes: ${start.votes.filter((v) => v === "pierced").length} pierced, ${start.votes.filter((v) => v === "solid").length} solid. No historical case is represented.`;
  el("events").innerHTML =
    steps
      .map(
        (s) =>
          `<li class="${s.accepted ? "accepted" : "refused"}">${s.accepted ? "Accepted" : "Refused"}: ${escapeHtml(s.message)} <a href="#reader" data-reading="${s.source}">Source</a></li>`,
      )
      .join("") || "<li>No new actions yet.</li>";
  el<HTMLButtonElement>("undo").disabled = record.actions.length === 0;
  el<HTMLButtonElement>("redo").disabled = redo.length === 0;
  renderCitations();
  renderInference();
}
async function loadScan(): Promise<void> {
  const id = ++loadId;
  scanController?.abort();
  const controller = new AbortController();
  scanController = controller;
  const page = sourcePage(el<HTMLSelectElement>("scan-page").value);
  const name = page.label;
  el<HTMLImageElement>("scan").hidden = true;
  el("scan-status").textContent = `Loading complete page ${name}…`;
  el<HTMLAnchorElement>("archive-link").href =
    `https://archive.org/details/aristotelisathen00aris/page/n${page.leaf}/mode/1up`;
  let url: string | null = null;
  try {
    const bytes = await verifiedBytes(asset(page.image), controller.signal);
    url = URL.createObjectURL(new Blob([bytes], { type: "image/jpeg" }));
    const prepared = new Image();
    prepared.src = url;
    await prepared.decode();
    if (id !== loadId || controller.signal.aborted) {
      URL.revokeObjectURL(url);
      return;
    }
    if (scanUrl) URL.revokeObjectURL(scanUrl);
    scanUrl = url;
    const img = el<HTMLImageElement>("scan");
    img.src = url;
    img.alt = `Complete ${name}, Kenyon’s edition first published 1920; ${page.description}.`;
    img.hidden = false;
    el("scan-status").textContent =
      `Page ${name} checked against its retained file. Enlarge and use arrow keys to pan.`;
    el("scan-viewport").scrollTo(0, 0);
  } catch (error) {
    if (url) URL.revokeObjectURL(url);
    if (id !== loadId || controller.signal.aborted) return;
    el("scan-status").textContent =
      `${error instanceof Error ? error.message : "The page could not be loaded."} Use Reload page to retry.`;
  }
}
function showReading(id: string): void {
  const r = reading(id);
  readingId = id;
  el<HTMLSelectElement>("reading").value = id;
  el("reading-reference").textContent =
    `Constitution of the Athenians ${r.reference} · printed ${r.page}`;
  const text = el("greek");
  text.replaceChildren();
  let rest = r.greek;
  // Match only exact source phrases; ordinary text is always a text node.
  while (rest) {
    const found = r.phrases
      .map((p, i) => ({ phrase: p.greek, i, at: rest.indexOf(p.greek) }))
      .filter((p) => p.at >= 0)
      .sort((a, b) => a.at - b.at || b.phrase.length - a.phrase.length)[0];
    if (!found) {
      text.append(rest);
      break;
    }
    text.append(rest.slice(0, found.at));
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = found.phrase;
    b.dataset.phrase = String(found.i);
    text.append(b);
    rest = rest.slice(found.at + found.phrase.length);
  }
  el("english").textContent = r.english;
  el("editorial").textContent = r.note;
  el("phrase-note").textContent = "Select an underlined phrase to read its role in the procedure.";
  el<HTMLSelectElement>("scan-page").value = r.page === "LXVII" ? "67" : "68";
  renderCitations();
  void loadScan();
}

el("pair-drawing").innerHTML = pairSvg();
el("target-juror").innerHTML = Array.from(
  { length: PANEL },
  (_, i) => `<option value="${i}">Juror ${i + 1}</option>`,
).join("");
el("known-jurors").innerHTML = Array.from(
  { length: PANEL },
  (_, i) =>
    `<label><input type="checkbox" id="known-${i}" value="${i}" /><span>Juror ${i + 1}<small id="known-value-${i}">unknown</small></span></label>`,
).join("");
el("target-juror").addEventListener("change", () => {
  record.knowledge.target = Number(el<HTMLSelectElement>("target-juror").value);
  record.knowledge.known = record.knowledge.known.filter((i) => i !== record.knowledge.target);
  keep();
  renderInference();
});
el("known-jurors").addEventListener("change", (event) => {
  const field = event.target as HTMLInputElement;
  const i = Number(field.value);
  record.knowledge.known = record.knowledge.known.filter((j) => j !== i);
  if (field.checked) record.knowledge.known.push(i);
  record.knowledge.known.sort((a, b) => a - b);
  keep();
  renderInference();
});
button("know-none", () => {
  record.knowledge.known = [];
  keep();
  renderInference();
});
button("know-nine", () => {
  record.knowledge.known = Array.from({ length: PANEL }, (_, i) => i).filter(
    (i) => i !== record.knowledge.target,
  );
  keep();
  renderInference();
});
button("inspect-inference", () => {
  record.knowledge.inspected = true;
  keep();
  renderInference();
});
el("reading").innerHTML = readings
  .map((r) => `<option value="${r.id}">${r.reference} · ${r.title}</option>`)
  .join("");
button("issue", () => act({ type: "issue", pair: "mixed" }));
button("two-pierced", () => act({ type: "issue", pair: "two-pierced" }));
button("two-solid", () => act({ type: "issue", pair: "two-solid" }));
for (const kind of ["pierced", "solid"] as Ballot[])
  el(`choose-${kind}`).addEventListener("change", () => act({ type: "choose", ballot: kind }));
el("covered").addEventListener("change", () =>
  act({ type: "cover", covered: el<HTMLInputElement>("covered").checked }),
);
button("cast", () => act({ type: "cast" }));
button("count-bronze", () => act({ type: "count", urn: "bronze" }));
button("count-wood", () => act({ type: "count", urn: "wood" }));
for (const kind of ["none", "extra", "replace"] as const)
  button(`audit-${kind}`, () => act({ type: "intervene", kind }));
button("pin", () => {
  const { court } = replay(record.preset, record.actions);
  record.observation = { choice: court.choice, covered: court.covered };
  keep();
  render();
  announce("Observer view pinned. Change the private choice while the ends stay covered.", "grip");
});
button("undo", () => {
  const a = record.actions.pop();
  if (a) redo.push(a);
  keep();
  render();
  announce("Last action undone. Your explanation and citations are kept.", "count");
});
button("redo", () => {
  const a = redo.pop();
  if (a) record.actions.push(a);
  keep();
  render();
  announce("Action restored.", "count");
});
function restart(preset: Preset): void {
  record = { ...fresh(preset), note: record.note, citations: [...record.citations] };
  redo = [];
  keep();
  render();
  announce("Rehearsal restarted. Your explanation and citations were kept.", "pair");
}
button("restart", () => restart(record.preset));
el("preset").addEventListener("change", () =>
  restart(el<HTMLSelectElement>("preset").value as Preset),
);
el("note").addEventListener("input", () => {
  record.note = el<HTMLTextAreaElement>("note").value;
  keep();
});
el<HTMLTextAreaElement>("note").value = record.note;
button("cite", () => {
  if (!record.citations.includes(readingId)) record.citations.push(readingId);
  keep();
  renderCitations();
});
el("citations").addEventListener("click", (event) => {
  const id = (event.target as Element).closest<HTMLElement>("[data-remove]")?.dataset.remove;
  if (!id) return;
  const index = record.citations.indexOf(id);
  record.citations = record.citations.filter((c) => c !== id);
  keep();
  renderCitations();
  const next = record.citations[Math.min(index, record.citations.length - 1)];
  if (next) document.querySelector<HTMLButtonElement>(`[data-remove="${next}"]`)?.focus();
  else el("note").focus();
});
document.addEventListener("click", (event) => {
  const id = (event.target as Element).closest<HTMLElement>("[data-reading]")?.dataset.reading;
  if (id) showReading(id);
});
el("reading").addEventListener("change", () => showReading(el<HTMLSelectElement>("reading").value));
el("greek").addEventListener("click", (event) => {
  const id = (event.target as Element).closest<HTMLElement>("[data-phrase]")?.dataset.phrase;
  if (id === undefined) return;
  const phrase = reading(readingId).phrases[Number(id)];
  if (phrase)
    el("phrase-note").textContent =
      `${phrase.greek} · ${phrase.transliteration}. ${phrase.meaning}`;
});
el("scan-page").addEventListener("change", () => {
  void loadScan();
});
button("retry-scan", () => {
  void loadScan();
});
button("zoom", () => {
  const zoomed = el("scan-viewport").classList.toggle("enlarged");
  el("zoom").setAttribute("aria-pressed", String(zoomed));
  el("zoom").textContent = zoomed ? "Fit width" : "Enlarge page";
  el("scan-viewport").scrollTo(0, 0);
});
el("scan-viewport").addEventListener("keydown", (event) => {
  const move: Record<string, [number, number]> = {
    ArrowLeft: [-80, 0],
    ArrowRight: [80, 0],
    ArrowUp: [0, -80],
    ArrowDown: [0, 80],
  };
  const d = move[event.key];
  if (d) {
    event.preventDefault();
    el("scan-viewport").scrollBy(d[0], d[1]);
  }
});
button("save-json", () => {
  saveFile("psephos-court-record.json", serialize(record), "application/json");
  el("file-status").textContent = "Editable court record saved. Reopen it here to continue.";
});
button("save-svg", () => {
  saveFile("psephos-count.svg", diagram(record), "image/svg+xml");
  el("file-status").textContent =
    "Count diagram saved with its source and training-panel boundary.";
});
button("save-html", () => {
  if (exportController) return;
  const snapshot = structuredClone(record);
  const controller = new AbortController();
  exportController = controller;
  el<HTMLButtonElement>("save-html").disabled = true;
  el("cancel-export").hidden = false;
  el("file-status").textContent =
    "Preparing the record as it was when Save was pressed; checking every embedded source, font and license…";
  void illustrated(snapshot, controller.signal)
    .then((html) => {
      controller.signal.throwIfAborted();
      saveFile("psephos-illustrated-record.html", html, "text/html");
      el("file-status").textContent =
        "Illustrated record saved with the rehearsal and explanation from when Save was pressed.";
    })
    .catch((error: unknown) => {
      el("file-status").textContent = controller.signal.aborted
        ? "Preparation canceled. Your current work is kept."
        : `${error instanceof Error ? error.message : "The record could not be prepared."} Your current work is kept; retry when the files are available.`;
      controller.abort();
    })
    .finally(() => {
      exportController = null;
      el<HTMLButtonElement>("save-html").disabled = false;
      el("cancel-export").hidden = true;
    });
});
button("cancel-export", () => exportController?.abort());
button("copy-link", () => {
  const link = recordLink(record, location.href);
  void navigator.clipboard
    ?.writeText(link)
    .then(() => {
      el("file-status").textContent =
        "Rehearsal link copied, including private choices, citations and explanation.";
    })
    .catch(() => fallback(link));
  if (!navigator.clipboard) fallback(link);
});
function fallback(link: string): void {
  el("share-fallback").hidden = false;
  const field = el<HTMLTextAreaElement>("share-text");
  field.value = link;
  field.focus();
  field.select();
  el("file-status").textContent =
    "Clipboard access was unavailable. Copy the selected rehearsal link.";
}
el("open-file").addEventListener("change", () => {
  const field = el<HTMLInputElement>("open-file");
  const file = field.files?.[0];
  if (!file) return;
  const startRevision = revision;
  if (file.size > 100_000) {
    el("file-status").textContent =
      "Choose a court record smaller than 100 KB. Your current work is kept.";
    field.value = "";
    return;
  }
  void file
    .text()
    .then((text) => {
      const next = parseRecord(text);
      if (revision !== startRevision)
        throw new Error(
          "Your work changed while the file was being read. Choose it again to replace the current rehearsal.",
        );
      record = next;
      redo = [];
      keep();
      render();
      el<HTMLTextAreaElement>("note").value = record.note;
      el("file-status").textContent =
        "Court record reopened. Counts were recomputed from its actions.";
    })
    .catch((error: unknown) => {
      el("file-status").textContent =
        `${error instanceof Error ? error.message : "The file could not be read."} Your current work is kept.`;
    })
    .finally(() => {
      field.value = "";
    });
});
window.addEventListener("hashchange", () => {
  try {
    const next = fromLink(location.hash);
    if (!next) return;
    record = next;
    redo = [];
    keep();
    render();
    el<HTMLTextAreaElement>("note").value = record.note;
    el("file-status").textContent = "Shared rehearsal opened from the link.";
  } catch (error) {
    el("file-status").textContent =
      error instanceof Error ? error.message : "The shared record could not be read.";
  }
});
render();
showReading("pair");
if (initialMessage) el("file-status").textContent = initialMessage;
installOffline(el("offline-status"));
