import { boot, php } from './boot.mjs';
const server = await boot();
console.log(JSON.stringify({url:server.serverUrl, info:JSON.parse(await php(server,"echo wp_json_encode(array('wordpress'=>get_bloginfo('version'),'theme'=>wp_get_theme()->get('Name'),'pages'=>wp_count_posts('page')->publish));"))}));
let closing = false;
for (const signal of ['SIGINT','SIGTERM']) process.on(signal,async()=>{
  if(closing) return; closing=true;
  await server[Symbol.asyncDispose](); process.exit(0);
});
