import {defineQuery,executeSearchReference} from '@gaga/engine-capabilities/search';
export const normalizeSearch = value => String(value ?? '').normalize('NFKC').toLocaleLowerCase().trim().replace(/\s+/g,' ');
export function searchRank(title, query) {
 const text=normalizeSearch(title),q=normalizeSearch(query);if(!q)return 0;
 if(text===q)return 100;if(text.startsWith(q))return 80;
 const words=q.split(' ');if(words.every(w=>text.split(/[^\p{L}\p{N}]+/u).includes(w)))return 60;
 return text.includes(q)?40:0;
}
// Engine determines admitted content matches; application policy orders their presentation.
export function publicSearch(data, query, limit=12) {
 const q=normalizeSearch(query);if(!data||!q)return [];
 const result=executeSearchReference({id:'application-public-search',query:defineQuery({id:'application-public-query',text:q,filters:[],facets:[],scope:[],constraints:[],diagnostics:[]}),artifacts:data.artifacts??[],limitations:[],diagnostics:[]});
 if(result.status!=='succeeded')return [];
 const destinations=new Set(result.output.matchedArtifactIds.map(id=>data.links?.[id]));
 return (data.records??[]).filter(r=>destinations.has(r.href)).map((record,index)=>({record,index,score:searchRank(record.title,q)})).sort((a,b)=>b.score-a.score||a.index-b.index).slice(0,limit).map(r=>r.record);
}
