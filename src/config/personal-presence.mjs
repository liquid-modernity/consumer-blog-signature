// Application instance configuration; stable semantic IDs do not prescribe routes or providers.
export const personalPresenceConfig = {
 routes:{profile:'/about',author:'/about/author',resume:'/resume',portfolio:'/portfolio',contact:'/about/contact',support:'/about/support',campaign:'/campaign',audience:'/newsletter'},
 // Existing authored links are projected through these compatibility identities without editing content.
 contentRoutes:{'/about':'profile','/about/author':'author','/about/contact':'contact','/about/support':'support'},
 capabilities:[
  {id:'profile',enabled:true,label:{id:'Tentang',en:'About'},route:'profile',order:1,providerBinding:'profile-document',presentationProfile:'document',readable:true,rootNavigation:true,icon:'article'},
  {id:'author',enabled:true,label:{id:'Penulis',en:'Author'},route:'author',order:2,providerBinding:'editorial-authors',presentationProfile:'document',readable:true,rootNavigation:true,icon:'person'},
  {id:'resume',enabled:false,label:{id:'Resume',en:'Resume'},route:'resume',order:3,providerBinding:'unpopulated',presentationProfile:'document',readable:true,rootNavigation:false},
  {id:'portfolio',enabled:false,label:{id:'Portofolio',en:'Portfolio'},route:'portfolio',order:4,providerBinding:'unpopulated',presentationProfile:'index',readable:false,rootNavigation:false},
  {id:'support',enabled:true,label:{id:'Dukungan',en:'Support'},route:'support',order:5,providerBinding:'support-information',presentationProfile:'methods',readable:false,rootNavigation:true,icon:'help'},
  {id:'contact',enabled:true,label:{id:'Kontak',en:'Contact'},route:'contact',order:6,providerBinding:'public-contact',presentationProfile:'methods',readable:false,rootNavigation:true,icon:'mail'},
  {id:'campaign',enabled:false,label:{id:'Kampanye',en:'Campaign'},route:'campaign',order:7,providerBinding:'unpopulated',presentationProfile:'document',readable:false,rootNavigation:false},
  {id:'audience',enabled:false,label:{id:'Langganan',en:'Subscribe'},route:'audience',order:8,providerBinding:'unpopulated',presentationProfile:'methods',readable:false,rootNavigation:false}
 ]
};
