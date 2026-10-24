import {createPublicSearchWorker} from '@gaga/corps-cloudflare';
import artifacts from '../.gaga/worker-artifacts.json';
import projection from '../.gaga/host-projection.json';
const route=projection.routes.find(r=>r.capability==='gaga.capability.search');
if(!route||route.scope!=='exact')throw Error('Explicit Search Worker route required');
const search=createPublicSearchWorker({path:route.path,loadArtifacts:async()=>artifacts});
export default{async fetch(request,env){
 const url=new URL(request.url);
 if(url.pathname===route.path)return search.fetch(request,env);
 return env.ASSETS?env.ASSETS.fetch(request):new Response('Asset binding unavailable',{status:503});
}};
