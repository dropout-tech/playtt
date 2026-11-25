// Decode only ampersands used in WordPress's escaped attribute URLs.
export function nativeLogoutPath(html,origin){
 const hrefs=[...html.matchAll(/\bhref\s*=\s*(["'])(.*?)\1/gs)].map(m=>m[2].replace(/&(?:amp|#0*38|#x0*26);/gi,'&'));
 for(const href of hrefs){
  let url;try{url=new URL(href,origin);}catch{continue;}
  if(url.pathname!=='/wp-login.php'||url.searchParams.get('action')!=='logout')continue;
  if(url.origin!==origin)throw Error('native-profile:cross-origin-logout');
  if(!/^[a-f0-9]{10}$/.test(url.searchParams.get('_wpnonce')||''))throw Error('native-profile:missing-logout-nonce');
  return url.pathname+url.search;
 }
 throw Error('native-profile:missing-logout-link');
}
