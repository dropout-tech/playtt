import { timingSafeEqual } from 'node:crypto';
const COOKIE='__Host-playtt-probe';
const ROUTE='/__playtt-probe-access';
const TTL=1800;
const equal=(a:string,b:string)=>{const x=new TextEncoder().encode(a),y=new TextEncoder().encode(b);return x.length===y.length&&timingSafeEqual(x,y);};
const headers={'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'same-origin','Content-Security-Policy':"default-src 'none'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'"};
async function sign(secret:string,host:string,expires:number):Promise<string>{
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  return Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode('playtt-probe-access:v1:'+host+':'+expires))),b=>b.toString(16).padStart(2,'0')).join('');
}
export async function playttProbeAccess(request:Request,secret:string):Promise<Request|Response>{
  const url=new URL(request.url),now=Math.floor(Date.now()/1000);
  if(!secret)return new Response('Not configured',{status:503,headers});
  if(url.pathname===ROUTE){
    if(request.method==='GET')return new Response('<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Let’s Play 後台測試入口</title><h1>Let’s Play 後台測試入口</h1><p>此站用於免費 WordPress 驗收。</p><form method="post"><label>測試存取碼 <input name="access" type="password" required autocomplete="off"></label><button type="submit">進入測試站</button></form></html>',{headers:{...headers,'Content-Type':'text/html; charset=utf-8'}});
    if(request.method!=='POST')return new Response('Method not allowed',{status:405,headers});
    if(request.headers.get('origin')!==url.origin||!request.headers.get('content-type')?.startsWith('application/x-www-form-urlencoded'))return new Response('Forbidden',{status:403,headers});
    const text=await request.text();
    if(text.length>1024||!equal(new URLSearchParams(text).get('access')||'',secret))return new Response('Forbidden',{status:403,headers});
    const expires=now+TTL,value=expires+'.'+await sign(secret,url.host,expires);
    return new Response(null,{status:303,headers:{...headers,Location:'/wp-login.php','Set-Cookie':`${COOKIE}=${value}; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=${TTL}`}});
  }
  let authorized=equal(request.headers.get('X-Playtt-Probe')||'',secret);
  const cookies=(request.headers.get('cookie')||'').split(';').map(s=>s.trim()).filter(Boolean);
  if(!authorized){
    const value=cookies.find(c=>c.startsWith(COOKIE+'='))?.slice(COOKIE.length+1)||'';
    const match=/^(\d{10})\.([a-f0-9]{64})$/.exec(value);
    if(match){const expiry=Number(match[1]);authorized=expiry>now&&expiry<=now+TTL&&equal(match[2],await sign(secret,url.host,expiry));}
  }
  if(!authorized)return new Response('Not found',{status:404,headers});
  const forwarded=new Request(request);forwarded.headers.delete('X-Playtt-Probe');
  const remaining=cookies.filter(c=>!c.startsWith(COOKIE+'='));
  if(remaining.length)forwarded.headers.set('cookie',remaining.join('; '));else forwarded.headers.delete('cookie');
  return forwarded;
}
