import https from 'node:https';
import http from 'node:http';
import assert from 'node:assert/strict';
import {writeFile,mkdir} from 'node:fs/promises';
const edge=process.env.PLAYTT_EDGE_IP;
const tests=[
  ['https://www.playtt.tw/class/?utm_source=verify&message=a%3Fb','https://playtt.tw/class/?utm_source=verify&message=a%3Fb'],
  ['http://www.playtt.tw/class/?utm_source=verify','https://www.playtt.tw/class/?utm_source=verify'],
  ['http://playtt.tw/class/?utm_source=verify','https://playtt.tw/class/?utm_source=verify'],
];
const results=[];
for(const [url,expected]of tests){
  const observed=await new Promise((accept,reject)=>{
    const module=url.startsWith('https:')?https:http;
    const req=module.get(url,edge?{lookup:(_host,_opts,done)=>done(null,[{address:edge,family:4}])}:{},res=>{
      res.resume();res.on('end',()=>accept({status:res.statusCode,location:res.headers.location,cfRay:res.headers['cf-ray']}));
    });req.on('error',reject);req.setTimeout(20000,()=>req.destroy(new Error('Timeout')));
  });
  assert.equal(observed.status,301,url);assert.equal(observed.location,expected,url);
  results.push({url,...observed,pass:true});
}
await mkdir('cloudflare/test-results',{recursive:true});
await writeFile('cloudflare/test-results/canonical.json',JSON.stringify({at:new Date().toISOString(),edgeOverride:edge||null,result:'pass',results},null,2));
console.log(JSON.stringify({result:'pass',redirects:results.length}));
