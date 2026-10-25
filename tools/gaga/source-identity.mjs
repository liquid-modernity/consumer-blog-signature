import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,lstatSync,readlinkSync} from 'node:fs';
import {createHash} from 'node:crypto';
export function sourceIdentity(cwd=process.cwd()){
 const git=(...args)=>execFileSync('git',args,{cwd,encoding:'utf8'}).trim();
 assert.match(git('rev-parse','HEAD'),/^[a-f0-9]{40}$/,'SHA-1 Git source required');git('diff','--cached','--exit-code');
 assert.equal(git('ls-files','--others','--exclude-standard'),'','Untracked source rejected');
 const entries=execFileSync('git',['ls-files','--stage','-z'],{cwd,encoding:'utf8'}).split('\0').filter(Boolean),files=[];
 for(const entry of entries){const match=entry.match(/^([0-7]{6}) ([a-f0-9]{40}) 0\t([\s\S]+)$/);assert.ok(match,'Unmerged or unsupported index entry');const [,mode,expected,path]=match,full=cwd+'/'+path,stat=lstatSync(full);
  assert.ok(mode==='120000'?stat.isSymbolicLink():stat.isFile()&&!stat.isSymbolicLink(),'Tracked file type changed: '+path);assert.ok(['100644','100755','120000'].includes(mode));
  if(mode!=='120000')assert.equal(Boolean(stat.mode&0o111),mode==='100755','Tracked executable mode changed: '+path);
  const bytes=mode==='120000'?Buffer.from(readlinkSync(full)):readFileSync(full);
  assert.equal(createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex'),expected,'Actual tracked bytes differ: '+path);
  files.push({path,mode,sha256:createHash('sha256').update(bytes).digest('hex')});
 }
 return {commit:git('rev-parse','HEAD'),tree:git('rev-parse','HEAD^{tree}'),sha256:createHash('sha256').update(JSON.stringify(files)).digest('hex'),files,untrackedPolicy:'Reject non-ignored untracked files; build/dependency/evidence output stays ignored or external.'};
}
