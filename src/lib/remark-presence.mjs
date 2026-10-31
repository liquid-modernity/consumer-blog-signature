import {presence} from './presence.ts';
import {personalPresenceConfig} from '../config/personal-presence.mjs';
// Project existing editorial links through active registry identities; source Markdown stays immutable.
export function projectPresenceLinks(tree,registry=presence,aliases=personalPresenceConfig.contentRoutes){
 for(const node of tree.children??[]){
  if(node.type==='link'&&typeof node.url==='string'){
   const [path,fragment]=node.url.split('#'),id=aliases[path];
   if(id){const target=registry.route(id);if(target)node.url=target+(fragment?'#'+fragment:'');else{node.type='emphasis';delete node.url;delete node.title;}}
  }
  projectPresenceLinks(node,registry,aliases);
 }
 return tree;
}
export function remarkPresenceLinks(){return tree=>projectPresenceLinks(tree);}
