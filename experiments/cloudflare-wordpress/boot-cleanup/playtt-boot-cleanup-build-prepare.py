from pathlib import Path
import hashlib,json,difflib
import argparse
parser=argparse.ArgumentParser();parser.add_argument('--local',action='store_true',required=True);parser.add_argument('--previous',type=Path,required=True);parser.add_argument('--target',type=Path,required=True);args=parser.parse_args()
rt=Path.cwd().resolve();previous=args.previous.resolve();build=args.target.resolve()
assert build!=rt and not rt.is_relative_to(build)
assert (rt/'scripts/playtt-snapshot-bundle.mjs').is_file()
assert not build.exists();sha=lambda b:hashlib.sha256(b).hexdigest();norm=lambda p:p.read_text(encoding='utf-8-sig').encode()
old=json.loads((previous/'build-inputs.json').read_text(encoding='utf-8'));prepared={}
for e in old['files']:
 data=(previous/e['path']).read_bytes();assert sha(data)==e['sha256'];prepared[e['path']]=data
original=prepared['src/worker.ts'].decode();s=original
a='import { bootWordPressAndRequestHandler, type WordPressInstallMode } from "@wp-playground/wordpress"'
b='import type { WordPressInstallMode } from "@wp-playground/wordpress"\nimport { bootPlayttWordPressRuntime } from "./playtt-boot-cleanup.js"'
assert s.count(a)==1;s=s.replace(a,b)
a='const boot = () => bootWordPressAndRequestHandler({'
assert s.count(a)==1;s=s.replace(a,'const boot = () => bootPlayttWordPressRuntime({')
a='''    wordpressInstallMode,
  })
  const requestHandler = trace ? await trace.measureComposite("playground.opaque", boot) : await boot()
  const php = await requestHandler.getPrimaryPhp()'''
b='''    wordpressInstallMode,
  }, async (requestHandler) => {
  const php = await requestHandler.getPrimaryPhp()'''
assert s.count(a)==1;s=s.replace(a,b)
a='''  return { php, requestHandler, wordpressVersion, editorHeartbeat }
}

function initialMarkdownFiles'''
b='''  return { php, requestHandler, wordpressVersion, editorHeartbeat }
  })
  return trace ? trace.measureComposite("playground.opaque", boot) : boot()
}

function initialMarkdownFiles'''
assert s.count(a)==1;s=s.replace(a,b)
# Indent the finalization callback; keep its actual checks unchanged.
start=s.index('  }, async (requestHandler) => {')+len('  }, async (requestHandler) => {\n');end=s.index('\n  })\n  return trace ? trace.measureComposite',start)
s=s[:start]+''.join('  '+line if line.strip() else line for line in s[start:end].splitlines(True))+s[end:]
prepared['src/worker.ts']=s.encode();helper=norm(rt/'scripts/playtt-boot-cleanup-candidate.ts');prepared['src/playtt-boot-cleanup.ts']=helper
for name,data in prepared.items():
 p=build/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(data)
patch=''.join(difflib.unified_diff(original.splitlines(True),s.splitlines(True),fromfile='a/src/worker.ts',tofile='b/src/worker.ts',n=1));(build/'worker-boot-cleanup.patch').write_text(patch,encoding='utf-8',newline='\n')
report={'schema':'playtt/boot-cleanup-source-inputs/v1','baseline':'preallocated fullsource205inputs','sourceCount':83,'files':[{'path':k,'sha256':sha(v)}for k,v in sorted(prepared.items())],'originalWorkerSha256':sha(original.encode()),'candidateWorkerSha256':sha(s.encode()),'helperSha256':sha(helper),'materializerSha256':old['candidateSourceSha256'],'changes':['src/worker.ts','src/playtt-boot-cleanup.ts'],'centralRuntimeChanged':False,'cloudRequests':0,'deployed':False}
(build/'build-inputs.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8');print(json.dumps({k:report[k]for k in ['sourceCount','candidateWorkerSha256','helperSha256','centralRuntimeChanged']}))
