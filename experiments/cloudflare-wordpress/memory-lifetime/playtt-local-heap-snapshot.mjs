import WebSocket from 'ws';
import {createWriteStream} from 'node:fs';
import {once} from 'node:events';
const target=(await (await fetch('http://127.0.0.1:9444/json/list')).json())[0];
if(target.webSocketDebuggerUrl!=='ws://127.0.0.1:9444/ws')throw Error('Unexpected local inspector');
const label=process.argv.find(arg=>arg.startsWith('--label='))?.slice(8)||'local';
if(!/^[a-z0-9-]+$/.test(label))throw Error('Invalid local snapshot label');
const out=createWriteStream('artifacts/playtt-'+label+'-private.heapsnapshot');
const ws=new WebSocket(target.webSocketDebuggerUrl,{origin:'http://localhost:9444'});await once(ws,'open');
let chunks=0,bytes=0;
const done=new Promise((resolve,reject)=>{
 const timer=setTimeout(()=>reject(Error('Local snapshot timed out')),55000);
 ws.on('message',raw=>{const m=JSON.parse(raw);if(m.method==='HeapProfiler.addHeapSnapshotChunk'){out.write(m.params.chunk);chunks++;bytes+=Buffer.byteLength(m.params.chunk);}if(m.id===1){clearTimeout(timer);m.error?reject(Error(m.error.message)):resolve();}});
});
ws.send(JSON.stringify({id:1,method:'HeapProfiler.takeHeapSnapshot',params:{reportProgress:false}}));
try{await done;out.end();await once(out,'finish');console.log(JSON.stringify({result:'pass',chunks,bytes,scope:'Private local heap snapshot; do not publish raw contents'}));}finally{ws.terminate();out.end();}
