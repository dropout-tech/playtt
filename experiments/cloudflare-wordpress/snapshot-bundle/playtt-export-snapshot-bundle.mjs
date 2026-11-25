// GET-only private Cloudflare download. No fence, pin, pointer or cloud mutation.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parseArgs} from 'node:util';
import {exportSnapshotBundle} from './playtt-snapshot-bundle.mjs';
import {backupPinInput} from '../src/playtt-backup-pins.ts';
import {createCloudflareSnapshotSource} from './playtt-snapshot-download.mjs';

const {values}=parseArgs({options:{remote:{type:'boolean'},bucket:{type:'string'},anchor:{type:'string'},output:{type:'string'},'oauth-config':{type:'string'}}});
assert.equal(values.remote,true,'Explicit --remote is required');
assert.ok(['playtt-wordpress-rebuild-audit','playtt-wordpress-pin-restore-audit'].includes(values.bucket));
for(const key of ['anchor','output','oauth-config'])assert.ok(values[key],`--${key} is required`);
const supplied=JSON.parse(await readFile(values.anchor,'utf8')),anchor=backupPinInput(supplied.pin||supplied);
const oauth=await readFile(values['oauth-config'],'utf8'),match=oauth.match(/^oauth_token\s*=\s*"([^"\r\n]+)"\s*$/m);assert.ok(match,'OAuth token is unavailable');
const {bucket,stats}=createCloudflareSnapshotSource({bucketName:values.bucket,token:match[1]});
const {graph}=await exportSnapshotBundle(bucket,anchor,values.output);
console.log(JSON.stringify({result:'pass',scope:'Authenticated GET-only private snapshot export with externally supplied pin identity; no new pin or cloud restore',format:graph.format,revision:graph.anchor.revision,objects:graph.objects.length,payloadBytes:graph.payloadBytes,...stats,cloudMutations:0}));
