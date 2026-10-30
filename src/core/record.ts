import { type Action, type Ballot, type Preset, replay } from "./model";

export const CITATIONS = ["pair", "urns", "grip", "count", "tie"] as const;
export interface CourtRecord {
  format: "psephos-court-record";
  version: 1;
  preset: Preset;
  actions: Action[];
  observation: { choice: Ballot; covered: boolean } | null;
  note: string;
  citations: string[];
}
export function fresh(preset: Preset = "last-vote"): CourtRecord {
  return {
    format: "psephos-court-record",
    version: 1,
    preset,
    actions: [],
    observation: null,
    note: "",
    citations: [],
  };
}
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Expected a record object.");
  return value as Record<string, unknown>;
}
function keys(value: Record<string, unknown>, allowed: string[]): void {
  if (
    Object.keys(value).some((key) => !allowed.includes(key)) ||
    allowed.some((key) => !(key in value))
  )
    throw new Error("The record has missing or unrecognized fields.");
}
function action(value: unknown): Action {
  const v = object(value);
  const enums: Record<string, [string, readonly string[]]> = {
    issue: ["pair", ["mixed", "two-pierced", "two-solid"]],
    choose: ["ballot", ["pierced", "solid"]],
    count: ["urn", ["bronze", "wood"]],
    intervene: ["kind", ["none", "extra", "replace"]],
  };
  if (v.type === "cast") keys(v, ["type"]);
  else if (v.type === "cover") {
    keys(v, ["type", "covered"]);
    if (typeof v.covered !== "boolean") throw new Error("A grip must be covered or exposed.");
  } else {
    const schema = typeof v.type === "string" ? enums[v.type] : undefined;
    if (!schema) throw new Error("Unrecognized rehearsal action.");
    keys(v, ["type", schema[0]]);
    if (!schema[1].includes(v[schema[0]] as string)) throw new Error("Invalid rehearsal choice.");
  }
  return structuredClone(v) as Action;
}
export function parseRecord(text: string): CourtRecord {
  if (text.length > 100_000)
    throw new Error("This file is too large. A rehearsal record must be under 100 KB.");
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error("This is not a readable JSON court record.");
  }
  const v = object(value);
  keys(v, ["format", "version", "preset", "actions", "observation", "note", "citations"]);
  if (v.format !== "psephos-court-record" || v.version !== 1)
    throw new Error("Choose a Psephos version 1 court record.");
  if (!["last-vote", "wooden-urn", "empty"].includes(v.preset as string))
    throw new Error("Unrecognized starting rehearsal.");
  if (!Array.isArray(v.actions) || v.actions.length > 200)
    throw new Error("A record can hold at most 200 actions. Save and begin another rehearsal.");
  if (typeof v.note !== "string" || v.note.length > 4000)
    throw new Error("The explanation must be at most 4,000 characters.");
  if (
    !Array.isArray(v.citations) ||
    v.citations.length > 5 ||
    new Set(v.citations).size !== v.citations.length ||
    v.citations.some((c) => !CITATIONS.includes(c))
  )
    throw new Error("The source selections are invalid.");
  let observation: CourtRecord["observation"] = null;
  if (v.observation !== null) {
    const p = object(v.observation);
    keys(p, ["choice", "covered"]);
    if (!["pierced", "solid"].includes(p.choice as string) || typeof p.covered !== "boolean")
      throw new Error("The pinned observation is invalid.");
    observation = { choice: p.choice as Ballot, covered: p.covered };
  }
  const record: CourtRecord = {
    format: "psephos-court-record",
    version: 1,
    preset: v.preset as Preset,
    actions: v.actions.map(action),
    observation,
    note: v.note,
    citations: v.citations as string[],
  };
  replay(record.preset, record.actions);
  return record;
}
export function serialize(record: CourtRecord): string {
  return `${JSON.stringify(parseRecord(JSON.stringify(record)), null, 2)}\n`;
}
export function recordLink(record: CourtRecord, href: string): string {
  const url = new URL(href);
  url.search = "";
  url.hash = `record=${encodeURIComponent(JSON.stringify(parseRecord(JSON.stringify(record))))}`;
  return url.href;
}
export function fromLink(hash: string): CourtRecord | null {
  if (!hash.startsWith("#record=")) return null;
  try {
    return parseRecord(decodeURIComponent(hash.slice(8)));
  } catch {
    throw new Error(
      "The shared rehearsal is incomplete or invalid. Your current work has been kept.",
    );
  }
}
