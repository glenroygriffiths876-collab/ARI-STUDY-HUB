import {normalizeText,tokens,unique} from './utils.js';
const SYNONYMS={
  increase:['increase','rise','grow','higher','more'],decrease:['decrease','fall','drop','lower','less'],
  because:['because','since','as','therefore','so'],evidence:['evidence','clue','proof','detail','support'],
  infer:['infer','inference','conclude','conclusion','figure','deduce'],inference:['infer','inference','conclude','conclusion','deduce'],variable:['variable','factor'],
  flat:['flat','level','plain','gentle'],steep:['steep','sloping','mountainous','hilly'],
  road:['road','transport','access','route'],settlement:['settlement','town','village','city','community'],
  money:['money','cost','price','dollar','jmd']
};
function parseNumber(value){
  let s=normalizeText(value).replace(/,/g,'').trim();if(!s)return NaN;
  if(/^[-+]?\d+(\.\d+)?%$/.test(s))return parseFloat(s)/100;
  const frac=s.match(/^([-+]?\d+(?:\.\d+)?)\s*\/\s*([-+]?\d+(?:\.\d+)?)$/);if(frac&&+frac[2]!==0)return +frac[1]/+frac[2];
  const n=Number(s);return Number.isFinite(n)?n:NaN;
}
function groupTokens(idea,question){
  const base=tokens(idea);const out=new Set(base);
  for(const alt of question.acceptableAlternatives||[]){
    const key=normalizeText(alt.idea||'');if(key===normalizeText(idea)||base.some(t=>key.includes(t))){for(const s of alt.synonyms||[])for(const t of tokens(s))out.add(t);}
  }
  for(const t of [...out])for(const [root,vals] of Object.entries(SYNONYMS))if(t===root||vals.includes(t)){out.add(root);vals.forEach(v=>out.add(v));}
  return [...out];
}
function misconceptionHit(student,question){
  const s=normalizeText(student);for(const m of question.misconceptions||[]){const n=normalizeText(m);if(n&&s.includes(n))return m;}return null;
}
export function checkAnswer(studentAnswer,question){
  const raw=String(studentAnswer??'').trim();if(!raw)return{correct:false,feedback:'Write an answer first. A short answer is fine.',matchedIdeas:[],missingIdeas:question.requiredIdeas||[]};
  const misconception=misconceptionHit(raw,question);if(misconception)return{correct:false,feedback:`That answer includes an idea that does not fit here: “${misconception}”. Try again and focus on the relationship the question is asking about.`,matchedIdeas:[],misconception};
  if(question.type==='mcq'){
    const options=question.options||[];let correctValue=question.correctAnswer;
    if(Number.isInteger(correctValue)&&options[correctValue]!==undefined)correctValue=options[correctValue];
    const ok=normalizeText(raw)===normalizeText(correctValue)||String(raw)===String(correctValue);
    return{correct:ok,feedback:ok?(question.feedback?.correct||'Correct — good reasoning.'):(question.feedback?.incorrect||`Not yet. The best answer is ${correctValue}.`),matchedIdeas:ok?[String(correctValue)]:[]};
  }
  if(question.type==='numeric'){
    const got=parseNumber(raw);const expected=parseNumber(question.correctAnswer);const tol=Number.isFinite(question.numericTolerance)?question.numericTolerance:0.01;
    const ok=Number.isFinite(got)&&Number.isFinite(expected)&&Math.abs(got-expected)<=tol;
    return{correct:ok,feedback:ok?(question.feedback?.correct||'Correct. Your value is within the accepted range.'):(question.feedback?.incorrect||`Check the calculation and units. Expected about ${question.correctAnswer}.`),matchedIdeas:ok?[String(question.correctAnswer)]:[]};
  }
  const st=new Set(tokens(raw));const required=(question.requiredIdeas||[]).filter(Boolean);const groups=required.map(idea=>({idea,variants:groupTokens(idea,question)}));
  const matched=groups.filter(g=>g.variants.some(t=>st.has(t))).map(g=>g.idea);const missing=groups.filter(g=>!matched.includes(g.idea)).map(g=>g.idea);
  const expectedTokens=tokens(question.correctAnswer||'');const expectedMatches=expectedTokens.filter(t=>st.has(t));
  const requiredRatio=groups.length?matched.length/groups.length:0;const expectedRatio=expectedTokens.length?expectedMatches.length/expectedTokens.length:0;
  const normalized=normalizeText(raw),expected=normalizeText(question.correctAnswer||'');
  const exactish=expected&&((normalized.includes(expected)&&expected.length>3)||(expected.includes(normalized)&&normalized.length>5));
  const threshold=groups.length>=4?.6:groups.length>=2?.67:1;
  const correct=exactish||(groups.length>0&&requiredRatio>=threshold)||(groups.length===0&&expectedRatio>=.7);
  let feedback;
  if(correct)feedback=question.feedback?.correct||`Yes. You included the key idea${matched.length>1?'s':''}: ${matched.join(', ')||'the required meaning'}.`;
  else if(matched.length)feedback=`You have part of it: ${matched.join(', ')}. Add ${missing.slice(0,2).join(' and ')||'the missing idea'} and explain how the ideas connect.`;
  else feedback=question.feedback?.incorrect||'Not yet. Use the lesson idea, give a reason, and add a specific example if the question asks for one.';
  return{correct,feedback,matchedIdeas:unique(matched),missingIdeas:unique(missing)};
}
export function numericValue(value){return parseNumber(value);}
