import { readFile, writeFile } from 'node:fs/promises';
const origin = 'https://playtt-wp-free-cms-probe.muzhi-garden-platform.workers.dev';
const secrets = JSON.parse(await readFile('../../../playtt-cms-secrets.json', 'utf8'));
const started = Date.now();
const response = await fetch(origin + '/wp-login.php', {
  headers: { 'X-Playtt-Probe': secrets.WORDPRESS_OPERATOR_TOKEN },
  redirect: 'manual', signal: AbortSignal.timeout(180000),
});
const body = await response.text();
const report = {
  at: new Date().toISOString(), status: response.status, wallMs: Date.now() - started,
  cfRay: response.headers.get('cf-ray'),
  title: body.match(/<title>([^<]{0,200})<\/title>/i)?.[1] || null,
  cloudflareError: body.match(/<span[^>]*>Error\s+(\d+)<\/span>/i)?.[1] || null,
  loginForm: /name="log"/.test(body),
};
await writeFile('artifacts/playtt-cms-diagnostic.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report));
