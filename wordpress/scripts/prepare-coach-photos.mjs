// Convert the supplied presentation photos to web assets; no face replacement or retouching.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import sharp from 'sharp';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
assert.equal(process.argv.length,3,'Pass the extracted reference directory');
const directory=path.resolve(process.argv[2]);
const photos=JSON.parse(await readFile(path.join(directory,'photos.json'),'utf8'));
const coaches=JSON.parse(await readFile(path.join(root,'content/coaches.json'),'utf8')).filter(c=>!c.pendingIdentity);
const manifest=[];
for(const coach of coaches){
 const reference=photos.find(p=>p.slide===coach.sourceSlide);assert.ok(reference);
 const input=path.resolve(directory,reference.file);assert.equal(path.dirname(input),directory);
 const data=await readFile(input),output=path.join(root,'lets-play/assets/images',coach.photo+'.webp');
 const result=await sharp(data).rotate().resize({width:800,height:1100,fit:'inside',withoutEnlargement:true}).webp({quality:85}).toFile(output);
 manifest.push({sourceSlide:coach.sourceSlide,file:coach.photo+'.webp',sourceSha256:createHash('sha256').update(data).digest('hex'),sha256:createHash('sha256').update(await readFile(output)).digest('hex'),width:result.width,height:result.height,bytes:result.size});
}
await writeFile(path.join(root,'content/coach-photo-assets.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({photos:manifest.length,bytes:manifest.reduce((sum,a)=>sum+a.bytes,0)}));
