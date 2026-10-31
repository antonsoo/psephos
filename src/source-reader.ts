import retained from "./allotment-assets.json";
import { allotmentPages, allotmentReadings } from "./allotment-readings";
import { esc } from "./allotment-view";
import { verifiedBytes } from "./assets";

export function installSourceReader(initialReading = "cubes"): void {
  function el<T extends HTMLElement = HTMLElement>(id: string): T {
    const element = document.getElementById(id);
    if (!element) throw new Error(`Missing source reader element: ${id}`);
    return element as T;
  }
  const select = (id: string) => el<HTMLSelectElement>(id);
  const button = (id: string) => el<HTMLButtonElement>(id);
  const on = (id: string, handler: () => void) => el(id).addEventListener("click", handler);
  let scanRequest = 0;
  let scanController: AbortController | null = null;
  let scanUrl: string | null = null;
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
        ([phrase], i) =>
          `<button type="button" data-word="${i}" lang="grc">${esc(phrase)}</button>`,
      )
      .join("");
    el("allotment-word-note").textContent =
      "Choose a Greek phrase for its meaning and its role here.";
    select("allotment-page").value = reading.leaf;
    void loadScan();
  }
  select("allotment-reading").value = initialReading;
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
}
