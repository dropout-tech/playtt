import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import sharp from 'sharp';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.resolve(root, '../src');
const destination = path.join(root, 'lets-play/assets/images');
await mkdir(destination, { recursive: true });
const assets = {
  'brand-desktop': 'homepage/banner1440.png', 'brand-mobile': 'homepage/banner414.png',
  logo: 'homepage/logo.png', children: 'classes/img1.png', individual: 'classes/img2.png', camp: 'classes/img3.png',
  'coach-kuo': 'ourCouchMenber/img4.png', 'coach-lin': 'ourCouchMenber/img3.png',
  'coach-yang': 'ourCouchMenber/yang-correct.jpg', 'coach-huang': 'ourCouchMenber/huang-correct.jpg',
  'coach-amber': 'ourCouchMenber/coach-wang-yunhan.jpg', 'coach-tsai': 'ourCouchMenber/tsai-correct.jpg',
  'coach-wen': 'ourCouchMenber/img2.png', 'coach-wang': 'ourCouchMenber/wang-correct.jpg',
};
const manifest = [];
for (const [name, file] of Object.entries(assets)) {
  const input = path.join(source, 'assets', file);
  const output = path.join(destination, name + '.webp');
  const result = await sharp(input).resize({ width: name === 'logo' ? 460 : name.startsWith('coach') ? 640 : name === 'brand-desktop' ? 1920 : name === 'brand-mobile' ? 828 : 1100, withoutEnlargement: true }).webp({ quality: name.startsWith('brand-') ? 92 : 83 }).toFile(output);
  manifest.push({ file: 'assets/images/' + name + '.webp', source: 'src/assets/' + file, width: result.width, height: result.height, bytes: result.size });
}
await sharp(path.join(source, 'assets/homepage/banner1440.png')).resize({ width: 1200 }).flatten({ background: '#ffffff' }).jpeg({ quality: 85 }).toFile(path.join(destination, 'share.jpg'));
const coachSource = await readFile(path.join(source, 'components/CoachList.tsx'), 'utf8');
const literal = coachSource.match(/const COACHES: Coach\[\] = (\[[\s\S]*?\n\]);/)[1];
// Evaluate only the inspected literal array, never imports or component code.
const coaches = vm.runInNewContext('(' + literal + ')', {}, { timeout: 1000 });
const photos = ['coach-kuo','coach-lin','coach-yang','coach-huang','coach-amber','coach-tsai','coach-wen','coach-wang'];
for (const [i, coach] of coaches.entries()) coach.photo = photos[i];
await mkdir(path.join(root, 'content'), { recursive: true });
await writeFile(path.join(root, 'content/coaches.json'), JSON.stringify(coaches, null, 2) + '\n');
await writeFile(path.join(root, 'content/assets.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify({ assets: manifest.length + 1, coaches: coaches.length, webpBytes: manifest.reduce((s,a) => s+a.bytes,0) }));
