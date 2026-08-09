import {SUBJECTS} from '../data/subjects.js';import {CONCEPTS} from '../data/concepts.js';import {store} from './store.js';import {getDueReviews} from './scheduler.js';
const conceptsBySubject=CONCEPTS.reduce((m,c)=>((m[c.subjectId]??=[]).push(c),m),{});
export function subjectProgress(subjectId,state=store.getState()){
  const cs=conceptsBySubject[subjectId]||[];if(!cs.length)return{percent:0,mastered:0,total:0,averageLevel:0};let sum=0,mastered=0;for(const c of cs){const level=state.mastery[c.id]?.level||0;sum+=level;if(level>=4)mastered++;}return{percent:Math.round(sum/(cs.length*4)*100),mastered,total:cs.length,averageLevel:sum/cs.length};
}
export function overallProgress(state=store.getState()){
  const total=CONCEPTS.length;let sum=0,mastered=0;for(const c of CONCEPTS){const l=state.mastery[c.id]?.level||0;sum+=Math.min(4,l);if(l>=4)mastered++;}return{percent:total?Math.round(sum/(total*4)*100):0,mastered,total,due:getDueReviews(state).length};
}
export function weakTopics(state=store.getState(),limit=12){
  return CONCEPTS.map(c=>{const m=state.mastery[c.id]||{};return{concept:c,level:m.level||0,score:m.score??null,total:m.total||0};}).filter(x=>x.total>=2&&(x.score<.65||x.level<3)).sort((a,b)=>(a.score??0)-(b.score??0)||b.total-a.total).slice(0,limit);
}
export function progressBySubject(state=store.getState()){return SUBJECTS.map(s=>({subject:s,...subjectProgress(s.id,state)}));}
