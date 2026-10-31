"""Check rendered UI output against independent exact sampling formulas."""
import argparse
import itertools
import json
import math
from fractions import Fraction
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument("receipt", type=Path)
args = parser.parse_args()
cases = json.loads(args.receipt.read_text())
assert len(cases) == 60, f"Expected all 15 row/quota pairs, two relations, two engines; got {len(cases)}"
seen = set()
orders_checked = 0
for case in cases:
    rows, whites = case["rows"], case["whites"]
    p = Fraction(whites, rows)
    joint = p if case["sameRow"] else Fraction(whites * (whites - 1), rows * (rows - 1))
    conditional = joint / p
    expected = [f"{f.numerator}/{f.denominator}" for f in (p, p, joint, conditional)]
    assert case["chances"] == expected, (case, expected)
    # Same-row cases use different columns (A1/B1); different-row cases use A1/A2.
    unknown_joint = p * p if case["sameRow"] else joint
    unknown_expected = [f"{f.numerator}/{f.denominator}" for f in (p, p, unknown_joint, unknown_joint / p)]
    assert case["beforePlacement"] == unknown_expected, (case, unknown_expected)
    orders = {"".join("W" if i in chosen else "B" for i in range(rows)) for chosen in itertools.combinations(range(rows), whites)}
    assert len(case["orders"]) == math.comb(rows, whites)
    assert set(case["orders"]) == orders
    assert len(set(case["orders"])) == len(case["orders"]), "Duplicate order in rendered controls"
    seen.add((case["browser"], rows, whites, case["sameRow"]))
    orders_checked += len(orders)
assert len(seen) == 60
print(json.dumps({"cases": len(cases), "uniqueSetups": len(seen), "renderedColourOrders": orders_checked, "independentMethod": "fractions.Fraction closed forms and itertools.combinations; no application import", "passed": True}, indent=2))
