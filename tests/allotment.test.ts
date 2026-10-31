import assert from "node:assert/strict";
import test from "node:test";
import {
  allOrders,
  allotmentFromLink,
  allotmentLink,
  beforePlacement,
  freshAllotment,
  newAllotment,
  parseAllotment,
  probabilities,
  randomIndex,
  ratio,
  releaseCube,
  swapTickets,
  undoCube,
} from "../src/core/allotment";

test("a fixed row couples its five tickets; different rows compete for a fixed quota", () => {
  const study = newAllotment();
  const same = probabilities(study);
  assert.equal(same.orders.length, 6);
  assert.equal(ratio(same.first), "1/2");
  assert.equal(ratio(same.both), "1/2");
  assert.equal(ratio(same.secondGivenFirst), "1/1");
  assert.equal(same.independent, false);
  const moved = swapTickets(study, "B1", "B2");
  const different = probabilities(moved);
  assert.equal(ratio(different.first), "1/2");
  assert.equal(ratio(different.second), "1/2");
  assert.equal(ratio(different.both), "1/6");
  assert.equal(ratio(different.secondGivenFirst), "1/3");
  assert.deepEqual(study.columns[1], [1, 2, 3, 4]);
});
test("a decided row updates the surviving colour orders without resampling it", () => {
  let study = swapTickets(newAllotment(), "B1", "B2");
  study = releaseCube(study, () => 0);
  assert.deepEqual(study.draws, ["W"]);
  assert.equal(ratio(probabilities(study, true).second), "1/3");
  assert.equal(ratio(probabilities(study, true).first), "1/1");
  assert.throws(() => swapTickets(study, "B1", "B2"), /Reset/);
  study = releaseCube(study, () => 0);
  study = releaseCube(study, () => 0);
  study = releaseCube(study, () => 0);
  assert.deepEqual(study.draws, ["W", "W", "B", "B"]);
  assert.throws(() => releaseCube(study, () => 0), /Every row/);
});
test("letters constrain permitted moves", () => {
  assert.throws(() => swapTickets(newAllotment(), "A1", "B2"), /same letter/);
});
test("unbiased range sampling rejects the excess uint32 tail", () => {
  const samples = [0xffffffff, 5];
  let calls = 0;
  assert.equal(
    randomIndex(3, (bytes) => {
      bytes[0] = samples[calls++] as number;
    }),
    2,
  );
  assert.equal(calls, 2);
  assert.throws(() => randomIndex(0, () => {}), /Invalid/);
});
test("all allowed row/quota pairs partition into exact, equally sized row selections", () => {
  for (const rows of [4, 6, 8])
    for (let whites = 1; whites < rows; whites++) {
      const orders = allOrders(rows, whites);
      const factorial = (n: number): number => (n < 2 ? 1 : n * factorial(n - 1));
      assert.equal(orders.length, factorial(rows) / factorial(whites) / factorial(rows - whites));
      for (let row = 0; row < rows; row++) {
        assert.equal(
          orders.filter((order) => order[row] === "W").length * rows,
          orders.length * whites,
        );
        for (const order of orders) assert.equal(order.filter((x) => x === "W").length, whites);
      }
    }
});
test("files and explicit links round-trip, omitting the private explanation from a link", () => {
  const record = freshAllotment();
  record.pinned = structuredClone(record.study);
  record.study = swapTickets(record.study, "B1", "B2");
  record.note = "A fixed placement <is an assumption>.";
  assert.deepEqual(parseAllotment(JSON.stringify(record)), record);
  const shared = allotmentFromLink(allotmentLink(record));
  assert.equal(shared?.note, "");
  assert.deepEqual(shared?.study, record.study);
  assert.deepEqual(shared?.pinned, record.pinned);
  assert.equal(allotmentFromLink("#reader"), null);
});
test("forged supply, duplicate identities and unsupported versions are refused", () => {
  const mutate = (fn: (record: ReturnType<typeof freshAllotment>) => void) => {
    const record = freshAllotment();
    fn(record);
    return JSON.stringify(record);
  };
  assert.throws(
    () =>
      parseAllotment(
        mutate((r) => {
          r.study.draws = ["W", "W", "W"];
        }),
      ),
    /supply/,
  );
  assert.throws(
    () =>
      parseAllotment(
        mutate((r) => {
          r.study.columns[0] = [1, 1, 3, 4];
        }),
      ),
    /once/,
  );
  assert.throws(
    () =>
      parseAllotment(
        mutate((r) => {
          r.study.pair = ["A1", "A1"];
        }),
      ),
    /different/,
  );
  assert.throws(
    () =>
      parseAllotment(
        mutate((r) => {
          r.note = "x".repeat(5001);
        }),
      ),
    /5,000/,
  );
  assert.throws(() => allotmentFromLink("#study=%"), /encoding/);
});

test("averaging independent letter placements changes the probability question", () => {
  const fixed = newAllotment();
  const unknown = beforePlacement(fixed);
  assert.equal(ratio(unknown.both), "1/4");
  assert.equal(unknown.count, 96);
  assert.equal(ratio(probabilities(fixed).both), "1/2");
  fixed.pair = ["A1", "A2"];
  assert.equal(ratio(beforePlacement(fixed).both), "1/6");
  assert.equal(ratio(beforePlacement(fixed).secondGivenFirst), "1/3");
});

test("undoing the entire chosen prefix leaves the next draw genuinely random", () => {
  let study = newAllotment();
  study.draws = ["W", "B", "W", "B"];
  study.drawMode = "chosen";
  study = undoCube(study);
  assert.equal(study.drawMode, "chosen");
  for (let i = 0; i < 3; i++) study = undoCube(study);
  assert.deepEqual(study.draws, []);
  assert.equal(study.drawMode, "random");
  assert.equal(releaseCube(study, () => 0).drawMode, "random");
});
