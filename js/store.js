import {safeJSONParse} from './utils.js';
const STORAGE_KEY='ariana-hub-v2-production-state';
const MEMORY=new Map();
const storage={
  get(k){try{return localStorage.getItem(k);}catch{return MEMORY.get(k)||null;}},
  set(k,v){try{localStorage.setItem(k,v);}catch{MEMORY.set(k,String(v));}},
  remove(k){try{localStorage.removeItem(k);}catch{MEMORY.delete(k);}}
};
export const initialState={
  version:3,
  learner:{id:'ariana',name:'Ariana'},
  mastery:{},
  reviews:{},
  session:{route:'home',currentSubject:null,currentUnit:null,currentConcept:null,lessonPhase:'diagnostic',questionIndex:0,mimiOpen:false,lastRoute:'home'},
  history:{attempts:[],lessonProgress:{},recent:[],searches:[]},
  preferences:{largeText:false,highContrast:false,reducedMotion:false,darkMode:false,remindTime:'18:00',readAloudRate:1},
  ui:{sidebarOpen:false,installDismissed:false}
};
function clone(x){return typeof structuredClone==='function'?structuredClone(x):JSON.parse(JSON.stringify(x));}
function merge(saved){
  const b=clone(initialState);if(!saved||typeof saved!=='object')return b;
  return {...b,...saved,
    learner:{...b.learner,...saved.learner},
    session:{...b.session,...saved.session},
    history:{...b.history,...saved.history,attempts:Array.isArray(saved.history?.attempts)?saved.history.attempts:[],recent:Array.isArray(saved.history?.recent)?saved.history.recent:[],searches:Array.isArray(saved.history?.searches)?saved.history.searches:[],lessonProgress:saved.history?.lessonProgress&&typeof saved.history.lessonProgress==='object'?saved.history.lessonProgress:{}},
    preferences:{...b.preferences,...saved.preferences},ui:{...b.ui,...saved.ui},
    mastery:saved.mastery&&typeof saved.mastery==='object'?saved.mastery:{},reviews:saved.reviews&&typeof saved.reviews==='object'?saved.reviews:{}
  };
}
let state=merge(safeJSONParse(storage.get(STORAGE_KEY)));
const listeners=new Set();
function persist(){storage.set(STORAGE_KEY,JSON.stringify(state));}
function notify(action){persist();for(const fn of listeners){try{fn(state,action);}catch(e){console.error('Store listener failed',e);}}}
function withRecent(s,item){const recent=[item,...s.history.recent.filter(x=>x.conceptId!==item.conceptId)].slice(0,12);return {...s,history:{...s.history,recent}};}
export const store={
  getState:()=>state,
  subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);},
  dispatch(action){
    const a=action||{};
    switch(a.type){
      case 'NAVIGATE': state={...state,session:{...state.session,lastRoute:state.session.route,...a.payload}};break;
      case 'START_CONCEPT': state=withRecent({...state,session:{...state.session,lastRoute:state.session.route,route:'concept',currentSubject:a.subjectId,currentUnit:a.unitId,currentConcept:a.conceptId,lessonPhase:a.phase||state.history.lessonProgress[a.conceptId]?.phase||'diagnostic',questionIndex:0}}, {conceptId:a.conceptId,subjectId:a.subjectId,unitId:a.unitId,timestamp:Date.now()});break;
      case 'SET_LESSON_PHASE': state={...state,session:{...state.session,lessonPhase:a.phase,questionIndex:a.questionIndex??0}};break;
      case 'SET_QUESTION_INDEX': state={...state,session:{...state.session,questionIndex:a.index}};break;
      case 'RECORD_ATTEMPT': state={...state,history:{...state.history,attempts:[...state.history.attempts,{...a.attempt,timestamp:a.attempt.timestamp||Date.now()}].slice(-2500)}};break;
      case 'SET_MASTERY': state={...state,mastery:{...state.mastery,[a.conceptId]:{...(state.mastery[a.conceptId]||{}),...a.value,lastUpdated:Date.now()}}};break;
      case 'SAVE_PROGRESS': state={...state,history:{...state.history,lessonProgress:{...state.history.lessonProgress,[a.conceptId]:{...(state.history.lessonProgress[a.conceptId]||{}),...a.progress,lastUpdated:Date.now()}}}};break;
      case 'SCHEDULE_REVIEW': state={...state,reviews:{...state.reviews,[a.conceptId]:{...(state.reviews[a.conceptId]||{}),...a.review}}};break;
      case 'TOGGLE_MIMI': state={...state,session:{...state.session,mimiOpen:a.open??!state.session.mimiOpen}};break;
      case 'SET_PREF': state={...state,preferences:{...state.preferences,[a.key]:a.value}};break;
      case 'UPDATE_PREFS': state={...state,preferences:{...state.preferences,...a.value}};break;
      case 'SET_UI': state={...state,ui:{...state.ui,[a.key]:a.value}};break;
      case 'IMPORT_STATE': state=merge(a.value);break;
      case 'RESET_STATE': state=clone(initialState);storage.remove(STORAGE_KEY);break;
      default: console.warn('Unknown store action',a.type);return state;
    }
    notify(a);return state;
  },
  export(){return JSON.stringify(state,null,2);}
};
window.addEventListener?.('storage',e=>{if(e.key===STORAGE_KEY&&e.newValue){state=merge(safeJSONParse(e.newValue));notify({type:'CROSS_TAB_SYNC'});}});
