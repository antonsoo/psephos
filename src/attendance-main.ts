import "./style.css";
import "./allotment-style.css";
import "./attendance-style.css";
import { saveAllotmentFile } from "./allotment-view";
import {
  attendanceComparison,
  attendanceCsv,
  attendanceCurveSvg,
  attendanceCurveTable,
  attendanceProbabilityHtml,
  attendanceReading,
  attendanceSummaryHtml,
  attendanceSvg,
  count,
} from "./attendance-view";
import { LETTERS, randomIndex } from "./core/allotment";
import {
  attendanceFromLink,
  attendanceLink,
  attendancePatterns,
  attendanceSummary,
  changeAttendance,
  exchangeAttendance,
  freshAttendance,
  newAttendance,
  parseAttendanceRecord,
  sampleAttendance,
} from "./core/attendance";
import { installOffline } from "./offline";
import { installSourceReader } from "./source-reader";

function el<T extends HTMLElement = HTMLElement>(id: string): T {
  const found = document.getElementById(id);
  if (!found) throw new Error(`Missing attendance control: ${id}`);
  return found as T;
}
const select = (id: string) => el<HTMLSelectElement>(id);
const button = (id: string) => el<HTMLButtonElement>(id);
const input = (id: string) => el<HTMLInputElement>(id);
const on = (id: string, callback: () => void) => el(id).addEventListener("click", callback);
const message = (text: string) => {
  el("attendance-message").textContent = text;
};
const pick = (size: number) =>
  randomIndex(size, (bytes) => {
    crypto.getRandomValues(bytes);
  });
let record = freshAttendance();
let revision = 0;
let importRequest = 0;
let inspected = false;
let patternPage = 0;
let patternKey = "";
let exportController: AbortController | null = null;
try {
  const shared = attendanceFromLink(location.hash);
  if (shared) {
    record = shared;
    message(
      "Shared attendance opened with its kept comparison. Exact chances are recomputed. The explanation was excluded from the link.",
    );
  }
} catch (error) {
  message(error instanceof Error ? error.message : "This shared attendance could not be read.");
}
function render(): void {
  const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const focusId = active?.id;
  const state = record.current;
  const summary = attendanceSummary(state);
  const nextKey = `${state.population}:${state.quota}:${summary.total}`;
  if (patternKey !== nextKey) {
    patternKey = nextKey;
    patternPage = 0;
  }
  select("attendance-population").value = String(state.population);
  select("attendance-quota").innerHTML = Array.from(
    { length: state.population },
    (_, i) => `<option value="${i + 1}">${i + 1} per group</option>`,
  ).join("");
  select("attendance-quota").value = String(state.quota);
  input("attendance-sample-size").max = String(state.population * 5);
  el("attendance-groups").innerHTML = LETTERS.map(
    (letter, group) =>
      `<section class="attendance-group" aria-labelledby="attendance-group-${group}"><h3 id="attendance-group-${group}"><span class="sr-only">Group </span>${letter}</h3><p class="group-count">${state.counts[group]} of ${state.population}</p><div class="attendance-stack" aria-hidden="true">${Array.from({ length: state.population }, (_, i) => `<span class="attendance-slot ${i < (state.counts[group] as number) ? "present" : ""} ${i === state.quota - 1 ? "at-quota" : ""}"></span>`).join("")}</div><button type="button" id="attendance-add-${group}" data-group="${group}" data-delta="1" aria-label="Add one attendee to group ${letter}" ${state.counts[group] === state.population ? "disabled" : ""}>Add</button><button type="button" id="attendance-remove-${group}" data-group="${group}" data-delta="-1" aria-label="Remove one attendee from group ${letter}" ${state.counts[group] === 0 ? "disabled" : ""}>Remove</button></section>`,
  ).join("");
  el("attendance-summary").innerHTML = attendanceSummaryHtml(state);
  el("attendance-comparison").innerHTML = attendanceComparison(record);
  el("attendance-chances").hidden = !inspected;
  if (inspected) {
    el("attendance-probability").innerHTML = attendanceProbabilityHtml(state);
    el("attendance-curve").innerHTML = attendanceCurveSvg(state);
    el("attendance-curve-table").innerHTML = attendanceCurveTable(state);
    const patterns = attendancePatterns(state);
    const pageSize = 16;
    patternPage = Math.max(0, Math.min(patternPage, Math.ceil(patterns.length / pageSize) - 1));
    const start = patternPage * pageSize;
    el("attendance-pattern-count").textContent =
      `${patterns.length} possible count patterns at total ${summary.total}. Showing ${start + 1}–${Math.min(start + pageSize, patterns.length)}. The last column is a count of distinct individual subsets.`;
    el("attendance-pattern-table").innerHTML =
      `<table class="attendance-data"><thead><tr><th scope="col">A–E counts</th><th scope="col">Meets every group?</th><th scope="col">Individual subsets</th></tr></thead><tbody>${patterns
        .slice(start, start + pageSize)
        .map(
          (pattern, i) =>
            `<tr><td><button type="button" id="attendance-pattern-${start + i}" data-pattern="${start + i}" class="attendance-pattern" aria-current="${pattern.counts.join() === state.counts.join()}">${pattern.counts.join("–")}</button></td><td>${pattern.meets ? "yes" : "no"}</td><td>${count(pattern.weight)}</td></tr>`,
        )
        .join("")}</tbody></table>`;
    button("attendance-pattern-prev").disabled = start === 0;
    button("attendance-pattern-next").disabled = start + pageSize >= patterns.length;
  }
  if (active && (!active.isConnected || (active instanceof HTMLButtonElement && active.disabled))) {
    let next = focusId ? document.getElementById(focusId) : null;
    if (next instanceof HTMLButtonElement && next.disabled) {
      if (focusId?.startsWith("attendance-add-"))
        next = document.getElementById(focusId.replace("-add-", "-remove-"));
      else if (focusId?.startsWith("attendance-remove-"))
        next = document.getElementById(focusId.replace("-remove-", "-add-"));
      else if (focusId === "attendance-pattern-prev") next = button("attendance-pattern-next");
      else if (focusId === "attendance-pattern-next") next = button("attendance-pattern-prev");
    }
    if (!next && focusId === "attendance-clear") next = button("attendance-pin");
    if (next && !(next instanceof HTMLButtonElement && next.disabled))
      next.focus({ preventScroll: true });
  }
}
function changed(sampleSize = true): void {
  revision++;
  el("attendance-link").hidden = true;
  el("attendance-link-label").hidden = true;
  if (sampleSize)
    input("attendance-sample-size").value = String(attendanceSummary(record.current).total);
  render();
}
function attempt(action: () => void): void {
  try {
    action();
  } catch (error) {
    message(
      error instanceof Error ? error.message : "This attendance action could not be completed.",
    );
  }
}
const groupOptions = LETTERS.map(
  (letter, i) => `<option value="${i}">Group ${letter}</option>`,
).join("");
select("attendance-from").innerHTML = groupOptions;
select("attendance-to").innerHTML = groupOptions;
select("attendance-from").value = "0";
select("attendance-to").value = "4";
el<HTMLTextAreaElement>("attendance-note").value = record.note;
input("attendance-sample-size").value = String(attendanceSummary(record.current).total);
render();
el("attendance-groups").addEventListener("click", (event) => {
  const target = (event.target as HTMLElement).closest<HTMLButtonElement>("button[data-group]");
  if (!target) return;
  attempt(() => {
    const group = Number(target.dataset.group);
    const delta = Number(target.dataset.delta);
    record.current = changeAttendance(record.current, group, delta);
    changed();
    message(
      `Group ${LETTERS[group]} now has ${record.current.counts[group]} present. The total is ${attendanceSummary(record.current).total}. This is a constructed attendance.`,
    );
  });
});
on("attendance-exchange", () =>
  attempt(() => {
    const from = Number(select("attendance-from").value);
    const to = Number(select("attendance-to").value);
    const total = attendanceSummary(record.current).total;
    record.current = exchangeAttendance(record.current, from, to);
    changed();
    message(
      `Replaced one attendee from ${LETTERS[from]} with one from ${LETTERS[to]}. The total stays ${total}; no person's letter group changed.`,
    );
  }),
);
select("attendance-population").addEventListener("change", () => {
  const population = Number(select("attendance-population").value);
  record.current = newAttendance(population, Math.min(record.current.quota, population));
  changed();
  message(
    "A new finite population and uneven example are shown. Your kept attendance and explanation remain.",
  );
});
select("attendance-quota").addEventListener("change", () => {
  record.current.quota = Number(select("attendance-quota").value);
  changed();
  message(
    "The per-group request changed. Current attendance did not; the kept comparison retains its own request.",
  );
});
on("attendance-example", () => {
  record.current = newAttendance(record.current.population, record.current.quota);
  changed();
  message(
    "The uneven constructed example is restored. Your kept attendance and explanation remain.",
  );
});
on("attendance-balanced", () => {
  record.current = {
    ...record.current,
    counts: LETTERS.map(() => record.current.quota),
    origin: "constructed",
  };
  changed();
  message(
    `Every group now has exactly ${record.current.quota}. The total is ${attendanceSummary(record.current).total}. This preset constructs a new attendance; it is not a random sample.`,
  );
});
on("attendance-sample", () =>
  attempt(() => {
    const field = input("attendance-sample-size");
    if (!field.value.trim() || !field.validity.valid)
      throw new Error(`Enter a whole sample size from 0 to ${record.current.population * 5}.`);
    record.current = sampleAttendance(record.current, Number(field.value), pick);
    changed(false);
    message(
      `Sampled ${attendanceSummary(record.current).total} distinct potential people without replacement. Every subset of this size is equally likely under the stated modern model.`,
    );
  }),
);
on("attendance-pin", () => {
  record.pinned = structuredClone(record.current);
  changed(false);
  message(
    "Attendance kept with its own population, request, counts and constructed/sampled label.",
  );
});
el("attendance-comparison").addEventListener("click", (event) => {
  const id = (event.target as HTMLElement).closest("button")?.id;
  if (id === "attendance-restore" && record.pinned) {
    record.current = structuredClone(record.pinned);
    changed();
    message("Kept attendance restored; your explanation remains.");
  } else if (id === "attendance-clear") {
    record.pinned = null;
    changed(false);
    message("Comparison cleared; current attendance and explanation remain.");
  }
});
on("attendance-inspect", () => {
  inspected = true;
  render();
  message(
    "Exact chances, the complete curve and weighted patterns are open. These describe an unknown uniform sample of the same total, not uncertainty about the counts already displayed.",
  );
});
on("attendance-worst", () => {
  const state = record.current;
  record.current = {
    ...state,
    counts: [
      state.population,
      state.population,
      state.population,
      state.population,
      state.quota - 1,
    ],
    origin: "constructed",
  };
  changed();
  message(
    `A failure at total ${attendanceSummary(record.current).total}, one below the guarantee. Group E is one short. Add one attendee to E to reach the bound.`,
  );
});
on("attendance-pattern-prev", () => {
  patternPage--;
  render();
});
on("attendance-pattern-next", () => {
  patternPage++;
  render();
});
el("attendance-pattern-table").addEventListener("click", (event) => {
  const index = (event.target as HTMLElement).closest<HTMLButtonElement>("button[data-pattern]")
    ?.dataset.pattern;
  if (index === undefined) return;
  const pattern = attendancePatterns(record.current)[Number(index)];
  if (!pattern) return;
  record.current = { ...record.current, counts: [...pattern.counts], origin: "constructed" };
  changed(false);
  message(
    `Constructed pattern ${pattern.counts.join("–")} at the same total. Its weight is ${count(pattern.weight)} distinct individual subsets.`,
  );
});
el<HTMLTextAreaElement>("attendance-note").addEventListener("input", () => {
  record.note = el<HTMLTextAreaElement>("attendance-note").value;
  revision++;
});
on("attendance-save-json", () => {
  saveAllotmentFile("psephos-attendance.json", JSON.stringify(record, null, 2), "application/json");
  el("attendance-file-status").textContent =
    "Editable attendance saved with its comparison and explanation.";
});
on("attendance-save-svg", () => {
  saveAllotmentFile("psephos-attendance.svg", attendanceSvg(record.current), "image/svg+xml");
});
on("attendance-save-csv", () => {
  saveAllotmentFile("psephos-attendance.csv", attendanceCsv(record), "text/csv;charset=utf-8");
});
on("attendance-save-html", () => {
  if (exportController) return;
  const snapshot = structuredClone(record);
  const started = revision;
  const controller = new AbortController();
  exportController = controller;
  button("attendance-save-html").disabled = true;
  button("attendance-cancel").hidden = false;
  el("attendance-file-status").textContent =
    "Checking source pages, fonts and licenses for the attendance reading…";
  void attendanceReading(snapshot, controller.signal)
    .then((html) => {
      controller.signal.throwIfAborted();
      saveAllotmentFile("psephos-attendance-reading.html", html, "text/html;charset=utf-8");
      el("attendance-file-status").textContent =
        started === revision
          ? "Illustrated attendance reading saved with all verified source assets."
          : "Reading saved from the attendance when saving began. Later edits remain here; save again to include them.";
    })
    .catch((error) => {
      el("attendance-file-status").textContent = controller.signal.aborted
        ? "Reading cancelled; your attendance remains."
        : `${error instanceof Error ? error.message : "The reading could not be saved."} Your attendance remains; reconnect and try again.`;
    })
    .finally(() => {
      if (exportController !== controller) return;
      exportController = null;
      button("attendance-save-html").disabled = false;
      button("attendance-cancel").hidden = true;
    });
});
on("attendance-cancel", () => {
  exportController?.abort();
});
on("attendance-copy", () => {
  const link = new URL(location.href);
  link.hash = attendanceLink(record);
  const fallback = () => {
    el("attendance-link").hidden = false;
    el("attendance-link-label").hidden = false;
    el<HTMLTextAreaElement>("attendance-link").value = link.href;
    el<HTMLTextAreaElement>("attendance-link").select();
    el("attendance-file-status").textContent =
      "Copy the attendance link below. Your explanation is excluded.";
  };
  if (!navigator.clipboard) fallback();
  else
    void navigator.clipboard
      .writeText(link.href)
      .then(() => {
        el("attendance-file-status").textContent =
          "Attendance link copied with both boards. Your explanation is excluded.";
      })
      .catch(fallback);
});
el<HTMLInputElement>("attendance-open").addEventListener("change", async () => {
  const control = input("attendance-open");
  const file = control.files?.[0];
  if (!file) return;
  const started = revision;
  const request = ++importRequest;
  try {
    if (file.size > 40_000) throw new Error("This file is too large for an attendance study.");
    const parsed = parseAttendanceRecord(await file.text());
    if (request !== importRequest) return;
    if (started !== revision)
      throw new Error(
        "Attendance changed while this file was opening. Choose it again to replace the current study.",
      );
    record = parsed;
    el<HTMLTextAreaElement>("attendance-note").value = record.note;
    changed();
    el("attendance-file-status").textContent =
      "Attendance reopened. Exact chances were recomputed; both boards and your explanation were restored.";
  } catch (error) {
    if (request !== importRequest) return;
    el("attendance-file-status").textContent =
      `${error instanceof Error ? error.message : "The file could not be opened."} Your current attendance remains.`;
  } finally {
    if (request === importRequest) control.value = "";
  }
});
installSourceReader("letters");
installOffline(el("offline-status"), "illustrated reading");
