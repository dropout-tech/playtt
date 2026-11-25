"""Apply one locally validated generated-loader change after exact hash checks. No network or deployment."""
from pathlib import Path
import argparse,hashlib,json
p=argparse.ArgumentParser(description=__doc__);p.add_argument('--runtime',type=Path,required=True);p.add_argument('--apply',action='store_true');a=p.parse_args();r=a.runtime.resolve();path=r/'src/playtt-php-loader.mjs';assert path.resolve().is_relative_to(r)
source=path.read_text(encoding='utf-8-sig');sha=lambda s:hashlib.sha256(s.encode()).hexdigest()
before='9eee1c4bf010ff84741d82c5143689e76c2d06cd0c877dc919c6ecd202b9b666';after='382310127a494ab04b7324823230f3e119e6928330575a3089cd84566da6150f'
assert sha(source)==before,'Use the pinned baseline generated loader; inspect an already-applied or different source instead of overwriting it.'
old='current_path = PATH.join2(current_path, parts[i]);';new="current_path = current_path === '/' ? '/' + parts[i] : current_path + '/' + parts[i];"
assert source.count(old)==1;candidate=source.replace(old,new);assert sha(candidate)==after
if a.apply:path.write_bytes(candidate.encode())
print(json.dumps({'result':'pass','applied':a.apply,'changedStatements':1,'beforeSha256':before,'afterSha256':after,'deployed':False}))
