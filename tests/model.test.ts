import assert from "node:assert/strict";
import { test } from "node:test";
import {
  type Action,
  type Ballot,
  contents,
  initial,
  observer,
  PANEL,
  replay,
  step,
  tally,
} from "../src/core/model";
import { fresh, fromLink, parseRecord, recordLink, serialize } from "../src/core/record";
import { observerSvg, verdict } from "../src/drawing";

const finish: Action[] = [
  { type: "issue", pair: "mixed" },
  { type: "cast" },
  { type: "count", urn: "bronze" },
];

test("source-concordance verdict table: majority and equality, only within completed bronze counts", () => {
  // Hand-transcribed from the last sentence of Ath. Pol. 69.1.
  const cases: [number, number, string][] = [
    [0, 10, "defendant"],
    [4, 6, "defendant"],
    [5, 5, "defendant"],
    [6, 4, "prosecutor"],
    [10, 0, "prosecutor"],
  ];
  for (const [p, s, winner] of cases)
    assert.equal(
      tally([...Array<Ballot>(p).fill("pierced"), ...Array<Ballot>(s).fill("solid")]).winner,
      winner,
    );
  const court = replay("last-vote", finish).court;
  assert.equal(verdict(court).title, "Equal votes. The defendant wins.");
  assert.equal(step(initial("last-vote"), { type: "count", urn: "bronze" }).accepted, false);
  const wood = step(court, { type: "count", urn: "wood" }).court;
  assert.equal(verdict(wood).title, "The unused urn cannot decide.");
});

test("68.2: faulty pairs and missing issue cannot produce a vote", () => {
  for (const pair of ["two-pierced", "two-solid"] as const) {
    const s = step(initial("last-vote"), { type: "issue", pair });
    assert.equal(s.accepted, false);
    assert.equal(s.court.issued, false);
  }
  const noPair = step(initial("last-vote"), { type: "cast" });
  assert.equal(noPair.accepted, false);
  assert.equal(noPair.court.votes.length, 9);
  const complete = replay("last-vote", finish).court;
  assert.equal(step(complete, { type: "cast" }).accepted, false);
  assert.equal(step(complete, { type: "issue", pair: "mixed" }).accepted, false);
});

test("every ten-vote assignment conserves both ballots, reverses the urn split, and obeys the strict majority rule", () => {
  for (let mask = 0; mask < 1 << PANEL; mask++) {
    const votes: Ballot[] = Array.from({ length: PANEL }, (_, i) =>
      mask & (1 << i) ? "pierced" : "solid",
    );
    const court = { ...initial("empty"), votes };
    const b = tally(contents(court, "bronze")),
      w = tally(contents(court, "wood"));
    const independentlyCounted = votes.reduce((n, v) => n + Number(v === "pierced"), 0);
    assert.equal(b.pierced, independentlyCounted);
    assert.equal(w.pierced, PANEL - independentlyCounted);
    assert.equal(b.pierced + w.pierced, PANEL);
    assert.equal(b.solid + w.solid, PANEL);
    assert.equal(b.winner, independentlyCounted >= 6 ? "prosecutor" : "defendant");
    assert.equal(b.tied, independentlyCounted === 5);
  }
});

test("the covered observer view is identical for either private choice; exposure distinguishes them", () => {
  assert.equal(observer(true, "pierced"), observer(true, "solid"));
  assert.equal(observerSvg(true, "pierced"), observerSvg(true, "solid"));
  assert.notEqual(observerSvg(false, "pierced"), observerSvg(false, "solid"));
});

test("an extra ballot breaks the total, a replacement can reverse the tie without breaking it", () => {
  const original = replay("last-vote", finish).court;
  const extra = step(original, { type: "intervene", kind: "extra" }).court;
  const replaced = step(original, { type: "intervene", kind: "replace" }).court;
  assert.equal(contents(extra, "bronze").length, 11);
  assert.match(verdict(extra).title, /extra ballot/);
  assert.deepEqual(tally(contents(replaced, "bronze")), {
    pierced: 6,
    solid: 4,
    winner: "prosecutor",
    tied: false,
  });
  assert.equal(contents(replaced, "bronze").length, 10);
  assert.deepEqual(contents(original, "bronze"), contents(extra, "bronze", "none"));
  assert.deepEqual(contents(replaced, "wood"), contents(original, "wood"));
});

test("editable records and links round-trip facts, rejected attempts, notes, source selections and pinned observations", () => {
  const r = {
    ...fresh(),
    actions: [{ type: "issue", pair: "two-pierced" } as Action, ...finish],
    note: "ἂν δὲ ἴσαι & <my note> 💡",
    citations: ["pair", "tie"],
    observation: { covered: true, choice: "pierced" as const },
  };
  assert.deepEqual(parseRecord(serialize(r)), r);
  assert.deepEqual(
    fromLink(new URL(recordLink(r, "https://example.com/psephos/?old=1#reader")).hash),
    r,
  );
  assert.equal(new URL(recordLink(r, "https://example.com/psephos/?old=1")).search, "");
  assert.equal(replay(r.preset, r.actions).steps[0]?.accepted, false);
});

test("imports reject malformed actions, invented outcomes, oversized notes and unrecognized source selections", () => {
  const bad: unknown[] = [
    null,
    [],
    {},
    { ...fresh(), version: 2 },
    { ...fresh(), winner: "defendant" },
    { ...fresh(), actions: [{ type: "cast", winner: "prosecutor" }] },
    { ...fresh(), actions: [{ type: "choose", ballot: "abstain" }] },
    { ...fresh(), actions: [{ type: "cover", covered: "false" }] },
    { ...fresh(), observation: { choice: "pierced", covered: 0 } },
    { ...fresh(), note: "a".repeat(4001) },
    { ...fresh(), citations: ["invented"] },
    { ...fresh(), citations: ["tie", "tie"] },
    { ...fresh(), actions: Array(201).fill({ type: "cast" }) },
  ];
  for (const value of bad) assert.throws(() => parseRecord(JSON.stringify(value)));
  assert.throws(() => parseRecord("{"));
  assert.throws(() => fromLink("#record=%ZZ"));
});
