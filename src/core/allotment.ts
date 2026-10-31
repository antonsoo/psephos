/** A small, fixed-placement row experiment, not the complete Athenian allotment. */
export const LETTERS = ["A", "B", "C", "D", "E"] as const;
export type Cube = "W" | "B";
export interface Allotment {
  rows: number;
  whites: number;
  columns: number[][];
  draws: Cube[];
  drawMode: "random" | "chosen";
  pair: [string, string];
}
export interface AllotmentRecord {
  format: "psephos-allotment";
  version: 1;
  study: Allotment;
  pinned: Allotment | null;
  note: string;
}
export interface Fraction {
  numerator: number;
  denominator: number;
}
export function fraction(numerator: number, denominator: number): Fraction {
  if (denominator === 0) return { numerator: 0, denominator: 0 };
  let a = numerator;
  let b = denominator;
  while (b) [a, b] = [b, a % b];
  return { numerator: numerator / a, denominator: denominator / a };
}
export function ratio(value: Fraction): string {
  return value.denominator === 0 ? "undefined" : `${value.numerator}/${value.denominator}`;
}
export function newAllotment(rows = 4, whites = 2): Allotment {
  if (![4, 6, 8].includes(rows) || !Number.isInteger(whites) || whites < 1 || whites >= rows)
    throw new Error("Choose 4, 6 or 8 rows and at least one cube of each colour.");
  return {
    rows,
    whites,
    columns: LETTERS.map(() => Array.from({ length: rows }, (_, i) => i + 1)),
    draws: [],
    drawMode: "random",
    pair: ["A1", "B1"],
  };
}
export function freshAllotment(): AllotmentRecord {
  return { format: "psephos-allotment", version: 1, study: newAllotment(), pinned: null, note: "" };
}
export function ticketRow(study: Allotment, ticket: string): number {
  const column = LETTERS.indexOf(ticket[0] as (typeof LETTERS)[number]);
  return study.columns[column]?.indexOf(Number(ticket.slice(1))) ?? -1;
}
export function swapTickets(study: Allotment, first: string, second: string): Allotment {
  if (study.draws.length) throw new Error("Reset the draw before moving tickets.");
  if (first[0] !== second[0]) throw new Error("Move tickets within the same letter column.");
  const a = ticketRow(study, first);
  const b = ticketRow(study, second);
  const column = LETTERS.indexOf(first[0] as (typeof LETTERS)[number]);
  if (a < 0 || b < 0) throw new Error("Both tickets must be on this board.");
  const next = structuredClone(study);
  const list = next.columns[column];
  if (list) [list[a], list[b]] = [list[b] as number, list[a] as number];
  return next;
}
/** Uniform integer via rejection; modulo alone biases a non-power-of-two range. */
export function randomIndex(size: number, fill: (bytes: Uint32Array<ArrayBuffer>) => void): number {
  if (!Number.isInteger(size) || size < 1 || size > 40) throw new Error("Invalid draw range.");
  const limit = 2 ** 32 - (2 ** 32 % size);
  const bytes = new Uint32Array(1);
  for (let attempt = 0; attempt < 100; attempt++) {
    fill(bytes);
    const value = bytes[0] as number;
    if (value < limit) return value % size;
  }
  throw new Error("Randomness was unavailable. No cube was released; try again.");
}
export function shuffled(study: Allotment, pick: (size: number) => number): Allotment {
  if (study.draws.length) throw new Error("Reset the draw before moving tickets.");
  const next = structuredClone(study);
  for (const column of next.columns)
    for (let i = column.length - 1; i > 0; i--) {
      const j = pick(i + 1);
      if (!Number.isInteger(j) || j < 0 || j > i) throw new Error("Invalid random choice.");
      [column[i], column[j]] = [column[j] as number, column[i] as number];
    }
  return next;
}
export function releaseCube(study: Allotment, pick: (size: number) => number): Allotment {
  const remaining = study.rows - study.draws.length;
  if (!remaining) throw new Error("Every row has been decided. Reset to draw again.");
  const whiteLeft = study.whites - study.draws.filter((cube) => cube === "W").length;
  const choice = pick(remaining);
  if (!Number.isInteger(choice) || choice < 0 || choice >= remaining)
    throw new Error("Invalid random choice.");
  return { ...structuredClone(study), draws: [...study.draws, choice < whiteLeft ? "W" : "B"] };
}
export function undoCube(study: Allotment): Allotment {
  const draws = study.draws.slice(0, -1);
  return {
    ...structuredClone(study),
    draws,
    drawMode: draws.length ? study.drawMode : "random",
  };
}
/** Colour strings, not distinguishable cubes: each has W! (R-W)! permutations. */
export function allOrders(rows: number, whites: number): Cube[][] {
  const result: Cube[][] = [];
  function visit(prefix: Cube[], remainingWhite: number): void {
    const left = rows - prefix.length;
    if (remainingWhite < 0 || remainingWhite > left) return;
    if (!left) {
      result.push(prefix);
      return;
    }
    visit([...prefix, "W"], remainingWhite - 1);
    visit([...prefix, "B"], remainingWhite);
  }
  visit([], whites);
  return result;
}
export function probabilities(study: Allotment, afterDraws = false) {
  const orders = allOrders(study.rows, study.whites).filter(
    (order) => !afterDraws || study.draws.every((cube, i) => order[i] === cube),
  );
  const [a, b] = study.pair.map((ticket) => ticketRow(study, ticket));
  const first = orders.filter((order) => order[a as number] === "W").length;
  const second = orders.filter((order) => order[b as number] === "W").length;
  const both = orders.filter(
    (order) => order[a as number] === "W" && order[b as number] === "W",
  ).length;
  return {
    orders,
    first: fraction(first, orders.length),
    second: fraction(second, orders.length),
    both: fraction(both, orders.length),
    secondGivenFirst: fraction(both, first),
    independent: both * orders.length === first * second,
  };
}
/** A separate modern experiment: independently uniform placements per column. */
export function beforePlacement(study: Allotment) {
  const sameColumn = study.pair[0][0] === study.pair[1][0];
  const orders = allOrders(study.rows, study.whites);
  let count = 0;
  let first = 0;
  let second = 0;
  let both = 0;
  for (let a = 0; a < study.rows; a++)
    for (let b = 0; b < study.rows; b++) {
      if (sameColumn && a === b) continue;
      for (const order of orders) {
        count++;
        if (order[a] === "W") first++;
        if (order[b] === "W") second++;
        if (order[a] === "W" && order[b] === "W") both++;
      }
    }
  return {
    sameColumn,
    rowPlacements: study.rows * (sameColumn ? study.rows - 1 : study.rows),
    count,
    first: fraction(first, count),
    second: fraction(second, count),
    both: fraction(both, count),
    secondGivenFirst: fraction(both, first),
  };
}
function parseStudy(value: unknown): Allotment {
  if (!value || typeof value !== "object") throw new Error("The board is missing.");
  const v = value as Record<string, unknown>;
  const rows = v.rows;
  const whites = v.whites;
  if (typeof rows !== "number" || typeof whites !== "number")
    throw new Error("The row and cube counts must be numbers.");
  const result = newAllotment(rows, whites);
  if (
    !Array.isArray(v.columns) ||
    v.columns.length !== 5 ||
    !v.columns.every(
      (column: unknown) =>
        Array.isArray(column) &&
        column.length === rows &&
        new Set(column).size === rows &&
        column.every(
          (n: unknown) => typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= rows,
        ),
    )
  )
    throw new Error(
      "Each letter column must contain every ticket once, without gaps or duplicates.",
    );
  if (
    !Array.isArray(v.draws) ||
    v.draws.length > rows ||
    !v.draws.every((cube: unknown) => cube === "W" || cube === "B") ||
    v.draws.filter((cube: unknown) => cube === "W").length > whites ||
    v.draws.filter((cube: unknown) => cube === "B").length > rows - whites
  )
    throw new Error("The released cubes contradict the stated supply.");
  if (v.drawMode !== "random" && v.drawMode !== "chosen")
    throw new Error("The draw must say whether its sequence was random or chosen.");
  if (
    !Array.isArray(v.pair) ||
    v.pair.length !== 2 ||
    v.pair[0] === v.pair[1] ||
    !v.pair.every(
      (ticket: unknown) =>
        typeof ticket === "string" && /^[A-E][1-8]$/.test(ticket) && Number(ticket[1]) <= rows,
    )
  )
    throw new Error("Choose two different tickets that exist on the board.");
  return {
    ...result,
    columns: (v.columns as number[][]).map((column) => [...column]),
    draws: [...v.draws] as Cube[],
    drawMode: v.drawMode as "random" | "chosen",
    pair: [...v.pair] as [string, string],
  };
}
export function parseAllotment(text: string): AllotmentRecord {
  if (text.length > 40_000) throw new Error("This file is too large for an allotment study.");
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error("This is not a readable JSON study. Choose a saved Psephos allotment file.");
  }
  if (!value || typeof value !== "object") throw new Error("The study is missing.");
  const v = value as Record<string, unknown>;
  if (v.format !== "psephos-allotment" || v.version !== 1)
    throw new Error("This is not a supported Psephos allotment study (version 1).");
  if (typeof v.note !== "string" || v.note.length > 5000)
    throw new Error("The explanation must be at most 5,000 characters.");
  return {
    format: "psephos-allotment",
    version: 1,
    study: parseStudy(v.study),
    pinned: v.pinned === null ? null : parseStudy(v.pinned),
    note: v.note,
  };
}
export function allotmentLink(record: AllotmentRecord): string {
  // A link contains the explicit experiment and comparison, but no private note.
  return `#study=${encodeURIComponent(JSON.stringify({ ...record, note: "" }))}`;
}
export function allotmentFromLink(hash: string): AllotmentRecord | null {
  if (!hash.startsWith("#study=")) return null;
  if (hash.length > 30_000) throw new Error("This study link is too long.");
  try {
    return parseAllotment(decodeURIComponent(hash.slice(7)));
  } catch (error) {
    if (error instanceof URIError) throw new Error("This study link has a damaged encoding.");
    throw error;
  }
}
