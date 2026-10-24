// Read-only credential diagnosis. Detailed metadata is encrypted for the operator, never logged.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createPublicKey,randomBytes,createCipheriv,publicEncrypt,constants,createHash} from 'node:crypto';
import {resolve} from 'node:path';
const token=process.env.CLOUDFLARE_API_TOKEN,account=process.env.CLOUDFLARE_ACCOUNT_ID,pem=process.env.DIAGNOSTIC_PUBLIC_KEY,out=process.env.GAGA_EVIDENCE_DIRECTORY;
if(!token||!account||!pem||!out)throw Error('Existing secrets, operator public key and evidence directory are required');
const key=createPublicKey(pem);if(key.asymmetricKeyType!=='rsa')throw Error('RSA diagnostic public key required');
const observations=[];
function tokenMetadata(r){if(!r||typeof r!=='object')return null;return Object.fromEntries(['id','name','status','issued_on','modified_on','expires_on','not_before','policies','condition','owner'].filter(k=>Object.hasOwn(r,k)).map(k=>[k,r[k]]));}
async function get(label,path,select=r=>r){
 const response=await fetch('https://api.cloudflare.com/client/v4'+path,{method:'GET',headers:{Authorization:'Bearer '+token},redirect:'error',signal:AbortSignal.timeout(20000)});
 const bytes=Buffer.from(await response.arrayBuffer());if(bytes.length>2*1024*1024)throw Error('Oversized diagnostic response');
 let body;try{body=JSON.parse(bytes);}catch{body={success:false,errors:[]};}
 const entry={endpoint:label,httpStatus:response.status,success:body.success===true,errorCodes:(body.errors??[]).map(e=>e.code),result:body.success?select(body.result):null};observations.push(entry);return entry;
}
const u=await get('user-token-verify','/user/tokens/verify',tokenMetadata),a=await get('account-token-verify',`/accounts/${account}/tokens/verify`,tokenMetadata);
const ids=[...new Set([u,a].filter(x=>x.success).map(x=>x.result?.id).filter(x=>typeof x==='string'&&/^[a-f0-9]{32}$/i.test(x)))];
for(const id of ids){await get('user-token-details','/user/tokens/'+id,tokenMetadata);await get('account-token-details',`/accounts/${account}/tokens/${id}`,tokenMetadata);}
const listOwn=rows=>({count:Array.isArray(rows)?rows.length:null,matching:Array.isArray(rows)?rows.filter(x=>ids.includes(x.id)).map(tokenMetadata):[]});
await get('user-token-list','/user/tokens',listOwn);await get('account-token-list',`/accounts/${account}/tokens`,listOwn);
await get('permission-group-catalog','/user/tokens/permission_groups',rows=>Array.isArray(rows)?rows.filter(x=>/D1|Workers (KV|R2|Scripts)|API Tokens/i.test(x.name)).map(x=>({id:x.id,name:x.name,scopes:x.scopes})):null);
for(const [label,path]of[['workers-subdomain',`/accounts/${account}/workers/subdomain`],['d1-list',`/accounts/${account}/d1/database`],['r2-list',`/accounts/${account}/r2/buckets`],['kv-list',`/accounts/${account}/storage/kv/namespaces`]])await get(label,path,r=>label==='workers-subdomain'?{subdomain:r.subdomain}:{accessible:true});
const report={status:'READ_ONLY_DIAGNOSTIC_COMPLETE',credentialValueIncluded:false,credentialMutations:0,resourceMutations:0,accountId:account,verifiedTokenIds:ids,observations};
const plain=Buffer.from(JSON.stringify(report,null,2)+'\n');if(plain.includes(Buffer.from(token)))throw Error('Credential value entered diagnostics; refusing output');
const symmetric=randomBytes(32),iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',symmetric,iv),ciphertext=Buffer.concat([cipher.update(plain),cipher.final()]);
const envelope={format:'gaga-read-only-diagnostic/v1',cipher:'AES-256-GCM',keyWrapping:'RSA-OAEP-SHA256',publicKeySha256:createHash('sha256').update(pem).digest('hex'),wrappedKey:publicEncrypt({key,oaepHash:'sha256',padding:constants.RSA_PKCS1_OAEP_PADDING},symmetric).toString('base64'),iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64'),ciphertext:ciphertext.toString('base64')};
mkdirSync(out,{recursive:true});writeFileSync(resolve(out,'encrypted.json'),JSON.stringify(envelope,null,2)+'\n');
const summary={status:report.status,credentialMutations:0,resourceMutations:0,metadataEncrypted:true,observations:observations.map(({endpoint,httpStatus,success,errorCodes})=>({endpoint,httpStatus,success,errorCodes}))};writeFileSync(resolve(out,'summary.json'),JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify(summary));
