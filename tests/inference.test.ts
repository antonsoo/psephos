import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { inferVote, type KnownVote } from "../src/core/inference";
import { initial, replay, tally } from "../src/core/model";
import { fresh, fromLink, parseRecord, serialize } from "../src/core/record";
import { inferenceReport } from "../src/inference-view";

test("a split count permits both target choices; unanimity can identify every vote without extra knowledge", () => {
  const split = inferVote(5, 9, []);
  assert.deepEqual([split.total, split.pierced, split.solid], [252, 126, 126]);
  assert.deepEqual([inferVote(0, 9, []).total, inferVote(0, 9, []).solid], [1, 1]);
  assert.deepEqual([inferVote(10, 0, []).total, inferVote(10, 0, []).pierced], [1, 1]);
  assert.notDeepEqual(split.piercedWitness, split.solidWitness);
  assert.equal(tally(split.piercedWitness ?? []).pierced, 5);
  assert.equal(tally(split.solidWitness ?? []).pierced, 5);
});

test("enumeration agrees with independent factorial counts for every tally and distribution of known other choices", () => {
  const factorial = [1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880, 3628800];
  const choose = (n: number, k: number): number =>
    k < 0 || k > n ? 0 : (factorial[n] ?? 0) / ((factorial[k] ?? 1) * (factorial[n - k] ?? 1));
  for (const target of [0, 9])
    for (let p = 0; p <= 10; p++)
      for (let k = 0; k <= 9; k++)
        for (let kp = 0; kp <= k; kp++) {
          const ids = Array.from({ length: 10 }, (_, i) => i)
            .filter((i) => i !== target)
            .slice(0, k);
          const known: KnownVote[] = ids.map((juror, i) => ({
            juror,
            ballot: i < kp ? "pierced" : "solid",
          }));
          const result = inferVote(p, target, known);
          assert.equal(result.total, choose(10 - k, p - kp));
          assert.equal(result.pierced, choose(9 - k, p - kp - 1));
          assert.equal(result.solid, choose(9 - k, p - kp));
          for (const [kind, witness] of [
            ["pierced", result.piercedWitness],
            ["solid", result.solidWitness],
          ] as const) {
            if (!witness) continue;
            assert.equal(witness.length, 10);
            assert.equal(witness[target], kind);
            assert.equal(witness.filter((v) => v === "pierced").length, p);
            for (const fact of known) assert.equal(witness[fact.juror], fact.ballot);
          }
        }
});

test("fewer than nine other choices can force the target; inconsistent assumptions are distinguished", () => {
  const fivePierced: KnownVote[] = Array.from({ length: 5 }, (_, juror) => ({
    juror,
    ballot: "pierced",
  }));
  const forced = inferVote(5, 9, fivePierced);
  assert.deepEqual([forced.total, forced.pierced, forced.solid], [1, 0, 1]);
  const fewer = inferVote(5, 9, fivePierced.slice(0, 4));
  assert.ok(fewer.pierced > 0 && fewer.solid > 0);
  assert.equal(inferVote(0, 9, [{ juror: 0, ballot: "pierced" }]).total, 0);
  assert.throws(() => inferVote(11, 9, []));
  assert.throws(() => inferVote(5, 10, []));
  assert.throws(() =>
    inferVote(5, 9, [
      { juror: 1, ballot: "solid" },
      { juror: 1, ballot: "pierced" },
    ]),
  );
});

test("the inference view requires a complete, original bronze count and does not infer from altered evidence", () => {
  const knowledge = { target: 9, known: [], inspected: true };
  assert.match(inferenceReport(initial("last-vote"), knowledge), /original bronze count is needed/);
  const { court } = replay("last-vote", [
    { type: "issue", pair: "mixed" },
    { type: "cast" },
    { type: "count", urn: "bronze" },
  ]);
  assert.match(inferenceReport(court, knowledge), /252 arrangements/);
  assert.doesNotMatch(
    inferenceReport({ ...court, counted: "wood" }, knowledge),
    /252 arrangements/,
  );
  assert.doesNotMatch(
    inferenceReport({ ...court, intervention: "replace" }, knowledge),
    /252 arrangements/,
  );
});

test("a real version 1 download migrates its facts without inventing observer knowledge", () => {
  const old = JSON.parse(
    readFileSync(new URL("./fixtures/court-v1.json", import.meta.url), "utf8"),
  );
  assert.equal(old.version, 1);
  const next = parseRecord(JSON.stringify(old));
  assert.equal(next.version, 2);
  for (const key of ["preset", "actions", "observation", "note", "citations"] as const)
    assert.deepEqual(next[key], old[key]);
  assert.deepEqual(next.knowledge, { target: 9, known: [], inspected: false });
  assert.deepEqual(parseRecord(serialize(next)), next);
  assert.deepEqual(fromLink(`#record=${encodeURIComponent(JSON.stringify(old))}`), next);
});

test("saved knowledge is canonical, bounded and distinct from the target's own private choice", () => {
  const r = { ...fresh(), knowledge: { target: 9, known: [4, 1], inspected: true } };
  assert.deepEqual(parseRecord(JSON.stringify(r)).knowledge, {
    target: 9,
    known: [1, 4],
    inspected: true,
  });
  for (const knowledge of [
    { target: 10, known: [], inspected: false },
    { target: 9, known: [9], inspected: true },
    { target: 9, known: [1, 1], inspected: true },
    { target: 9, known: [11], inspected: true },
    { target: 9, known: [], inspected: "false" },
  ])
    assert.throws(() => parseRecord(JSON.stringify({ ...fresh(), knowledge })));
  for (const kind of ["__proto__", "constructor", "toString"])
    assert.throws(
      () => parseRecord(JSON.stringify({ ...fresh(), actions: [{ type: kind }] })),
      /Unrecognized rehearsal action/,
    );
});
