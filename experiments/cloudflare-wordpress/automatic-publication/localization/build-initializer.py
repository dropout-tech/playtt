"""Build a one-time initializer from the pinned official WordPress language ZIP.
Usage: python build-initializer.py <zh_TW.zip> <output.zip>
Download source: https://downloads.wordpress.org/translation/core/7.1.4/zh_TW.zip
"""
import hashlib,json,pathlib,sys,zipfile
source=pathlib.Path(sys.argv[1]); target=pathlib.Path(sys.argv[2])
assert hashlib.sha256(source.read_bytes()).hexdigest() == '373d29b034fdf43b8dbd6297b58640471bb64fdc7861c0f2eebc2274f149c4e4'
files={}
with zipfile.ZipFile(source) as archive:
    for entry in archive.infolist():
        name=pathlib.PurePosixPath(entry.filename).name
        if entry.is_dir() or name.endswith('.po'): continue
        assert 'zh_TW' in name and '..' not in name
        assert name not in files
        files[name]=archive.read(entry)
assert len(files)==77 and sum(map(len,files.values()))==2500119
manifest={name:hashlib.sha256(data).hexdigest() for name,data in files.items()}
with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as archive:
    archive.writestr('playtt-zh-tw/playtt-zh-tw.php',pathlib.Path(__file__).with_name('playtt-zh-tw.php').read_bytes())
    archive.writestr('playtt-zh-tw/manifest.json',json.dumps(manifest,ensure_ascii=False,indent=2))
    for name,data in files.items(): archive.writestr('playtt-zh-tw/package/'+name,data)
print(json.dumps({'files':len(files),'expandedBytes':sum(map(len,files.values())),'zipSha256':hashlib.sha256(target.read_bytes()).hexdigest()}))
