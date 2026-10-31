"""Independently render the cited PDF pages and compare every retained pixel file."""
import argparse
import hashlib
import json
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser()
parser.add_argument("--pdf", required=True, type=Path, help="Independently downloaded Kenyon PDF")
args = parser.parse_args()
provenance = json.loads((ROOT / "public/sources/allotment-provenance.json").read_text())
actual = hashlib.sha256(args.pdf.read_bytes()).hexdigest()
if actual != provenance["pdf"]["sha256"]:
    raise SystemExit("The PDF differs from the reviewed primary artifact.")
receipt = {"pdfSha256": actual, "pages": []}
with tempfile.TemporaryDirectory() as temporary:
    prefix = Path(temporary) / "page"
    subprocess.run(["pdftoppm", "-f", "76", "-l", "78", "-scale-to", "2100", "-jpeg", "-jpegopt", "quality=90", str(args.pdf), str(prefix)], check=True)
    for page in provenance["pages"]:
        rendered = Path(f"{prefix}-{page['pdfPage']}.jpg").read_bytes()
        retained = (ROOT / "public" / page["path"]).read_bytes()
        if rendered != retained:
            raise SystemExit(f"Rendered bytes differ: {page['path']}. Check the Poppler/JPEG version before attributing a source mismatch.")
        receipt["pages"].append({"path": page["path"], "sha256": hashlib.sha256(retained).hexdigest(), "bytes": len(retained), "pdfPage": page["pdfPage"], "printedHeading": page["printedHeading"], "renderMatches": True})
print(json.dumps(receipt, indent=2))
