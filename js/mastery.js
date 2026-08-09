import {store} from './store.js';
import {clamp} from './utils.js';
export const MASTERY_LABELS=['Not started','Introduced','Attempted','Practising','Mastered','Extended'];
export function getMastery(conceptId,state=store.getState()){return state.mastery[conceptId]||{level:0,score:0,correct:0,total:0,streak:0};}
export function masteryLabel(level){return MASTERY_LABELS[clamp(Math.round(level||0),0,5)];}
export function isMastered(conceptId,state=store.getState()){return(getMastery(conceptId,state).level||0)>=4;}
export function applyAttempt(conceptId,{correct,phase='practice',confidence=null},state=store.getState()){
  const old=getMastery(conceptId,state);const total=(old.total||0)+1;const right=(old.correct||0)+(correct?1:0);const score=right/total;let level=old.level||0;
  const weight={diagnostic:.6,guided:.8,practice:1,mastery:1.4,review:1.2}[phase]||1;
  if(correct){const streak=(old.streak||0)+1;if(level===0)level=1;if(phase==='diagnostic'&&streak>=2)level=Math.max(level,2);if(phase==='guided')level=Math.max(level,2);if(phase==='practice'&&score>=.65&&total>=2)level=Math.max(level,3);if(phase==='mastery'&&score>=.7&&streak>=2)level=Math.max(level,4);if(phase==='review'&&old.level>=4&&streak>=2)level=5;level=Math.min(5,level+(weight>1.3&&streak>=3?.25:0));return{...old,level:Math.floor(level),score,correct:right,total,streak,lastCorrect:true,lastAttempt:Date.now(),confidence};}
  const streak=0;if(phase==='mastery'&&level>=4)level=3;else if(phase==='practice'&&score<.45&&total>=3)level=Math.max(1,level-1);return{...old,level:clamp(Math.floor(level),0,5),score,correct:right,total,streak,lastCorrect:false,lastAttempt:Date.now(),confidence};
}
export function recordMasteryAttempt(conceptId,result){const next=applyAttempt(conceptId,result);store.dispatch({type:'SET_MASTERY',conceptId,value:next});return next;}
