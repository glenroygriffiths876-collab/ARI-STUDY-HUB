import {CONCEPTS} from '../data/concepts.js';
import {UNITS} from '../data/curriculum.js';
import {SUBJECTS} from '../data/subjects.js';
import {QUESTIONS} from '../data/questions.js';
import {store} from './store.js';
import {make,esc,announce,shuffle,formatDate,tokens} from './utils.js';
import {buildLessonContent} from './content.js';
import {questionsForConcept,getDiagnosticPlan} from './diagnostic.js';
import {checkAnswer} from './answer-checker.js';
import {recordMasteryAttempt,getMastery,masteryLabel} from './mastery.js';
import {scheduleReview,nextReviewFor} from './scheduler.js';

const conceptById=Object.fromEntries(CONCEPTS.map(x=>[x.id,x]));
const unitById=Object.fromEntries(UNITS.map(x=>[x.id,x]));
const subjectById=Object.fromEntries(SUBJECTS.map(x=>[x.id,x]));

function stageLabel(phase){return({diagnostic:'Quick check',learn:'Learn',guided:'Try with me',practice:'Practise',mastery:'Mastery check',complete:'Complete'})[phase]||phase;}
function questionKey(q){return q.id||q.stem;}
function ensureQuestion(q,c,kind='short'){
  if(q)return q;
  const required=(c.title||'').split(/\s+/).filter(w=>w.length>4).slice(0,2);
  return{id:`generated-${c.id}-${kind}`,conceptId:c.id,subjectId:c.subjectId,type:'short',stem:`In your own words, what is the main idea of “${c.title}”?`,correctAnswer:c.summary||c.title,requiredIdeas:required,acceptableAlternatives:[],misconceptions:[],feedback:{correct:'Good — you captured the main idea.',incorrect:'Use the lesson definition and explain the idea, not just the topic name.'}};
}
function relevantQuestions(c,count=8){
  const want=new Set(tokens(c.title+' '+c.summary));const score=q=>{const got=new Set(tokens(q.stem+' '+(q.correctAnswer??'')));let n=0;for(const t of want)if(got.has(t))n++;return n;};
  let pool=QUESTIONS.filter(q=>q.conceptId===c.id);
  const add=arr=>{for(const q of arr.sort((a,b)=>score(b)-score(a)))if(!pool.some(x=>x.id===q.id)&&score(q)>0)pool.push(q);};
  if(pool.length<count)add(QUESTIONS.filter(q=>q.unitId===c.unitId));
  if(pool.length<count)add(QUESTIONS.filter(q=>q.subjectId===c.subjectId));
  return shuffle(pool,c.id.length*137).slice(0,count);
}
function progressFor(c){return store.getState().history.lessonProgress[c.id]||{};}
function save(c,patch){store.dispatch({type:'SAVE_PROGRESS',conceptId:c.id,progress:{...progressFor(c),...patch}});}
function setPhase(c,phase){save(c,{phase});store.dispatch({type:'SET_LESSON_PHASE',phase});}
function card(title,body,{className=''}={}){return make('section',{class:`lesson-card ${className}`},[make('h2',{text:title}),body]);}
function para(text,className=''){return make('p',{class:className,text});}
function button(text,onClick,{className='',ariaLabel=''}={}){const b=make('button',{type:'button',class:`btn ${className}`,text});if(ariaLabel)b.setAttribute('aria-label',ariaLabel);b.addEventListener('click',onClick);return b;}
function readButton(node){return button('🔊 Read this',()=>{try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(node.innerText);u.rate=store.getState().preferences.readAloudRate||1;speechSynthesis.speak(u);}catch{announce('Read aloud is not available in this browser.');}},{className:'subtle'});}
function phaseBar(c,phase){
  const phases=['diagnostic','learn','guided','practice','mastery','complete'];const idx=Math.max(0,phases.indexOf(phase));const wrap=make('div',{class:'lesson-progress','aria-label':`Lesson stage: ${stageLabel(phase)}`});
  wrap.append(make('div',{class:'lesson-progress-line'},make('span',{style:`width:${Math.round(idx/(phases.length-1)*100)}%`})));
  wrap.append(make('div',{class:'lesson-progress-label',text:`${idx+1} of ${phases.length} • ${stageLabel(phase)}`}));return wrap;
}
function header(c,u,s,phase){const h=make('header',{class:'lesson-head'});const crumb=make('div',{class:'crumb'});const sb=button(`← ${s.name}`,()=>{location.hash=`#subject/${encodeURIComponent(s.id)}`},{className:'subtle'});crumb.append(sb,make('span',{text:`${u.term} • ${u.title}`}));h.append(crumb,make('div',{class:'kicker',text:s.name}),make('h1',{text:c.title}),phaseBar(c,phase));return h;}
function masteryBadge(c){const m=getMastery(c.id);return make('div',{class:`mastery-badge level-${m.level||0}`,text:`Mastery ${m.level||0}/5 • ${masteryLabel(m.level||0)}`});}
function answerControl(q,onSubmit){
  const box=make('div',{class:'answer-box'});let input;
  if(q.type==='mcq'&&Array.isArray(q.options)){
    input=make('fieldset',{class:'choices'});input.append(make('legend',{text:'Choose one answer'}));q.options.forEach((opt,i)=>{const id=`q-${Math.random().toString(36).slice(2)}-${i}`;const radio=make('input',{type:'radio',name:'answer',value:String(opt),id});const label=make('label',{for:id,class:'choice'},[radio,make('span',{text:String(opt)})]);input.append(label);});box.append(input);
  }else input=make('textarea',{rows:3,placeholder:q.type==='numeric'?'Enter your number or fraction':'Write your answer in your own words','aria-label':'Your answer'}),box.append(input);
  const feedback=make('div',{class:'inline-feedback','aria-live':'polite'});const submit=button('Check answer',()=>{let value;if(q.type==='mcq')value=input.querySelector('input:checked')?.value||'';else value=input.value;const result=checkAnswer(value,q);feedback.className=`inline-feedback ${result.correct?'is-correct':'is-incorrect'}`;feedback.textContent=result.feedback;onSubmit(result,value,feedback,submit);},{className:'primary'});box.append(make('div',{class:'actions'},submit),feedback);return box;
}
function renderDiagnostic(container,c,u,s){
  const state=store.getState(),plan=getDiagnosticPlan(c.id,state.mastery);const p=progressFor(c);const queue=[];
  for(const step of plan){const qs=questionsForConcept(step.conceptId,step.type==='check-target'?2:1);for(const q of qs)queue.push({...q,_diagnosticConceptId:step.conceptId,_diagnosticTitle:conceptById[step.conceptId]?.title||c.title});}
  if(!queue.length)queue.push(ensureQuestion(null,c));const idx=Math.min(p.diagnosticIndex||0,queue.length-1),q=queue[idx];
  const intro=make('div');intro.append(para('Before the lesson, answer a few short questions. This is not a test grade. It helps the Hub decide whether to teach a missing foundation or move ahead.'),make('div',{class:'mini-status',text:`Question ${idx+1} of ${queue.length} • ${q._diagnosticTitle||c.title}`}));
  const qcard=card('Quick check',make('div',{},[make('p',{class:'question-stem',text:q.stem}),answerControl(q,(result,value,feedback,submit)=>{submit.disabled=true;store.dispatch({type:'RECORD_ATTEMPT',attempt:{conceptId:q._diagnosticConceptId||c.id,questionId:questionKey(q),phase:'diagnostic',correct:result.correct,response:value}});recordMasteryAttempt(q._diagnosticConceptId||c.id,{correct:result.correct,phase:'diagnostic'});const results=[...(p.diagnosticResults||[]),{conceptId:q._diagnosticConceptId||c.id,correct:result.correct}];const next=idx+1;save(c,{diagnosticResults:results,diagnosticIndex:next});const action=button(next<queue.length?'Next quick check':'Continue',()=>{if(next<queue.length)renderLesson(container,c.id);else{const weak=[...new Set(results.filter(x=>x.conceptId!==c.id&&!x.correct).map(x=>x.conceptId))];save(c,{weakPrerequisites:weak,diagnosticComplete:true});setPhase(c,weak.length?'learn':results.filter(x=>x.conceptId===c.id).length>=2&&results.filter(x=>x.conceptId===c.id&&x.correct).length>=2?'guided':'learn');renderLesson(container,c.id);}},{className:'primary'});feedback.after(action);} )]));
  container.append(card('Why this starts with a quick check',intro),qcard);
}
function learnStages(c,u,s,lesson){
  const stages=[];
  stages.push({title:'Start with the meaning',render:()=>{const d=make('div');d.append(para(lesson.intro,'lead'),para(lesson.explanation));return d;}});
  stages.push({title:'Words that make the lesson easier',render:()=>{const grid=make('div',{class:'vocab-grid'});lesson.vocabulary.forEach(v=>{const item=make('article',{class:'vocab-card'});item.append(make('h3',{text:v.term}),para(v.definition));if(v.memory)item.append(make('p',{class:'memory',text:`Remember: ${v.memory}`}));grid.append(item);});return grid;}});
  stages.push({title:'See the idea as a chain',render:()=>{const d=make('div');d.append(para(lesson.framework.why));const ol=make('ol',{class:'chain'});lesson.chain.forEach(x=>ol.append(make('li',{text:x})));d.append(ol,make('div',{class:'framework',text:`Subject method: ${lesson.framework.label}`}));return d;}});
  stages.push({title:'See it visually',render:()=>{const d=make('div',{class:'visual-wrap'});const svg=make('div',{class:'svg-box'});svg.innerHTML=lesson.visual;d.append(svg,para('Use the picture to explain the relationship in your own words. The diagram is built into the app and works offline.','caption'));return d;}});
  stages.push({title:'Watch the idea being used',render:()=>{const d=make('div');lesson.worked.forEach((x,i)=>{const ex=make('article',{class:'worked'});ex.append(make('span',{class:'number-badge',text:String(i+1)}),para(x));d.append(ex);});return d;}});
  stages.push({title:'Connect it to Jamaica or everyday life',render:()=>make('div',{},[para(lesson.jamaica),make('p',{class:'caption',text:'The local example is here to make the idea concrete. The rule or concept still has to be explained accurately.'})])});
  stages.push({title:'Mistakes to avoid',render:()=>{const d=make('div');lesson.mistakes.forEach(m=>{const x=make('article',{class:'mistake'});x.append(make('strong',{text:`Watch out: ${m.mistake}`}),para(`Fix it: ${m.correction}`));d.append(x);});return d;}});
  return stages;
}
function renderLearn(container,c,u,s){const lesson=buildLessonContent(c,u,s),p=progressFor(c),stages=learnStages(c,u,s,lesson);let idx=Math.min(p.learnIndex||0,stages.length-1);const stage=stages[idx],body=stage.render();const ccard=card(stage.title,body,{className:'learning-stage'});const tools=make('div',{class:'actions between'});tools.append(idx>0?button('← Previous',()=>{save(c,{learnIndex:idx-1});renderLesson(container,c.id);}):make('span'));
  tools.append(readButton(body));tools.append(button(idx<stages.length-1?'Next idea →':'Try one with me →',()=>{if(idx<stages.length-1){save(c,{learnIndex:idx+1});renderLesson(container,c.id);}else{setPhase(c,'guided');renderLesson(container,c.id);}},{className:'primary'}));container.append(ccard,tools);
}
function renderQuestionPhase(container,c,{phase,title,description,count,nextPhase}){const p=progressFor(c);const all=relevantQuestions(c,Math.max(count+3,8));const used=p[`${phase}QuestionIds`]||[];let chosen=all.filter(q=>!used.includes(q.id)).slice(0,count);if(chosen.length<count)chosen=all.slice(0,count);if(!chosen.length)chosen=[ensureQuestion(null,c)];const idx=Math.min(p[`${phase}Index`]||0,chosen.length-1),q=chosen[idx];container.append(card(title,make('div',{},[para(description),make('div',{class:'mini-status',text:`Question ${idx+1} of ${chosen.length}`}),make('p',{class:'question-stem',text:q.stem}),answerControl(q,(result,value,feedback,submit)=>{submit.disabled=true;store.dispatch({type:'RECORD_ATTEMPT',attempt:{conceptId:c.id,questionId:q.id,phase,correct:result.correct,response:value}});recordMasteryAttempt(c.id,{correct:result.correct,phase});const ids=[...new Set([...(p[`${phase}QuestionIds`]||[]),q.id])];const next=idx+1;save(c,{[`${phase}QuestionIds`]:ids,[`${phase}Index`]:next});const action=button(next<chosen.length?'Next question':phase==='mastery'?'Finish mastery check':'Continue',()=>{if(next<chosen.length)renderLesson(container,c.id);else{if(phase==='mastery'){const recent=store.getState().history.attempts.filter(a=>a.conceptId===c.id&&a.phase==='mastery').slice(-chosen.length);const passed=recent.length&&recent.filter(x=>x.correct).length/recent.length>=.67;recordMasteryAttempt(c.id,{correct:passed,phase:'mastery'});scheduleReview(c.id,{correct:passed,quality:passed?4:2});setPhase(c,'complete');}else setPhase(c,nextPhase);renderLesson(container,c.id);}},{className:'primary'});feedback.after(action);} )])));
}
function renderComplete(container,c,u,s){const m=getMastery(c.id),next=nextReviewFor(c.id);const body=make('div');body.append(make('div',{class:'celebrate',text:m.level>=4?'🎉 Mastery reached':'💜 Lesson complete — keep practising'}),para(`Current mastery: ${m.level}/5 (${masteryLabel(m.level)}).`),para(next?`Next review is scheduled for ${formatDate(next)}.`:'A review will be scheduled when you complete the mastery check.'));
  const actions=make('div',{class:'actions'});actions.append(button('Review this concept again',()=>{save(c,{practiceIndex:0,masteryIndex:0});setPhase(c,'learn');renderLesson(container,c.id);}),button('Back to subject',()=>{location.hash=`#subject/${encodeURIComponent(s.id)}`;},{className:'primary'}));body.append(actions);container.append(card('What happens next',body));}
export function renderLesson(container,conceptId){container.replaceChildren();const c=conceptById[conceptId];if(!c){container.append(card('Lesson not found',para('This concept could not be loaded.')));return;}const u=unitById[c.unitId],s=subjectById[c.subjectId];const p=progressFor(c);const phase=p.phase||store.getState().session.lessonPhase||'diagnostic';container.append(header(c,u,s,phase));const meta=make('div',{class:'lesson-meta'},[masteryBadge(c),make('button',{type:'button',class:'btn subtle',text:'💜 Ask Mimi about this lesson'})]);meta.lastElementChild.addEventListener('click',()=>store.dispatch({type:'TOGGLE_MIMI',open:true}));container.append(meta);
  try{if(phase==='diagnostic')renderDiagnostic(container,c,u,s);else if(phase==='learn')renderLearn(container,c,u,s);else if(phase==='guided')renderQuestionPhase(container,c,{phase:'guided',title:'Try one with me',description:'Use the lesson method. You can check your answer immediately, and the feedback stays on screen.',count:2,nextPhase:'practice'});else if(phase==='practice')renderQuestionPhase(container,c,{phase:'practice',title:'Independent practice',description:'Now try several questions with less help. The Hub records accuracy so weak topics can return later for review.',count:5,nextPhase:'mastery'});else if(phase==='mastery')renderQuestionPhase(container,c,{phase:'mastery',title:'Mastery check',description:'These final questions check whether you can use the idea without copying the worked example.',count:3,nextPhase:'complete'});else renderComplete(container,c,u,s);}catch(e){console.error(e);container.append(card('This lesson hit a problem',make('div',{},[para('The rest of the Hub is still available. You can return to the subject or ask Mimi for help.'),make('pre',{class:'error-detail',text:e.message})])));}
  save(c,{phase});
}
