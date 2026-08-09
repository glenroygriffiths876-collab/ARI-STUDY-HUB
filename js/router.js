import {store} from './store.js';
const parse=()=>{
  const raw=(location.hash||'#home').slice(1);const parts=raw.split('/').filter(Boolean);const route=parts[0]||'home';
  if(route==='subject'&&parts[1])return{route:'subject',currentSubject:decodeURIComponent(parts[1])};
  if(route==='unit'&&parts[1])return{route:'unit',currentUnit:decodeURIComponent(parts[1])};
  if(route==='concept'&&parts[1])return{route:'concept',currentConcept:decodeURIComponent(parts[1])};
  return{route};
};
let syncing=false;
export function navigate(route,id=null,{replace=false}={}){
  const hash='#'+route+(id?'/'+encodeURIComponent(id):'');
  if(replace)history.replaceState(null,'',hash);else if(location.hash!==hash)location.hash=hash;else syncFromHash();
}
export function syncFromHash(){if(syncing)return;syncing=true;store.dispatch({type:'NAVIGATE',payload:parse()});syncing=false;}
export function conceptRoute(c){location.hash='#concept/'+encodeURIComponent(c.id);store.dispatch({type:'START_CONCEPT',subjectId:c.subjectId,unitId:c.unitId,conceptId:c.id});}
window.addEventListener('hashchange',syncFromHash);
