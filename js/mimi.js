import {CONCEPTS} from '../data/concepts.js';
import {UNITS} from '../data/curriculum.js';
import {SUBJECTS} from '../data/subjects.js';
import {bestConceptFor} from './search.js';
import {solveMath} from './math-engine.js';
import {buildLessonContent} from './content.js';
const conceptById=Object.fromEntries(CONCEPTS.map(x=>[x.id,x]));const unitById=Object.fromEntries(UNITS.map(x=>[x.id,x]));const subjectById=Object.fromEntries(SUBJECTS.map(x=>[x.id,x]));
function framework(subjectId){return({math:'Work one step at a time, explain why the operation is allowed, and check the result.',english:'Name the instruction, find evidence, answer clearly, then explain how the evidence supports the answer.',science:'State the scientific idea, connect cause and effect, use evidence, then give a conclusion.',social:'Point → Explain → Jamaica/Caribbean example → Link.',geography:'Locate/describe → process → effect → real place example.',history:'Claim → evidence → context → significance.',french:'Meaning → grammar pattern → model sentence → change one part and try again.',spanish:'Meaning → grammar pattern → model sentence → change one part and try again.',it:'Input → Process → Output → safety/accuracy check.',civics:'Civic idea → responsibility → Jamaican example → effect.',resource:'Problem/need → plan → safe action → test → improve.',religion:'Describe accurately → explain meaning → compare respectfully → reflect.',pe:'Purpose → safe technique → practise → improve.',music:'Hear/see → name the element → explain its effect → perform/create.',drama:'Character/scene need → voice/body choice → action → audience effect.',visual:'Observe → choose an element/principle → create/analyse → explain the effect.',career:'Know yourself → research → compare → decide a next step.',hfle:'Notice → think → choose safely → get support when needed.'})[subjectId]||'Define the idea → explain it → give an example → check understanding.';}
function localAnswer(question,context={}){
  const math=solveMath(question);if(math)return{layer:'deterministic-math',concept:null,text:`Here is the step-by-step working:\n${math.steps.map((s,i)=>`${i+1}. ${s}`).join('\n')}\nAnswer: ${Array.isArray(math.answer)?math.answer.join(' and '):math.answer}`};
  let hit=context.conceptId?{id:context.conceptId}:bestConceptFor(question,context.subjectId||null);const c=hit?conceptById[hit.id]:null;
  if(!c){return{layer:'local-retrieval',concept:null,text:'I could not confidently match that question to one Grade 8 concept yet. Try adding the subject or a key school word from the question, and I will narrow it down.'};}
  const u=unitById[c.unitId],s=subjectById[c.subjectId],lesson=buildLessonContent(c,u,s);const q=question.toLowerCase();
  if(c.subjectId==='english'&&/(passage|paragraph|poem|story|extract|evidence|infer|inference)/i.test(q)&&question.trim().length<80){return{layer:'local-retrieval',concept:c,text:`I think this is about ${c.title}. To answer an English comprehension question accurately, I need the passage or the important lines from it. Paste the text, then I’ll help you find the evidence rather than guess.`};}
  const ex=lesson.worked[0];return{layer:'local-retrieval',concept:c,text:`This question matches ${s.name} → ${u.title} → ${c.title}.\n\nStart here: ${lesson.explanation}\n\nMethod: ${framework(c.subjectId)}\n\nExample: ${ex}\n\nYour next step: tell me which part is confusing, or show me your attempt and I’ll help from that exact point.`};
}
async function smartAnswer(question,context,local){
  if(!('LanguageModel'in window))return null;
  try{
    const options={expectedInputs:[{type:'text',languages:['en']}],expectedOutputs:[{type:'text',languages:['en']}]};
    const availability=await window.LanguageModel.availability(options);if(availability==='unavailable')return null;
    const c=local.concept;const u=c?unitById[c.unitId]:null;const s=c?subjectById[c.subjectId]:null;const lesson=c?buildLessonContent(c,u,s):null;
    const session=await window.LanguageModel.create({...options,initialPrompts:[{role:'system',content:`You are Mimi, a patient Grade 8 tutor for Ariana in Jamaica. Be concise but clear. Never pretend a fact is in the curriculum if it is not in the supplied context. For math, show steps. For comprehension, require the passage before claiming evidence. Use age-appropriate language and encourage the learner without being patronizing.`}]});
    const prompt=`Student question: ${question}\nCurrent subject: ${s?.name||context.subjectId||'unknown'}\nUnit: ${u?.title||'unknown'}\nConcept: ${c?.title||'unknown'}\nCurriculum explanation: ${lesson?.explanation||'No exact lesson context found.'}\nFramework: ${c?framework(c.subjectId):'Define → explain → example → next step'}\nStudent attempt: ${context.attempt||'not provided'}\nGive a clear answer, then one small next step.`;
    const text=await session.prompt(prompt);session.destroy?.();return{layer:'chrome-language-model',concept:c,text:String(text)};
  }catch(e){console.warn('Chrome LanguageModel unavailable',e);return null;}
}
export async function askMimi(question,{mode='explain',attempt='',subjectId=null,conceptId=null,preferSmart=true}={}){
  const context={mode,attempt,subjectId,conceptId};const local=localAnswer(question,context);if(preferSmart){const smart=await smartAnswer(question,context,local);if(smart)return smart;}return local;
}
export async function mimiAvailability(){try{if(!('LanguageModel'in window))return{available:false,label:'Local Mimi'};const a=await window.LanguageModel.availability({expectedInputs:[{type:'text',languages:['en']}],expectedOutputs:[{type:'text',languages:['en']}]});return{available:a!=='unavailable',label:a==='available'?'Smart Mimi available':a==='downloadable'?'Smart Mimi can download':'Local Mimi',raw:a};}catch{return{available:false,label:'Local Mimi'};}}
