// One local diagnostic read; no server, cloud request or mutation.
import {readFile} from 'node:fs/promises';
import {openSnapshotBundle} from './playtt-snapshot-bundle.mjs';
const load=async p=>JSON.parse(await readFile(p,'utf8'));
const mark=stage=>console.log(JSON.stringify({stage,node:process.version,...process.memoryUsage()}));
mark('start');
const old=await load('artifacts/playtt-native-approved-backup-owned-private.json');
const original=await openSnapshotBundle(old.directory+'/independent',old.anchor);mark('baseline-opened');
const local=await load('artifacts/playtt-visual-cloud-rehearsal-owned-private.json');
const final=await openSnapshotBundle(local.directory+'/independent',local.finalAnchor);mark('final-opened');
console.log(JSON.stringify({baselineObjects:original.graph.objects.length,finalObjects:final.graph.objects.length,baselinePayload:original.graph.payloadBytes,finalPayload:final.graph.payloadBytes,remoteCalls:0}));
