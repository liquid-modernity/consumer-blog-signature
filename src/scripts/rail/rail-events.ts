type RailName = "left" | "right";


const STORAGE_KEY =
  "gaga-rail-state";


interface RailPreference {

  left: boolean;

  right: boolean;

  pinnedLeft: boolean;

  pinnedRight: boolean;

}


const defaultPreference: RailPreference = {

  left:false,

  right:false,

  pinnedLeft:false,

  pinnedRight:false

};



function readPreference():RailPreference {

  try {

    const value =
      localStorage.getItem(STORAGE_KEY);


    if(!value)
      return defaultPreference;


    return {
      ...defaultPreference,
      ...JSON.parse(value)
    };


  } catch {

    return defaultPreference;

  }

}



function savePreference(
  value:RailPreference
){

 localStorage.setItem(
   STORAGE_KEY,
   JSON.stringify(value)
 );

}



function applyRail(
 rail:RailName,
 expanded:boolean
){

 const root =
 document.documentElement;


 root.dataset[
   `${rail}Rail`
 ] =
 expanded
 ? "expanded"
 : "collapsed";


}



function bindRail(
 element:HTMLElement
){

 const rail =
 element.dataset.gagaRail as RailName;


 const preference =
 readPreference();



 applyRail(
  rail,
  preference[rail]
 );



 element.addEventListener(
  "mouseenter",
  ()=>{

   const state =
   readPreference();


   const pinned =
    rail === "left"
    ? state.pinnedLeft
    : state.pinnedRight;


   if(!pinned)
    applyRail(
      rail,
      true
    );

  });



 element.addEventListener(
  "mouseleave",
  ()=>{

   const state =
   readPreference();


   const pinned =
    rail === "left"
    ? state.pinnedLeft
    : state.pinnedRight;


   if(!pinned)
    applyRail(
      rail,
      false
    );

  });



 element.addEventListener(
  "click",
  ()=>{

    const state =
    readPreference();


    if(rail==="left")
      state.pinnedLeft =
      !state.pinnedLeft;


    if(rail==="right")
      state.pinnedRight =
      !state.pinnedRight;


    savePreference(state);

  });

}



export function initRailEvents(){

 document
 .querySelectorAll<HTMLElement>(
   "[data-gaga-rail]"
 )
 .forEach(bindRail);

}
