"""Build a deterministic installable theme ZIP. No runtime or source PDFs included."""
from pathlib import Path
import argparse, hashlib, json, zipfile

parser = argparse.ArgumentParser()
parser.add_argument('output', type=Path)
args = parser.parse_args()
root = Path(__file__).resolve().parents[1] / 'lets-play'
args.output.parent.mkdir(parents=True, exist_ok=True)
files = sorted(p for p in root.rglob('*') if p.is_file())
with zipfile.ZipFile(args.output, 'x', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    for file in files:
        entry = zipfile.ZipInfo('lets-play/'+file.relative_to(root).as_posix(), (2026, 11, 25, 0, 0, 0))
        entry.compress_type = zipfile.ZIP_DEFLATED
        entry.external_attr = 0o100644 << 16
        archive.writestr(entry, file.read_bytes(), compresslevel=9)
print(json.dumps({'files':len(files),'bytes':args.output.stat().st_size,'sha256':hashlib.sha256(args.output.read_bytes()).hexdigest()}))
