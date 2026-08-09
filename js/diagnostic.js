import {CONCEPTS} from '../data/concepts.js';
import {QUESTIONS} from '../data/questions.js';
import {getMastery} from './mastery.js';
import {shuffle,tokens} from './utils.js';
const byId=Object.fromEntries(CONCEPTS.map(c=>[c.id,c]));
function relevance(c,q){const want=new Set(tokens(c.title+' '+c.summary));const got=new Set(tokens(q.stem+' '+(q.correctAnswer??'')));let n=0;for(const t of want)if(got.has(t))n++;return n;}
export function questionsForConcept(conceptId,count=3){
  const c=byId[conceptId];if(!c)return[];
  let pool=QUESTIONS.filter(q=>q.conceptId===conceptId);
  const add=(arr)=>{for(const q of arr.sort((a,b)=>relevance(c,b)-relevance(c,a)))if(!pool.some(x=>x.id===q.id)&&relevance(c,q)>0)pool.push(q);};
  if(pool.length<count)add(QUESTIONS.filter(q=>q.unitId===c.unitId));
  if(pool.length<count)add(QUESTIONS.filter(q=>q.subjectId===c.subjectId));
  return shuffle(pool,conceptId.length*97).slice(0,count);
}
export function getDiagnosticPlan(conceptId,masteryState={}){
  const c=byId[conceptId];if(!c)return[];const steps=[];
  for(const pid of c.prerequisites||[]){const level=masteryState[pid]?.level||0;if(level<3)steps.push({type:'check-prerequisite',conceptId:pid,title:byId[pid]?.title||pid});}
  steps.push({type:'check-target',conceptId,title:c.title});return steps;
}
export function resolveDiagnostic(conceptId,results,state){
  const c=byId[conceptId];const weak=[];for(const p of c?.prerequisites||[]){const r=results.find(x=>x.conceptId===p);const level=getMastery(p,state).level;if((r&&!r.correct)||level<2)weak.push(p);}
  const target=results.filter(x=>x.conceptId===conceptId);const targetStrong=target.length>=2&&target.filter(x=>x.correct).length/target.length>=.8;
  return{weakPrerequisites:weak,next:weak.length?'foundation':targetStrong?'mastery':'learn'};
}
