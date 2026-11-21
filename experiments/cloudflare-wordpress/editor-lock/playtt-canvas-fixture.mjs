import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
const html=await readFile(new URL('./playtt-canvas-fixture.html',import.meta.url));
const frame='<!doctype html><meta charset="utf-8"><body><h2>ordinary frame content 普通框架</h2></body>';
const server=createServer((request,response)=>{
  const path=new URL(request.url,'http://127.0.0.1:9446').pathname;
  if(path!=='/'&&path!=='/frame.html'){response.writeHead(404);response.end('Not found');return;}
  response.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store'});response.end(path==='/'?html:frame);
});
const stop=()=>{server.closeAllConnections();server.close(()=>process.exit(0));};
server.listen(9446,'127.0.0.1',()=>console.log('Canvas fixture listening at http://127.0.0.1:9446/ (600 second bound)'));
const timer=setTimeout(stop,600000);process.on('SIGINT',stop);process.stdin.on('data',data=>{if(data.toString().trim()==='stop'){clearTimeout(timer);stop();}});
