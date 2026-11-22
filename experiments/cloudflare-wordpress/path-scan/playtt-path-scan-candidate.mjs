// Isolated generator: pin the adopted loader, change only lookupPath traversal.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
export const baselineSha256='382310127a494ab04b7324823230f3e119e6928330575a3089cd84566da6150f';
export const sha=b=>createHash('sha256').update(b).digest('hex');
export function makeCandidate(source){
 assert.equal(sha(source),baselineSha256,'Unrecognized adopted loader');
 const start=source.indexOf('\t\tlookupPath(path, opts = {}) {'),end=source.indexOf('\n\t\tgetPath(node) {',start);assert.ok(start>=0&&end>start);
 const original=source.slice(start,end);let body=original;
 const replace=(from,to)=>{assert.equal(body.split(from).length,2,'Expected one scoped patch');body=body.replace(from,to);};
 replace("var parts = path.split('/').filter((p) => !!p);",`// Scan primitive paths without allocating split/filter arrays. Boxed or
\t\t\t\t// custom absolute path objects retain the original split/filter behavior.
\t\t\t\tvar parts = typeof path === 'string' ? null : path.split('/').filter((p) => !!p);
\t\t\t\tvar scanPosition = 0;
\t\t\t\tvar pathLength = parts === null ? path.length : 0;`);
 replace('for (var i = 0; i < parts.length; i++) {\n\t\t\t\t\tvar islast = i === parts.length - 1;',`for (var i = 0; ; i++) {
\t\t\t\t\tvar part;
\t\t\t\t\tvar islast;
\t\t\t\t\tif (parts === null) {
\t\t\t\t\t\twhile (scanPosition < pathLength && path.charCodeAt(scanPosition) === 47) scanPosition++;
\t\t\t\t\t\tif (scanPosition >= pathLength) break;
\t\t\t\t\t\tvar partStart = scanPosition;
\t\t\t\t\t\tvar partEnd = path.indexOf('/', scanPosition);
\t\t\t\t\t\tscanPosition = partEnd < 0 ? pathLength : partEnd;
\t\t\t\t\t\tpart = path.slice(partStart, scanPosition);
\t\t\t\t\t\twhile (scanPosition < pathLength && path.charCodeAt(scanPosition) === 47) scanPosition++;
\t\t\t\t\t\tislast = scanPosition >= pathLength;
\t\t\t\t\t} else {
\t\t\t\t\t\tif (i >= parts.length) break;
\t\t\t\t\t\tpart = parts[i];
\t\t\t\t\t\tislast = i === parts.length - 1;
\t\t\t\t\t}`);
 // Replace only the old traversal's component references, leaving fallback indexing intact.
 const marker='\t\t\t\t\tif (islast && opts.parent)',split=body.indexOf(marker);assert.ok(split>0);let tail=body.slice(split);assert.equal(tail.split('parts[i]').length,6);tail=tail.replaceAll('parts[i]','part');assert.equal(tail.split("parts.slice(i + 1).join('/')").length,3);tail=tail.replaceAll("parts.slice(i + 1).join('/')","(parts === null ? path.slice(scanPosition) : parts.slice(i + 1).join('/'))");body=body.slice(0,split)+tail;
 const candidate=source.slice(0,start)+body+source.slice(end);assert.equal(candidate.slice(0,start),source.slice(0,start));assert.ok(candidate.endsWith(source.slice(end)));
 return {candidate,originalLookup:original,candidateLookup:body,baselineSha256,candidateSha256:sha(candidate)};
}
