import {
 initRailController
} from "./rail-controller";


import {
 applyContext
} from "../context/context-resolver";


document.addEventListener(
 "DOMContentLoaded",
 ()=>{

   applyContext();

   initRailController();

 }
);
