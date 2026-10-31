import { type Fraction, fraction, LETTERS } from "./allotment";

export interface Attendance {
  population: number;
  quota: number;
  counts: number[];
  origin: "constructed" | "sampled";
}
export interface AttendanceRecord {
  format: "psephos-attendance";
  version: 1;
  current: Attendance;
  pinned: Attendance | null;
  note: string;
}
export interface AttendancePattern {
  counts: number[];
  weight: number;
  meets: boolean;
}
export interface AttendanceChance {
  total: number;
  favourable: number;
  possible: number;
  probability: Fraction;
}
function setup(population: number, quota: number): void {
  if (
    ![4, 6, 8].includes(population) ||
    !Number.isInteger(quota) ||
    quota < 1 ||
    quota > population
  )
    throw new Error(
      "Choose 4, 6 or 8 possible attendees per group and a quota from 1 to that group size.",
    );
}
export function newAttendance(population = 4, quota = 2): Attendance {
  setup(population, quota);
  return {
    population,
    quota,
    counts: [population, population - 1, Math.floor(population / 2), 1, 0],
    origin: "constructed",
  };
}
export function freshAttendance(): AttendanceRecord {
  return {
    format: "psephos-attendance",
    version: 1,
    current: newAttendance(),
    pinned: null,
    note: "",
  };
}
export function choose(n: number, k: number): number {
  if (!Number.isInteger(n) || n < 0 || n > 40 || !Number.isInteger(k))
    throw new Error("The exact count is limited to forty distinct people.");
  if (k < 0 || k > n) return 0;
  let value = 1n;
  const smaller = Math.min(k, n - k);
  for (let i = 1; i <= smaller; i++) value = (value * BigInt(n - smaller + i)) / BigInt(i);
  // The largest count, choose(40,20), is below Number.MAX_SAFE_INTEGER.
  return Number(value);
}
export function attendanceSummary(state: Attendance) {
  const total = state.counts.reduce((sum, count) => sum + count, 0);
  const fullRows = Math.min(...state.counts);
  const shortages = state.counts.map((count) => Math.max(0, state.quota - count));
  return {
    total,
    needed: LETTERS.length * state.quota,
    fullRows,
    fullPlaces: LETTERS.length * fullRows,
    meets: fullRows >= state.quota,
    shortages,
    shortGroups: shortages.filter((n) => n > 0).length,
    replacementMinimum: shortages.reduce((a, b) => a + b, 0),
    guaranteedTotal: (LETTERS.length - 1) * state.population + state.quota,
  };
}
export function changeAttendance(state: Attendance, group: number, difference: number): Attendance {
  if (
    !Number.isInteger(group) ||
    group < 0 ||
    group >= LETTERS.length ||
    ![-1, 1].includes(difference)
  )
    throw new Error("Choose one group and add or remove one attendee.");
  const count = state.counts[group] as number;
  if (count + difference < 0 || count + difference > state.population)
    throw new Error("That group is already empty or at its stated population.");
  const counts = [...state.counts];
  counts[group] = count + difference;
  return { ...state, counts, origin: "constructed" };
}
export function exchangeAttendance(state: Attendance, from: number, to: number): Attendance {
  if (from === to) throw new Error("Choose two different groups. No person's letter changes.");
  const removed = changeAttendance(state, from, -1);
  return changeAttendance(removed, to, 1);
}
export function sampleAttendance(
  state: Attendance,
  total: number,
  pick: (size: number) => number,
): Attendance {
  const maximum = LETTERS.length * state.population;
  if (!Number.isInteger(total) || total < 0 || total > maximum)
    throw new Error(`Sample a whole number from 0 to ${maximum}.`);
  const available = Array.from({ length: maximum }, (_, i) => i);
  const counts = LETTERS.map(() => 0);
  for (let i = 0; i < total; i++) {
    const index = pick(available.length);
    if (!Number.isInteger(index) || index < 0 || index >= available.length)
      throw new Error("Invalid random choice. The current attendance remains.");
    const [identity] = available.splice(index, 1);
    const group = Math.floor((identity as number) / state.population);
    counts[group] = (counts[group] as number) + 1;
  }
  return { ...state, counts, origin: "sampled" };
}
const curves = new Map<string, AttendanceChance[]>();
export function attendanceCurve(population: number, quota: number): AttendanceChance[] {
  setup(population, quota);
  const key = `${population}:${quota}`;
  const cached = curves.get(key);
  if (cached) return structuredClone(cached);
  let coefficients = [1];
  for (const _letter of LETTERS) {
    const next = Array<number>(coefficients.length + population).fill(0);
    for (let n = 0; n < coefficients.length; n++) {
      const previous = coefficients[n] as number;
      for (let k = quota; k <= population; k++)
        next[n + k] = (next[n + k] as number) + previous * choose(population, k);
    }
    coefficients = next;
  }
  const curve = coefficients.map((favourable, total) => {
    const possible = choose(LETTERS.length * population, total);
    return { total, favourable, possible, probability: fraction(favourable, possible) };
  });
  curves.set(key, curve);
  return structuredClone(curve);
}
export function attendanceChance(state: Attendance): AttendanceChance {
  return attendanceCurve(state.population, state.quota)[
    attendanceSummary(state).total
  ] as AttendanceChance;
}
export function patternWeight(state: Attendance): number {
  return state.counts.reduce((weight, count) => weight * choose(state.population, count), 1);
}
export function attendancePatterns(state: Attendance): AttendancePattern[] {
  const total = attendanceSummary(state).total;
  const result: AttendancePattern[] = [];
  function visit(counts: number[], remaining: number, weight: number): void {
    const left = LETTERS.length - counts.length;
    if (remaining < 0 || remaining > left * state.population) return;
    if (!left) {
      result.push({ counts, weight, meets: counts.every((count) => count >= state.quota) });
      return;
    }
    for (let count = 0; count <= state.population; count++)
      visit([...counts, count], remaining - count, weight * choose(state.population, count));
  }
  visit([], total, 1);
  return result;
}
function parseAttendance(value: unknown): Attendance {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("An attendance board is missing.");
  const v = value as Record<string, unknown>;
  if (typeof v.population !== "number" || typeof v.quota !== "number")
    throw new Error("The population and quota must be whole numbers.");
  setup(v.population, v.quota);
  if (
    !Array.isArray(v.counts) ||
    v.counts.length !== LETTERS.length ||
    !v.counts.every(
      (count) =>
        typeof count === "number" &&
        Number.isInteger(count) &&
        count >= 0 &&
        count <= (v.population as number),
    )
  )
    throw new Error(
      "Every one of the five groups needs an attendance count within its stated population.",
    );
  if (v.origin !== "constructed" && v.origin !== "sampled")
    throw new Error("Say whether this attendance was constructed or sampled.");
  return { population: v.population, quota: v.quota, counts: [...v.counts], origin: v.origin };
}
export function parseAttendanceRecord(text: string): AttendanceRecord {
  if (text.length > 40_000) throw new Error("This file is too large for an attendance study.");
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error("Choose a readable Psephos attendance JSON file.");
  }
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("The attendance study is missing.");
  const v = value as Record<string, unknown>;
  if (v.format !== "psephos-attendance" || v.version !== 1)
    throw new Error("Choose a Psephos attendance study, version 1.");
  if (typeof v.note !== "string" || v.note.length > 5000)
    throw new Error("The explanation must be at most 5,000 characters.");
  return {
    format: "psephos-attendance",
    version: 1,
    current: parseAttendance(v.current),
    pinned: v.pinned === null ? null : parseAttendance(v.pinned),
    note: v.note,
  };
}
export function attendanceLink(record: AttendanceRecord): string {
  return `#attendance=${encodeURIComponent(JSON.stringify({ ...record, note: "" }))}`;
}
export function attendanceFromLink(hash: string): AttendanceRecord | null {
  if (!hash.startsWith("#attendance=")) return null;
  if (hash.length > 30_000) throw new Error("This attendance link is too long.");
  try {
    return parseAttendanceRecord(decodeURIComponent(hash.slice(12)));
  } catch (error) {
    if (error instanceof URIError) throw new Error("The attendance link has a damaged encoding.");
    throw error;
  }
}
