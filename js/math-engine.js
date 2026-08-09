// Grade-8-safe math engine: recursive-descent parser + linear-equation transformer.
// No eval(), Function(), or third-party CAS required.
const EPS=1e-12;
function clean(input=''){
  return String(input).replace(/[×·]/g,'*').replace(/÷/g,'/').replace(/[−–—]/g,'-').replace(/²/g,'^2').replace(/³/g,'^3').replace(/\s+/g,' ').trim();
}
function tokenize(s){
  s=clean(s);const raw=[];let i=0;
  while(i<s.length){const ch=s[i];if(/\s/.test(ch)){i++;continue;}
    if(/[0-9.]/.test(ch)){let j=i+1;while(j<s.length&&/[0-9.]/.test(s[j]))j++;const n=s.slice(i,j);if((n.match(/\./g)||[]).length>1)throw new Error('Invalid number');raw.push({t:'num',v:Number(n)});i=j;continue;}
    if(/[a-zA-Z]/.test(ch)){let j=i+1;while(j<s.length&&/[a-zA-Z]/.test(s[j]))j++;raw.push({t:'id',v:s.slice(i,j)});i=j;continue;}
    if('+-*/^()'.includes(ch)){raw.push({t:ch,v:ch});i++;continue;}
    throw new Error(`Unsupported character: ${ch}`);
  }
  // Insert implicit multiplication: 2x, 2(x+1), x(3), )(.
  const out=[];const left=x=>x&&(x.t==='num'||x.t==='id'||x.t===')');const right=x=>x&&(x.t==='num'||x.t==='id'||x.t==='(');
  for(let k=0;k<raw.length;k++){const a=raw[k],b=raw[k+1];out.push(a);if(left(a)&&right(b))out.push({t:'*',v:'*'});}return out;
}
function parseExpression(input){
  const ts=tokenize(input);let p=0;const peek=()=>ts[p],take=t=>{if(peek()?.t===t)return ts[p++];return null;};
  function primary(){if(take('(')){const n=add();if(!take(')'))throw new Error('Missing )');return n;}const n=take('num');if(n)return{k:'num',v:n.v};const id=take('id');if(id)return{k:'var',n:id.v};if(take('+'))return primary();if(take('-'))return{k:'neg',a:primary()};throw new Error('Expected a number, variable, or ( )');}
  function power(){let n=primary();if(take('^'))n={k:'bin',op:'^',a:n,b:power()};return n;}
  function mul(){let n=power();while(peek()&&['*','/'].includes(peek().t)){const op=ts[p++].t;n={k:'bin',op,a:n,b:power()};}return n;}
  function add(){let n=mul();while(peek()&&['+','-'].includes(peek().t)){const op=ts[p++].t;n={k:'bin',op,a:n,b:mul()};}return n;}
  const ast=add();if(p!==ts.length)throw new Error('Could not parse the full expression');return ast;
}
function vars(ast,set=new Set()){if(ast.k==='var')set.add(ast.n);if(ast.a)vars(ast.a,set);if(ast.b)vars(ast.b,set);return set;}
function evaluate(ast,env={}){switch(ast.k){case'num':return ast.v;case'var':if(!(ast.n in env))throw new Error(`Value for ${ast.n} is missing`);return Number(env[ast.n]);case'neg':return-evaluate(ast.a,env);case'bin':{const a=evaluate(ast.a,env),b=evaluate(ast.b,env);if(ast.op==='+')return a+b;if(ast.op==='-')return a-b;if(ast.op==='*')return a*b;if(ast.op==='/'){if(Math.abs(b)<EPS)throw new Error('Division by zero');return a/b;}if(ast.op==='^')return a**b;}default:throw new Error('Unknown expression');}}
// Represent a linear expression as a*x+b. Throws for nonlinear terms.
function linear(ast,v){switch(ast.k){case'num':return{a:0,b:ast.v};case'var':if(ast.n!==v)throw new Error(`This solver currently handles one variable at a time (${v}).`);return{a:1,b:0};case'neg':{const z=linear(ast.a,v);return{a:-z.a,b:-z.b};}case'bin':{const L=linear(ast.a,v),R=linear(ast.b,v);if(ast.op==='+')return{a:L.a+R.a,b:L.b+R.b};if(ast.op==='-')return{a:L.a-R.a,b:L.b-R.b};if(ast.op==='*'){if(Math.abs(L.a)>EPS&&Math.abs(R.a)>EPS)throw new Error('That equation has a variable multiplied by a variable, so it is not linear.');if(Math.abs(R.a)<EPS)return{a:L.a*R.b,b:L.b*R.b};return{a:R.a*L.b,b:R.b*L.b};}if(ast.op==='/'){if(Math.abs(R.a)>EPS)throw new Error('A variable in the denominator is beyond this Grade 8 linear solver.');if(Math.abs(R.b)<EPS)throw new Error('Division by zero');return{a:L.a/R.b,b:L.b/R.b};}if(ast.op==='^'){if(Math.abs(R.a)>EPS)throw new Error('Variable exponents are not supported.');if(Math.abs(L.a)>EPS){if(Math.abs(R.b-1)<EPS)return L;if(Math.abs(R.b)<EPS)return{a:0,b:1};throw new Error('This creates a non-linear power such as x².');}return{a:0,b:L.b**R.b};}break;}default:throw new Error('Unknown expression');}}
function fmt(n){if(Math.abs(n)<EPS)n=0;const r=Math.round(n*1e10)/1e10;return Number.isInteger(r)?String(r):String(r);}
function linText(z,v){const parts=[];if(Math.abs(z.a)>EPS)parts.push((Math.abs(z.a-1)<EPS?'':Math.abs(z.a+1)<EPS?'-':fmt(z.a))+v);if(Math.abs(z.b)>EPS||!parts.length){const b=fmt(Math.abs(z.b));if(parts.length)parts.push((z.b>=0?'+ ':'- ')+b);else parts.push(fmt(z.b));}return parts.join(' ');}
export function solveLinearEquation(input){
  const s=clean(input);const eq=s.split('=');if(eq.length!==2)throw new Error('Write an equation with one = sign.');const left=parseExpression(eq[0]),right=parseExpression(eq[1]);const all=[...new Set([...vars(left),...vars(right)])];if(all.length!==1)throw new Error(all.length?'Use one variable at a time.':'I cannot see a variable in that equation.');const v=all[0];const L=linear(left,v),R=linear(right,v);const A=L.a-R.a,B=R.b-L.b;const steps=[];
  steps.push(`Simplify the left side: ${linText(L,v)}.`);steps.push(`Simplify the right side: ${linText(R,v)}.`);
  if(Math.abs(L.a-R.a)>EPS&&Math.abs(R.a)>EPS)steps.push(`Move the variable terms to one side. This gives ${fmt(A)}${v} = ${fmt(B)}.`);else steps.push(`Move the constant term away from the variable. This gives ${fmt(A)}${v} = ${fmt(B)}.`);
  if(Math.abs(A)<EPS){if(Math.abs(B)<EPS)return{kind:'linear',variable:v,answer:'all real numbers',steps:[...steps,'Both sides are equivalent, so every value of the variable works.'],check:'Identity'};return{kind:'linear',variable:v,answer:'no solution',steps:[...steps,'The variable terms cancel but the constants do not match, so no value works.'],check:'Contradiction'};}
  const x=B/A;steps.push(`Divide both sides by ${fmt(A)}: ${v} = ${fmt(x)}.`);const lv=evaluate(left,{[v]:x}),rv=evaluate(right,{[v]:x});steps.push(`Check: left side = ${fmt(lv)} and right side = ${fmt(rv)}. They match.`);return{kind:'linear',variable:v,answer:x,steps,check:{left:lv,right:rv}};
}
export function evaluateExpression(input,env={}){const ast=parseExpression(clean(input));return{kind:'evaluate',answer:evaluate(ast,env),variables:[...vars(ast)]};}
function percentOf(q){const m=q.match(/([-+]?\d+(?:\.\d+)?)\s*%\s*(?:of|×|\*)\s*([-+]?\d+(?:\.\d+)?)/i);if(!m)return null;const p=+m[1],n=+m[2],ans=p/100*n;return{kind:'percentage',answer:ans,steps:[`${p}% means ${p}/100 = ${fmt(p/100)}.`,`Multiply ${fmt(p/100)} × ${fmt(n)} = ${fmt(ans)}.`]};}
function discount(q){const m=q.match(/(?:discount|sale).*?([$£]?\s*\d+(?:\.\d+)?).*?(\d+(?:\.\d+)?)\s*%|([$£]?\s*\d+(?:\.\d+)?).*?(\d+(?:\.\d+)?)\s*%\s*(?:discount|off)/i);if(!m)return null;const price=Number(String(m[1]||m[3]).replace(/[^\d.]/g,'')),p=+(m[2]||m[4]);const cut=price*p/100,ans=price-cut;return{kind:'discount',answer:ans,steps:[`Find ${p}% of ${fmt(price)}: ${fmt(price)} × ${fmt(p/100)} = ${fmt(cut)}.`,`Subtract the discount: ${fmt(price)} − ${fmt(cut)} = ${fmt(ans)}.`]};}
function simpleInterest(q){const nums=[...q.matchAll(/\d+(?:\.\d+)?/g)].map(x=>+x[0]);if(!/simple interest|interest/i.test(q)||nums.length<3)return null;const [P,r,t]=nums;const I=P*(r/100)*t;return{kind:'simple-interest',answer:I,steps:[`Use I = P × r × t.`,`Convert ${r}% to ${fmt(r/100)}.`,`I = ${fmt(P)} × ${fmt(r/100)} × ${fmt(t)} = ${fmt(I)}.`]};}
function ratioShare(q){const m=q.match(/(?:share|divide).*?(\d+(?:\.\d+)?).*?(\d+)\s*:\s*(\d+)/i);if(!m)return null;const total=+m[1],a=+m[2],b=+m[3],parts=a+b,one=total/parts;return{kind:'ratio',answer:[one*a,one*b],steps:[`Add the ratio parts: ${a}+${b}=${parts}.`,`One part = ${fmt(total)} ÷ ${parts} = ${fmt(one)}.`,`Shares: ${a} parts = ${fmt(one*a)}; ${b} parts = ${fmt(one*b)}.`]};}
function mean(q){const m=q.match(/mean(?: of)?\s*:?\s*([\d.,\s-]+)/i);if(!m)return null;const ns=m[1].split(/[ ,]+/).map(Number).filter(Number.isFinite);if(ns.length<2)return null;const sum=ns.reduce((a,b)=>a+b,0),ans=sum/ns.length;return{kind:'mean',answer:ans,steps:[`Add the values: ${ns.join(' + ')} = ${fmt(sum)}.`,`Divide by the number of values (${ns.length}): ${fmt(sum)} ÷ ${ns.length} = ${fmt(ans)}.`]};}
function gradient(q){const m=q.match(/\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\).*?\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)/);if(!/gradient|slope/i.test(q)||!m)return null;const x1=+m[1],y1=+m[2],x2=+m[3],y2=+m[4];if(x2===x1)return{kind:'gradient',answer:'undefined',steps:['The change in x is 0, so the line is vertical and the gradient is undefined.']};const ans=(y2-y1)/(x2-x1);return{kind:'gradient',answer:ans,steps:[`Use m = (y₂ − y₁)/(x₂ − x₁).`,`m = (${fmt(y2)} − ${fmt(y1)}) / (${fmt(x2)} − ${fmt(x1)}) = ${fmt(ans)}.`]};}
function baseConvert(q){const m=q.match(/\b([0-9a-z]+)\s*(?:base\s*)?(\d+)\s*(?:to|into)\s*(?:base\s*)?(\d+)\b/i);if(!m)return null;const value=m[1].toLowerCase(),from=+m[2],to=+m[3];if(from<2||from>16||to<2||to>16)return null;const dec=parseInt(value,from);if(!Number.isFinite(dec))return null;const ans=dec.toString(to).toUpperCase();return{kind:'base-conversion',answer:ans,steps:[`Convert ${value.toUpperCase()} base ${from} to an ordinary base-10 value: ${dec}.`,`Convert ${dec} from base 10 to base ${to}: ${ans}.`]};}
function area(q){let m;if((m=q.match(/triangle.*?(?:base\s*)?(\d+(?:\.\d+)?).*?(?:height\s*)?(\d+(?:\.\d+)?)/i))){const b=+m[1],h=+m[2],a=.5*b*h;return{kind:'area',answer:a,steps:[`Triangle area = ½ × base × height.`,`½ × ${fmt(b)} × ${fmt(h)} = ${fmt(a)}.`]};}if((m=q.match(/rectangle.*?(\d+(?:\.\d+)?).*?(\d+(?:\.\d+)?)/i))){const l=+m[1],w=+m[2],a=l*w;return{kind:'area',answer:a,steps:[`Rectangle area = length × width.`,`${fmt(l)} × ${fmt(w)} = ${fmt(a)}.`]};}return null;}
export function solveMath(question){
  const q=clean(question);try{
    if(q.includes('='))return solveLinearEquation(q.replace(/^(solve|find\s+\w+)\s*/i,''));
    for(const fn of [percentOf,ratioShare,simpleInterest,discount,mean,gradient,baseConvert,area]){const r=fn(q);if(r)return r;}
    if(/^[0-9a-zA-Z().+\-*/^\s]+$/.test(q)){const r=evaluateExpression(q);if(r.variables.length===0)return{...r,steps:[`Evaluate one operation at a time.`,`The value is ${fmt(r.answer)}.`]};}
  }catch(error){return{kind:'error',error:error.message,steps:[]};}
  return null;
}
export const _internal={clean,tokenize,parseExpression,linear,evaluate};
