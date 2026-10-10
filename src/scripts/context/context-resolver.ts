
export type PageContext =
  | "landing"
  | "article"
  | "topic"
  | "archive"
  | "library"
  | "search"
  | "default";


export function resolvePageContext():
PageContext {

  const path =
    window.location.pathname;


  if(path === "/landing")
    return "landing";


  if(path.startsWith("/topics"))
    return "topic";


  if(path.startsWith("/archive"))
    return "archive";


  if(path.startsWith("/library"))
    return "library";


  if(path.startsWith("/search"))
    return "search";


  if(
    path.split("/")
      .filter(Boolean)
      .length === 1
  )
    return "article";


  return "default";
}


export function applyContext(){

 const context =
   resolvePageContext();


 document.documentElement.dataset.pageContext =
   context;

}

