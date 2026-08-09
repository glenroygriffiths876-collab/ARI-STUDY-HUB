import {SUBJECTS} from '../data/subjects.js';
import {UNITS} from '../data/curriculum.js';
import {CONCEPTS} from '../data/concepts.js';
import {tokens,normalizeText,unique} from './utils.js';
const subjectById=Object.fromEntries(SUBJECTS.map(x=>[x.id,x]));const unitById=Object.fromEntries(UNITS.map(x=>[x.id,x]));
function scoreText(query,text){const q=unique(tokens(query));if(!q.length)return 0;const t=normalizeText(text);let s=0;for(const word of q){if(t===word)s+=12;else if(t.startsWith(word+' '))s+=8;else if(t.includes(' '+word+' '))s+=5;else if(t.includes(word))s+=2;}return s/q.length;}
export function searchCurriculum(query,{subjectId=null,limit=30}={}){
  const q=normalizeText(query);if(!q)return[];const results=[];
  for(const c of CONCEPTS){if(subjectId&&c.subjectId!==subjectId)continue;const u=unitById[c.unitId],s=subjectById[c.subjectId];const text=[c.title,c.summary,c.explanation,...(c.examples||[]),...(c.vocabulary||[]).map(v=>v.term+' '+v.definition),u?.title,u?.focus,s?.name].join(' ');let score=scoreText(q,text);if(normalizeText(c.title).includes(q))score+=8;if(normalizeText(u?.title||'').includes(q))score+=4;if(score>0)results.push({kind:'concept',id:c.id,title:c.title,subtitle:`${s?.name||''} • ${u?.title||''}`,subjectId:c.subjectId,unitId:c.unitId,score});}
  for(const u of UNITS){if(subjectId&&u.subjectId!==subjectId)continue;let score=scoreText(q,u.title+' '+u.focus+' '+(subjectById[u.subjectId]?.name||''));if(normalizeText(u.title).includes(q))score+=6;if(score>0)results.push({kind:'unit',id:u.id,title:u.title,subtitle:subjectById[u.subjectId]?.name||'',subjectId:u.subjectId,score});}
  return results.sort((a,b)=>b.score-a.score||a.title.localeCompare(b.title)).slice(0,limit);
}
export function bestConceptFor(query,subjectId=null){return searchCurriculum(query,{subjectId,limit:1}).find(x=>x.kind==='concept')||null;}
