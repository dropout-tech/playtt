"""Adopt the exact tested loader generator into a local research runtime. No network/deployment."""
from pathlib import Path
import argparse,hashlib,json
p=argparse.ArgumentParser(description=__doc__);p.add_argument('--runtime',type=Path,required=True);p.add_argument('--apply',action='store_true');a=p.parse_args();r=a.runtime.resolve();target=r/'scripts/playtt-prepare-small-heap-loader.mjs';assert target.resolve().is_relative_to(r)
norm=lambda p:p.read_text(encoding='utf-8-sig').encode();sha=lambda b:hashlib.sha256(b).hexdigest();before='4abbc5d814bff5d21ab3da450ed59e251060da527ece8272ab7404d67d61a493';after='1932f63ff7d7b9196d6f7d60ecdfbc2874b8a6ee476f734e3c9a1d2afc74437a'
assert sha(norm(target))==before,'Expected historical generator; inspect an already adopted or different source without overwriting.'
source=norm(Path(__file__).resolve().parent/'playtt-prepare-small-heap-loader.mjs');assert sha(source)==after
if a.apply:target.write_bytes(source)
print(json.dumps({'result':'pass','applied':a.apply,'beforeSha256':before,'afterSha256':after,'generatedLoaderWritten':False,'next':'Run node scripts/playtt-prepare-small-heap-loader.mjs in this runtime; --check checks without writing.','deployed':False}))
