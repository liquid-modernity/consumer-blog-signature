export function fixtureConfig(){return {routes:{profile:'/profile',resume:'/resume',portfolio:'/portfolio',contact:'/connect',speaking:'/speaking',author:'/editor',support:'/support-us',campaign:'/initiative',audience:'/subscribe'},capabilities:[
 {id:'profile',enabled:true,label:{id:'Profil',en:'Profile'},route:'profile',order:1,providerBinding:'local',presentationProfile:'document',readable:true,rootNavigation:true},
 {id:'resume',enabled:true,label:{id:'Resume',en:'Resume'},route:'resume',order:2,providerBinding:'local',presentationProfile:'document',readable:true,rootNavigation:true},
 {id:'portfolio',enabled:true,label:{id:'Karya',en:'Work'},route:'portfolio',order:3,providerBinding:'local',presentationProfile:'index',readable:false,rootNavigation:true},
 {id:'contact',enabled:true,label:{id:'Kontak',en:'Connect'},route:'contact',order:4,providerBinding:'local',presentationProfile:'methods',readable:false,rootNavigation:false},
 {id:'author',enabled:true,label:{id:'Penulis',en:'Author'},route:'author',order:5,providerBinding:'local',presentationProfile:'document',readable:true,rootNavigation:false},
 {id:'support',enabled:true,label:{id:'Dukungan',en:'Support'},route:'support',order:6,providerBinding:'local',presentationProfile:'methods',readable:false,rootNavigation:false},
 {id:'campaign',enabled:true,label:{id:'Kampanye',en:'Campaign'},route:'campaign',order:7,providerBinding:'local',presentationProfile:'document',readable:false,rootNavigation:false},
 {id:'audience',enabled:true,label:{id:'Langganan',en:'Subscribe'},route:'audience',order:8,providerBinding:'local',presentationProfile:'methods',readable:false,rootNavigation:false}
]};}
export function fixtureData(id){return {id:'synthetic.person.'+id,title:'Synthetic '+id,summary:'Deterministic fixture, never production content.',sections:[
 {id:'experience',type:'entries',label:{id:'Pengalaman',en:'Experience'},enabled:true,order:1,items:[{id:'first',title:'Synthetic work',summary:'Fixture description',href:'https://fixture.example/work',order:1,enabled:true}]},
 {id:'education',type:'text',label:{id:'Pendidikan',en:'Education'},enabled:true,order:2,text:'Synthetic education'},
 {id:'skills',type:'text',label:{id:'Keahlian',en:'Skills'},enabled:true,order:3,text:'Synthetic skills'}
],links:[{id:'custom',label:{id:'Sumber',en:'Source'},href:'https://fixture.example/source',enabled:true,order:1}]};}
export const fixtureProviders={local:c=>fixtureData(c.id),alternate:c=>({...fixtureData(c.id),title:'Other Person '+c.id,links:[{id:'custom',label:{id:'Hubungi',en:'Connect'},href:'https://alternate.example/connect',enabled:true,order:1}]})};
export function alternateConfig(){const c=fixtureConfig();c.routes.profile='/identity';c.routes.resume='/cv';c.routes.portfolio='/work';c.capabilities.find(x=>x.id==='profile').label={id:'Identitas',en:'Identity'};c.capabilities.find(x=>x.id==='resume').order=0;c.capabilities.find(x=>x.id==='portfolio').enabled=false;for(const x of c.capabilities)x.providerBinding='alternate';return c;}
