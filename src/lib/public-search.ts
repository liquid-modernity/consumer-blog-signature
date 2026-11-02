import {publicSearch} from '@gaga/arsenal/search';
import type {GagaDiscoveryRecord} from './discovery';
import type {SearchableArtifactDescriptor} from '@gaga/engine-capabilities/search';
export type PublicSearchIndex={items:{title:string;slug:string;description?:string;tags?:string[];topics?:string[]}[];records:GagaDiscoveryRecord[];artifacts:SearchableArtifactDescriptor[];links:Record<string,string>};
let pending:Promise<PublicSearchIndex>|undefined;
export function loadPublicSearch(){return pending??=fetch('/search-index.json').then(async r=>{if(!r.ok)throw Error('Public search unavailable');const data=await r.json();if(!Array.isArray(data.records)||!Array.isArray(data.artifacts)||!data.links)throw Error('Invalid public index');return data;}).catch(error=>{pending=undefined;throw error;});}
export function searchPublicIndex(data:PublicSearchIndex,query:string,limit=12):GagaDiscoveryRecord[]{return publicSearch(data,query,limit);}
