import "./style.css";
import "./allotment-style.css";
import retained from "./allotment-assets.json";
import { allotmentPages, allotmentReadings } from "./allotment-readings";
import {
  allotmentCsv,
  boardSvg,
  chanceTable,
  comparison,
  esc,
  illustratedAllotment,
  placementTable,
  relation,
  saveAllotmentFile,
  ticketStatus,
} from "./allotment-view";
import { verifiedBytes } from "./assets";
import {
  allotmentFromLink,
  allotmentLink,
  freshAllotment,
  LETTERS,
  newAllotment,
  parseAllotment,
  probabilities,
  randomIndex,
  releaseCube,
  shuffled,
  swapTickets,
  ticketRow,
} from "./core/allotment";
import { installOffline } from "./offline";

function el<T extends HTMLElement = HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing allotment element: ${id}`);
  return element as T;
}
const on = (id: string, handler: () => void) => el(id).addEventListener("click", handler);
const select = (id: string) => el<HTMLSelectElement>(id);
const button = (id: string) => el<HTMLButtonElement>(id);
const message = (text: string) => {
  el("draw-message").textContent = text;
};
const pick = (size: number): number =>
  randomIndex(size, (bytes) => {
    crypto.getRandomValues(bytes);
  });
let record = freshAllotment();
let pendingTicket: string | null = null;
let inspected = false;
let revision = 0;
let scanRequest = 0;
let scanController: AbortController | null = null;
let scanUrl: string | null = null;
let exportController: AbortController | null = null;
try {
  const shared = allotmentFromLink(location.hash);
  if (shared) {
    record = shared;
    message(
      "Shared study opened. Chances are recomputed from the board; no explanation was included in the link.",
    );
  }
} catch (error) {
  message(error instanceof Error ? error.message : "The shared study could not be opened.");
}
function changed(): void {
  revision++;
  pendingTicket = null;
  el("allotment-link").hidden = true;
  el("allotment-link-label").hidden = true;
  render();
}
function identityOptions(): void {
  const options = LETTERS.flatMap((letter) =>
    Array.from(
      { length: record.study.rows },
      (_, i) => `<option value="${letter}${i + 1}">${letter}${i + 1}</option>`,
    ),
  ).join("");
  select("first-ticket").innerHTML = options;
  select("second-ticket").innerHTML = options;
}
function render(): void {
  const study = record.study;
  const drawn = study.draws.length > 0;
  select("row-count").value = String(study.rows);
  select("white-count").innerHTML = Array.from(
    { length: study.rows - 1 },
    (_, i) => `<option value="${i + 1}">${i + 1} white / ${study.rows - i - 1} black</option>`,
  ).join("");
  select("white-count").value = String(study.whites);
  select("row-count").disabled = drawn;
  select("white-count").disabled = drawn;
  const whiteLeft = study.whites - study.draws.filter((c) => c === "W").length;
  const blackLeft = study.rows - study.whites - study.draws.filter((c) => c === "B").length;
  el("supply").textContent =
    `${study.rows * 5} ordinary tickets. ${study.whites * 5} enter the service pool. Remaining: ${whiteLeft} white, ${blackLeft} black.`;
  el("ticket-board").innerHTML =
    `<table class="ticket-table"><caption class="small">Five letter groups of one tribe; a schematic device</caption><thead><tr><th class="row-number" scope="col"><span class="sr-only">Row</span></th>${LETTERS.map((letter) => `<th scope="col">${letter}</th>`).join("")}<th class="row-decision" scope="col">Lot</th></tr></thead><tbody>${Array.from(
      { length: study.rows },
      (_, row) => {
        const cube = study.draws[row];
        return `<tr class="${cube === "W" ? "row-white" : cube === "B" ? "row-black" : "row-pending"}"><th class="row-number" scope="row">${row + 1}</th>${LETTERS.map(
          (letter, col) => {
            const ticket = `${letter}${study.columns[col]?.[row]}`;
            const tracked = study.pair.indexOf(ticket);
            return `<td><button type="button" class="ticket ${tracked === 0 ? "tracked-first" : tracked === 1 ? "tracked-second" : ""}" data-ticket="${ticket}" aria-label="${ticket}, row ${row + 1}${tracked >= 0 ? `, ${tracked === 0 ? "first" : "second"} identity` : ""}; ${ticketStatus(study, ticket)}" aria-pressed="${pendingTicket === ticket}" ${drawn ? "disabled" : ""}>${ticket}</button></td>`;
          },
        ).join(
          "",
        )}<td class="row-decision">${cube === "W" ? "W<br>admit" : cube === "B" ? "B<br>reject" : "—"}</td></tr>`;
      },
    ).join("")}</tbody></table>`;
  select("first-ticket").value = study.pair[0];
  select("second-ticket").value = study.pair[1];
  el("pair-relation").textContent = relation(study);
  el("pair-outcome").textContent = study.pair
    .map((ticket) => `${ticket}: ${ticketStatus(study, ticket)}.`)
    .join(" ");
  for (const id of ["move-second", "shuffle-tickets"]) button(id).disabled = drawn;
  button("release-cube").disabled = study.draws.length === study.rows;
  button("undo-cube").disabled = !drawn;
  button("reset-cubes").disabled = !drawn;
  el("placement-instruction").textContent = drawn
    ? "Placement and supply are locked during a draw. Reset the draw to move tickets."
    : pendingTicket
      ? `${pendingTicket} chosen. Choose another ticket in its letter column to swap; choose it again to cancel.`
      : `To swap, choose two tickets in the same letter column. All ${study.rows * 5} identities are invented.`;
  el("cube-log").innerHTML = study.draws
    .map((cube, i) => `<li>Row ${i + 1}: ${cube === "W" ? "white, admit" : "black, reject"}</li>`)
    .join("");
  el("chances").hidden = !inspected;
  el("chances").innerHTML = inspected
    ? `${chanceTable(study)}${drawn ? chanceTable(study, true) : ""}`
    : "";
  el("unfixed-placement").hidden = !inspected;
  el("placement-chances").innerHTML = inspected ? placementTable(study) : "";
  el("order-section").hidden = !inspected;
  if (inspected) {
    const before = probabilities(study);
    const after = probabilities(study, true);
    el("orders-explanation").textContent =
      `There are ${before.orders.length} equally likely colour orders before the draw. ${drawn ? `${after.orders.length} still match the released prefix; the others are marked “other prefix”.` : "Each admits exactly the same number of rows, with five tickets per admitted row."}`;
    el("order-list").innerHTML = before.orders
      .map((order, i) => {
        const compatible = study.draws.every((c, r) => order[r] === c);
        const outcomes = study.pair
          .map((t) => `${t} ${order[ticketRow(study, t)] === "W" ? "in" : "out"}`)
          .join("; ");
        return `<button type="button" class="order-strip ${compatible ? "" : "incompatible"}" data-order="${i}" aria-current="${study.draws.join("") === order.join("")}">${order.map((c) => `<span class="${c === "B" ? "black-cube" : ""}">${c}</span>`).join(" ")}<small>${outcomes}${compatible ? "" : "; other prefix"}</small></button>`;
      })
      .join("");
  }
  el("pinned-board").innerHTML = comparison(record);
}
function attempt(action: () => void): void {
  try {
    action();
  } catch (error) {
    message(error instanceof Error ? error.message : "This action could not be completed.");
  }
}
identityOptions();
el<HTMLTextAreaElement>("allotment-note").value = record.note;
render();
on("move-second", () =>
  attempt(() => {
    const ticket = record.study.pair[1];
    const column = LETTERS.indexOf(ticket[0] as (typeof LETTERS)[number]);
    const nextRow = (ticketRow(record.study, ticket) + 1) % record.study.rows;
    const partner = `${ticket[0]}${record.study.columns[column]?.[nextRow]}`;
    record.study = swapTickets(record.study, ticket, partner);
    changed();
    message(`${ticket} and ${partner} swapped within their letter column. No cube has been drawn.`);
  }),
);
on("shuffle-tickets", () =>
  attempt(() => {
    record.study = shuffled(record.study, pick);
    changed();
    message(
      "Each letter column was shuffled separately. The pair follows its identities. Chance calculations now condition on this fixed placement.",
    );
  }),
);
el("ticket-board").addEventListener("click", (event) => {
  const target = (event.target as HTMLElement).closest<HTMLButtonElement>("button[data-ticket]");
  const ticket = target?.dataset.ticket;
  if (!ticket || record.study.draws.length) return;
  if (!pendingTicket) {
    pendingTicket = ticket;
    render();
  } else if (pendingTicket === ticket) {
    pendingTicket = null;
    render();
  } else
    attempt(() => {
      record.study = swapTickets(record.study, pendingTicket as string, ticket);
      changed();
      message("The two identities swapped rows within their letter column.");
    });
  // Rerendered ticket buttons remain keyboard-operable at the same identity.
  el("ticket-board").querySelector<HTMLButtonElement>(`[data-ticket="${ticket}"]`)?.focus();
});
for (const id of ["first-ticket", "second-ticket"])
  select(id).addEventListener("change", () => {
    const a = select("first-ticket").value;
    const b = select("second-ticket").value;
    if (a === b) {
      message("Choose two different identities to compare.");
      render();
      return;
    }
    record.study.pair = [a, b];
    changed();
    message("The pair changed; kept comparisons preserve their original identities.");
  });
select("row-count").addEventListener("change", () => {
  record.study = newAllotment(
    Number(select("row-count").value),
    Math.min(record.study.whites, Number(select("row-count").value) - 1),
  );
  identityOptions();
  changed();
  message("A new full board was prepared. The kept board and explanation remain available.");
});
select("white-count").addEventListener("change", () => {
  record.study.whites = Number(select("white-count").value);
  changed();
  message("Cube supply changed. Any kept board retains its original supply.");
});
on("release-cube", () =>
  attempt(() => {
    record.study = releaseCube(record.study, pick);
    changed();
    const cube = record.study.draws.at(-1);
    message(
      `Row ${record.study.draws.length}: ${cube === "W" ? "white; its five ordinary tickets enter the service pool" : "black; its five ordinary tickets are rejected"}. ${record.study.draws.length === record.study.rows ? "All rows are decided." : "The next cube comes from the remaining supply."}${record.study.drawMode === "chosen" ? " This sequence retains a chosen prefix." : ""}`,
    );
  }),
);
on("undo-cube", () => {
  record.study.draws.pop();
  changed();
  message(
    "Last cube returned to the supply. Earlier rows were kept. This is an editable experiment, not a physical lottery record.",
  );
});
on("reset-cubes", () => {
  record.study.draws = [];
  record.study.drawMode = "random";
  changed();
  message("Every cube returned to the supply. Placement, pair, explanation and kept board remain.");
});
on("keep-board", () => {
  record.pinned = structuredClone(record.study);
  changed();
  message("Board kept with its own placement, pair, cube supply and released sequence.");
});
el("pinned-board").addEventListener("click", (event) => {
  const id = (event.target as HTMLElement).closest("button")?.id;
  if (id === "restore-kept" && record.pinned) {
    record.study = structuredClone(record.pinned);
    identityOptions();
    changed();
    message("Kept board restored. Your explanation remains.");
  } else if (id === "clear-kept") {
    record.pinned = null;
    changed();
    message("Comparison cleared. Current board and explanation remain.");
  }
});
on("inspect-chances", () => {
  inspected = true;
  render();
  message(
    "Exact chances and every colour order are open below. They assume this placement is fixed before the draw.",
  );
});
el("order-list").addEventListener("click", (event) => {
  const index = (event.target as HTMLElement).closest<HTMLButtonElement>("button[data-order]")
    ?.dataset.order;
  if (index === undefined) return;
  const order = probabilities(record.study).orders[Number(index)];
  if (!order) return;
  record.study.draws = [...order];
  record.study.drawMode = "chosen";
  changed();
  message(
    "Applied this enumerated colour order as a chosen example. This is not a new random draw. Reset to draw again.",
  );
});

select("allotment-reading").innerHTML = allotmentReadings
  .map((r) => `<option value="${r.id}">${esc(r.title)}</option>`)
  .join("");
select("allotment-page").innerHTML = allotmentPages
  .map((p) => `<option value="${p.id}">${esc(p.label)}</option>`)
  .join("");
async function loadScan(): Promise<void> {
  const request = ++scanRequest;
  scanController?.abort();
  const controller = new AbortController();
  scanController = controller;
  const page =
    allotmentPages.find((p) => p.id === select("allotment-page").value) ?? allotmentPages[1];
  const item = retained.find((a) => a.path === page.path);
  if (!item) return;
  const img = el<HTMLImageElement>("allotment-scan");
  img.hidden = true;
  el("allotment-scan-status").textContent = "Loading and checking the complete printed page…";
  el<HTMLAnchorElement>("allotment-archive").href =
    `https://archive.org/details/aristotelisathen00aris/page/n${page.leaf}/mode/1up`;
  let url: string | null = null;
  try {
    const bytes = await verifiedBytes(item, controller.signal);
    url = URL.createObjectURL(new Blob([bytes], { type: "image/jpeg" }));
    // Decode in isolation before replacing the visible image. Firefox can
    // reject decode() on a reused element while its previous request changes.
    const prepared = new Image();
    prepared.src = url;
    await prepared.decode();
    if (request !== scanRequest || controller.signal.aborted) {
      URL.revokeObjectURL(url);
      return;
    }
    if (scanUrl) URL.revokeObjectURL(scanUrl);
    scanUrl = url;
    img.src = url;
    img.alt = `${page.label}, archive leaf ${page.leaf}; complete printed page with critical apparatus`;
    img.hidden = false;
    el("allotment-scan-viewport").scrollTo(0, 0);
    el("allotment-scan-status").textContent =
      `${page.label}: checked against this edition’s retained bytes.`;
  } catch (error) {
    if (url) URL.revokeObjectURL(url);
    if (request !== scanRequest || controller.signal.aborted) return;
    el("allotment-scan-status").textContent =
      `${error instanceof Error ? error.message : "The source page could not be loaded."} Use Reload page to retry. Your study has been kept.`;
  }
}
function renderReading(): void {
  const reading =
    allotmentReadings.find((r) => r.id === select("allotment-reading").value) ??
    allotmentReadings[2];
  el("allotment-reference").textContent = `Constitution of the Athenians ${reading.reference}`;
  el("allotment-greek").textContent = reading.greek;
  el("allotment-english").textContent = reading.english;
  el("allotment-editorial").textContent = reading.note;
  el("allotment-words").innerHTML = reading.phrases
    .map(
      ([phrase], i) => `<button type="button" data-word="${i}" lang="grc">${esc(phrase)}</button>`,
    )
    .join("");
  el("allotment-word-note").textContent =
    "Choose a Greek phrase for its meaning and its role here.";
  select("allotment-page").value = reading.leaf;
  void loadScan();
}
select("allotment-reading").value = "cubes";
renderReading();
select("allotment-reading").addEventListener("change", renderReading);
select("allotment-page").addEventListener("change", () => {
  void loadScan();
});
on("allotment-retry", () => {
  void loadScan();
});
el("allotment-words").addEventListener("click", (event) => {
  const index = (event.target as HTMLElement).closest<HTMLButtonElement>("button[data-word]")
    ?.dataset.word;
  const reading = allotmentReadings.find((r) => r.id === select("allotment-reading").value);
  const phrase = index === undefined ? null : reading?.phrases[Number(index)];
  if (phrase) el("allotment-word-note").textContent = `${phrase[0]} (${phrase[1]}): ${phrase[2]}`;
});
on("allotment-zoom", () => {
  const zoomed = button("allotment-zoom").getAttribute("aria-pressed") !== "true";
  button("allotment-zoom").setAttribute("aria-pressed", String(zoomed));
  el("allotment-scan-viewport").classList.toggle("enlarged", zoomed);
  button("allotment-zoom").textContent = zoomed ? "Fit page" : "Enlarge page";
  if (!zoomed) el("allotment-scan-viewport").scrollTo(0, 0);
});
el("allotment-scan-viewport").addEventListener("keydown", (event) => {
  const offsets: Record<string, [number, number]> = {
    ArrowUp: [0, -100],
    ArrowDown: [0, 100],
    ArrowLeft: [-100, 0],
    ArrowRight: [100, 0],
  };
  const offset = offsets[event.key];
  if (offset) {
    event.preventDefault();
    el("allotment-scan-viewport").scrollBy(...offset);
  }
});
el<HTMLTextAreaElement>("allotment-note").addEventListener("input", () => {
  record.note = el<HTMLTextAreaElement>("allotment-note").value;
  revision++;
});
on("allotment-save-json", () => {
  saveAllotmentFile("psephos-allotment.json", JSON.stringify(record, null, 2), "application/json");
  el("allotment-file-status").textContent =
    "Editable study saved with both boards and your explanation.";
});
on("allotment-save-svg", () => {
  saveAllotmentFile("psephos-allotment.svg", boardSvg(record.study), "image/svg+xml");
});
on("allotment-save-csv", () => {
  saveAllotmentFile("psephos-allotment.csv", allotmentCsv(record), "text/csv;charset=utf-8");
});
on("allotment-save-html", () => {
  if (exportController) return;
  const snapshot = structuredClone(record);
  const started = revision;
  const controller = new AbortController();
  exportController = controller;
  button("allotment-save-html").disabled = true;
  button("allotment-cancel").hidden = false;
  el("allotment-file-status").textContent =
    "Checking source images, fonts and licenses for the illustrated reading…";
  void illustratedAllotment(snapshot, controller.signal)
    .then((html) => {
      controller.signal.throwIfAborted();
      saveAllotmentFile("psephos-allotment-reading.html", html, "text/html;charset=utf-8");
      el("allotment-file-status").textContent =
        started === revision
          ? "Illustrated reading saved, with verified source bytes and no external assets."
          : "Illustrated reading saved from the study when saving began. Later changes remain on the board; save again to include them.";
    })
    .catch((error) => {
      el("allotment-file-status").textContent = controller.signal.aborted
        ? "Reading cancelled. Your study remains. Save again when ready."
        : `${error instanceof Error ? error.message : "The reading could not be saved."} Your study remains; reconnect and try again.`;
    })
    .finally(() => {
      if (exportController !== controller) return;
      exportController = null;
      button("allotment-save-html").disabled = false;
      button("allotment-cancel").hidden = true;
    });
});
on("allotment-cancel", () => {
  exportController?.abort();
});
on("allotment-copy", () => {
  const link = new URL(location.href);
  link.hash = allotmentLink(record);
  const fallback = () => {
    el("allotment-link").hidden = false;
    el("allotment-link-label").hidden = false;
    el<HTMLTextAreaElement>("allotment-link").value = link.href;
    el<HTMLTextAreaElement>("allotment-link").select();
    el("allotment-file-status").textContent =
      "Copy the study link below. Your explanation is excluded.";
  };
  if (!navigator.clipboard) fallback();
  else
    void navigator.clipboard
      .writeText(link.href)
      .then(() => {
        el("allotment-file-status").textContent =
          "Study link copied with both boards and draws. Your explanation is excluded.";
      })
      .catch(fallback);
});
el<HTMLInputElement>("allotment-open").addEventListener("change", async () => {
  const input = el<HTMLInputElement>("allotment-open");
  const file = input.files?.[0];
  if (!file) return;
  const started = revision;
  try {
    if (file.size > 40_000) throw new Error("This file is too large for an allotment study.");
    const parsed = parseAllotment(await file.text());
    if (started !== revision)
      throw new Error(
        "The board changed while this file was opening. Choose the file again to replace it.",
      );
    record = parsed;
    identityOptions();
    el<HTMLTextAreaElement>("allotment-note").value = record.note;
    changed();
    el("allotment-file-status").textContent =
      "Study reopened. Chances were recomputed; placement, draw, comparison and explanation were restored.";
  } catch (error) {
    el("allotment-file-status").textContent =
      `${error instanceof Error ? error.message : "This study could not be opened."} Your current study remains.`;
  } finally {
    input.value = "";
  }
});
installOffline(el("offline-status"));
