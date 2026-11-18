// LOCAL EMULATOR ONLY. This is never a deployment entry point.
import worker, {PlayttWordPressExecution as Execution, WordPressStateCoordinator} from '../src/worker-playtt-do.js';
type Env = ConstructorParameters<typeof Execution>[1];
function localOnly(env:Env) {
  const sites=JSON.parse(env.WORDPRESS_SITE_CONTEXTS || '[]');
  if(sites.length!==1 || sites[0].origin!=='http://127.0.0.1:9429' || env.WORDPRESS_OPERATOR_TOKEN!=='playtt-cms-local-only-operator') throw new Error('Local fault harness refuses non-local configuration.');
}
export {WordPressStateCoordinator};
export class PlayttWordPressExecution extends Execution {
  constructor(state:DurableObjectState,env:Env) {
    localOnly(env);
    const bucket=new Proxy(env.WORDPRESS_STATE_BUCKET,{
      get(target,key) {
        if(key==='put')return (objectKey:string,...args:unknown[])=>{
          if(objectKey.includes('/markdown/revisions/') && objectKey.endsWith('.json')) throw new Error('PLAYTT_LOCAL_MAINTENANCE_MANIFEST_FAILURE');
          return (target.put as Function).call(target,objectKey,...args);
        };
        const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;
      }
    });
    super(state,{...env,WORDPRESS_STATE_BUCKET:bucket});
  }
}
export default {
  fetch(request:Request,env:Env) {
    localOnly(env);
    if(new URL(request.url).origin!=='http://127.0.0.1:9429')return new Response('Local test only',{status:403});
    return worker.fetch(request,env);
  }
};
