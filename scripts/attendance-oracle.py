"""Independent finite-population oracle: enumerate count vectors, not app polynomials."""
import argparse
import csv
import itertools
import json
import math
from fractions import Fraction
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument("receipt", type=Path)
parser.add_argument("--csv", type=Path)
args = parser.parse_args()
cases = json.loads(args.receipt.read_text())
assert len(cases) == 36, len(cases)
checked = 0
for case in cases:
    m, q = case["population"], case["quota"]
    numerator = [0] * (5 * m + 1)
    denominator = [0] * (5 * m + 1)
    for counts in itertools.product(range(m + 1), repeat=5):
        weight = math.prod(math.comb(m, n) for n in counts)
        total = sum(counts)
        denominator[total] += weight
        if min(counts) >= q:
            numerator[total] += weight
    assert len(case["points"]) == 5 * m + 1
    for n, row in enumerate(case["points"]):
        expected_denominator = math.comb(5 * m, n)
        assert denominator[n] == expected_denominator
        probability = Fraction(numerator[n], expected_denominator)
        expected = [str(n), str(numerator[n]), str(expected_denominator), f"{probability.numerator}/{probability.denominator}"]
        assert row == expected, (case["browser"], m, q, n, row, expected)
        checked += 1
    bound = 4 * m + q
    assert numerator[bound] == denominator[bound]
    assert numerator[bound - 1] < denominator[bound - 1]
if args.csv:
    rows = list(csv.DictReader(args.csv.open(newline="")))
    for label in ["current", "kept"]:
        board = [r for r in rows if r["board"] == label]
        setup = next(r for r in board if r["kind"] == "displayed counts")
        m = int(setup["detail"].split()[0])
        q = int(setup["detail"].split("; ")[1].split()[0])
        total = int(setup["total"])
        patterns = [r for r in board if r["kind"] == "count pattern"]
        expected = {counts for counts in itertools.product(range(m + 1), repeat=5) if sum(counts) == total}
        actual = {tuple(int(r[k]) for k in ["A", "B", "C", "D", "E"]) for r in patterns}
        assert actual == expected
        assert len(actual) == len(patterns)
        for r in patterns:
            counts = tuple(int(r[k]) for k in ["A", "B", "C", "D", "E"])
            assert int(r["favourable_or_weight"]) == math.prod(math.comb(m, n) for n in counts)
            assert (r["meets_request"] == "true") == (min(counts) >= q)
        assert sum(int(r["favourable_or_weight"]) for r in patterns) == math.comb(5 * m, total)
print(json.dumps({"configurations": len(cases), "exactCurvePoints": checked, "method": "Independent itertools.product enumeration of all five-group count vectors with math.comb weights and Fraction", "csvPatternsChecked": bool(args.csv), "passed": True}, indent=2))
