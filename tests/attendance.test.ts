import assert from "node:assert/strict";
import test from "node:test";
import {
  attendanceChance,
  attendanceCurve,
  attendanceFromLink,
  attendanceLink,
  attendancePatterns,
  attendanceSummary,
  changeAttendance,
  choose,
  exchangeAttendance,
  freshAttendance,
  newAttendance,
  parseAttendanceRecord,
  patternWeight,
  sampleAttendance,
} from "../src/core/attendance";

test("ten arrivals need not fill two rows, but three exchanges keep ten and close the gaps", () => {
  let current = newAttendance();
  assert.equal(attendanceSummary(current).total, 10);
  assert.equal(attendanceSummary(current).fullRows, 0);
  assert.equal(attendanceSummary(current).shortGroups, 2);
  current = exchangeAttendance(current, 0, 4);
  current = exchangeAttendance(current, 0, 4);
  current = exchangeAttendance(current, 1, 3);
  assert.deepEqual(current.counts, [2, 2, 2, 2, 2]);
  assert.equal(attendanceSummary(current).total, 10);
  assert.equal(attendanceSummary(current).meets, true);
});
test("the exact subset count differs sharply from equally likely count patterns", () => {
  const current = newAttendance();
  const p = attendanceChance(current);
  assert.equal(p.favourable, 6 ** 5);
  assert.equal(p.possible, 184756);
  assert.deepEqual(p.probability, { numerator: 1944, denominator: 46189 });
  assert.equal(patternWeight(current), 96);
  const patterns = attendancePatterns(current);
  assert.equal(patterns.length, 381);
  assert.equal(
    patterns.reduce((n, pattern) => n + pattern.weight, 0),
    p.possible,
  );
  assert.equal(
    patterns.filter((pattern) => pattern.meets).reduce((n, pattern) => n + pattern.weight, 0),
    p.favourable,
  );
});
test("the worst-case attendance threshold is necessary and sufficient in every allowed setup", () => {
  for (const population of [4, 6, 8])
    for (let quota = 1; quota <= population; quota++) {
      const state = newAttendance(population, quota);
      const threshold = attendanceSummary(state).guaranteedTotal;
      const curve = attendanceCurve(population, quota);
      assert.equal(curve[threshold]?.favourable, curve[threshold]?.possible);
      assert.notEqual(curve[threshold - 1]?.favourable, curve[threshold - 1]?.possible);
      assert.equal(curve[5 * quota - 1]?.favourable, 0);
      assert.equal(curve[5 * quota]?.favourable, choose(population, quota) ** 5);
    }
});
test("sampling uses distinct members of the finite population; manual edits change its origin", () => {
  const sampled = sampleAttendance(newAttendance(), 4, () => 0);
  assert.deepEqual(sampled.counts, [4, 0, 0, 0, 0]);
  assert.equal(sampled.origin, "sampled");
  assert.equal(changeAttendance(sampled, 1, 1).origin, "constructed");
  assert.throws(() => changeAttendance(sampled, 0, 1), /population/);
  assert.throws(() => exchangeAttendance(sampled, 0, 0), /different/);
  assert.deepEqual(sampleAttendance(newAttendance(), 20, () => 0).counts, [4, 4, 4, 4, 4]);
});
test("attendance files restore both boards; explicit links omit the explanation", () => {
  const record = freshAttendance();
  record.pinned = structuredClone(record.current);
  record.current.counts = [2, 2, 2, 2, 2];
  record.note = "The total alone <does not> settle the groups.";
  assert.deepEqual(parseAttendanceRecord(JSON.stringify(record)), record);
  const linked = attendanceFromLink(attendanceLink(record));
  assert.equal(linked?.note, "");
  assert.deepEqual(linked?.pinned, record.pinned);
  assert.equal(attendanceFromLink("#reader"), null);
  assert.throws(() => attendanceFromLink("#attendance=%"), /encoding/);
  record.current.counts[0] = 5;
  assert.throws(() => parseAttendanceRecord(JSON.stringify(record)), /population/);
});
