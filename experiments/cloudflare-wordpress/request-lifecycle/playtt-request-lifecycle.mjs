// Local diagnostics only. Never import into a deployable worker.
// Public records contain bounded enums/counts; raw error text stays in a separate private channel.
import {classifyAjax} from './playtt-ajax-classifier.mjs';
export const TRACE_HEADER='x-playtt-local-request-trace';
const knownErrors=new Set(['Error','TypeError','RangeError','AbortError','InvalidStateError']);
export function errorSummary(error){return {errorName:knownErrors.has(error?.name)?error.name:'other',connectionLost:typeof error?.message==='string'&&error.message.includes('Network connection lost')};}
export function routeMetadata(request){
 const u=new URL(request.url),p=u.pathname;
 const category=p==='/wp-admin/admin-ajax.php'?'ajax':p==='/wp-login.php'?'login':p==='/wp-admin/post.php'?'post-editor':p==='/wp-admin/profile.php'?'profile':p.startsWith('/wp-json/')?'rest':/\.(css|js|woff2?|png|svg|jpg|webp)$/.test(p)?'asset':'other';
 const clientCase=request.headers.get('x-playtt-local-client-case');
 return {category,method:['GET','POST','PUT','DELETE','HEAD','OPTIONS'].includes(request.method)?request.method:'other',logout:p==='/wp-login.php'&&u.searchParams.get('action')==='logout',...(['control-before','cancel-inflight','control-after'].includes(clientCase)?{clientCase}:{})};
}
export function createLifecycleTracer({emit,limit=4096,streamBodies=true,classifyBeforeForward=true}){
 let events=0,truncated=false;
 const log=record=>{if(events>=limit){if(!truncated){truncated=true;emit({schema:'playtt/local-lifecycle/v1',stage:'truncated'});}return;}events++;emit(record);};
 return async function trace(request,forward,layer){
  if(!['outer','execution'].includes(layer))throw Error('Unknown diagnostic layer');
  const id=Number(request.headers.get(TRACE_HEADER));if(!Number.isSafeInteger(id)||id<1||id>10000)throw Error('Missing local request identity');
  const started=Date.now(),meta=routeMetadata(request);
  const event=(stage,extra={})=>log({schema:'playtt/local-lifecycle/v1',id,layer,...meta,stage,elapsedMs:Date.now()-started,...extra});
  const privateError=(stage,error)=>{const summary=errorSummary(error);event(stage,summary);if(summary.connectionLost)log({schema:'playtt/local-lifecycle-error-private/v1',id,layer,stage,message:String(error?.message||'').slice(0,2000),stack:String(error?.stack||'').slice(0,6000)});};
  let cleaned=false;
  const onAbort=()=>event('abort',{aborted:true,...errorSummary(request.signal.reason)});
  const cleanup=()=>{if(!cleaned){cleaned=true;request.signal.removeEventListener('abort',onAbort);}};
  event('start',{aborted:request.signal.aborted});request.signal.addEventListener('abort',onAbort,{once:true});
  try{
   // Observe only allowlisted form metadata; do not expose nonce, post ID, cookies or field values.
   const classification=layer==='outer'&&meta.category==='ajax'&&request.method==='POST'
    ?classifyAjax(request).then(fields=>event('ajax-fields',fields),error=>privateError('ajax-fields-error',error)):Promise.resolve();
   if(classifyBeforeForward)await classification;
   const response=await forward(request);event('headers',{status:response.status,aborted:request.signal.aborted,bodyPresent:!!response.body});
   if(!classifyBeforeForward)await classification;
   // Restrict body instrumentation to the two routes involved in the observed failure.
   // Encoded/WebSocket/other responses retain their original object and transport behavior.
   if(!streamBodies){event('unwrapped');return response;}
   if(!response.body||!['ajax','login'].includes(meta.category)||response.headers.has('content-encoding')||response.webSocket){cleanup();event('unwrapped');return response;}
   const reader=response.body.getReader();let ended=false,bytes=0,chunks=0;
   const stream=new ReadableStream({
    async pull(controller){
     if(ended)return;
     try{const item=await reader.read();if(ended)return;
      if(item.done){ended=true;cleanup();reader.releaseLock();event('body-end',{bytes,chunks,aborted:request.signal.aborted});controller.close();return;}
      bytes+=item.value.byteLength;chunks++;controller.enqueue(item.value);
     }catch(error){if(ended)return;ended=true;cleanup();reader.releaseLock();privateError('body-error',error);controller.error(error);}
    },
    async cancel(reason){
     if(ended)return;ended=true;event('body-cancel',{bytes,chunks,aborted:request.signal.aborted,...errorSummary(reason)});cleanup();
     try{await reader.cancel(reason);event('cancel-complete');}catch(error){privateError('cancel-error',error);throw error;}finally{reader.releaseLock();}
    }
   });
   return new Response(stream,response);
  }catch(error){cleanup();privateError('fetch-error',error);throw error;}
 };
}
