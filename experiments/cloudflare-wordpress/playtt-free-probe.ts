import { runBootProbe } from './worker.js';
import wordpressZip from '../artifacts/cloudflare-wordpress-runtime-corpus.zip';
import sqliteZip from '../artifacts/cloudflare-sqlite-database-integration.zip';
import wordpressManifest from '../assets/wordpress-runtime-artifact.json' with {type:'json'};
import sqliteManifest from '../assets/sqlite-database-integration-artifact.json' with {type:'json'};

// This adapter exposes immutable, hash-validated boot artifacts only. It is not
// a database or a persistence implementation. No R2 resources are provisioned.
const artifacts = new Map<string, ArrayBuffer>([
  [wordpressManifest.key, wordpressZip], [sqliteManifest.key, sqliteZip]
]);
const bucket = {async get(key: string) {
  const data = artifacts.get(key);
  return data ? {size:data.byteLength, async arrayBuffer(){return data.slice(0);}} : null;
}} as unknown as R2Bucket;
interface Env { PLAYTT_PROBE_TOKEN?:string; PLAYTT_PROBE:DurableObjectNamespace; }
const phases = new Set(['php','streamed-files','mdi-wordpress']);
async function run(request:Request) {
  const phase = new URL(request.url).searchParams.get('phase');
  if (!phase || !phases.has(phase)) return new Response('Unknown probe',{status:404});
  const started=Date.now();
  const response=await runBootProbe(phase,bucket);
  response.headers.set('Cache-Control','no-store');
  response.headers.set('X-Playtt-Probe-Wall-Ms',String(Date.now()-started));
  return response;
}
export class PlayttBootProbe {
  constructor(_state:DurableObjectState,_env:Env) {}
  fetch(request:Request) { return run(request); }
}
export default {async fetch(request:Request,env:Env) {
  if(!env.PLAYTT_PROBE_TOKEN || request.headers.get('Authorization')!==`Bearer ${env.PLAYTT_PROBE_TOKEN}`)
    return new Response('Not found',{status:404});
  if(request.method!=='POST') return new Response('Method not allowed',{status:405});
  const url=new URL(request.url);
  if(url.pathname==='/health') return Response.json({scope:'boot CPU prerequisite only; no persistence',upstream:'9764022156a61ba7d2b4d8a2196b01ccb33b82b5'});
  if(url.pathname==='/worker') return run(request);
  if(url.pathname==='/durable-object') return env.PLAYTT_PROBE.getByName('playtt-boot-prerequisite-v1').fetch(request);
  return new Response('Not found',{status:404});
}};
