export const $=(s,r=document)=>r.querySelector(s);
export const $$=(s,r=document)=>[...r.querySelectorAll(s)];
export const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
export const now=()=>Date.now();
export const DAY=86400000;
export function esc(value=''){return String(value).replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));}
export function normalizeText(value=''){
  return String(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’‘]/g,"'").replace(/[^a-z0-9%./+\-\s]/g,' ').replace(/\s+/g,' ').trim();
}
export function tokens(value=''){
  const stop=new Set(['a','an','the','is','are','was','were','to','of','and','or','in','on','at','for','with','from','that','this','it','as','be','by','into','than','then','can','will','would','should']);
  return normalizeText(value).split(' ').filter(x=>x.length>1&&!stop.has(x));
}
export function unique(arr){return [...new Set(arr)];}
export function shuffle(arr,seed=Date.now()){
  const out=[...arr]; let x=(seed>>>0)||1;
  const rand=()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296;};
  for(let i=out.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[out[i],out[j]]=[out[j],out[i]];}
  return out;
}
export function formatDate(ts){if(!ts)return 'Not yet';return new Intl.DateTimeFormat('en-JM',{dateStyle:'medium'}).format(new Date(ts));}
export function formatDateTime(ts){if(!ts)return 'Not yet';return new Intl.DateTimeFormat('en-JM',{dateStyle:'medium',timeStyle:'short'}).format(new Date(ts));}
export function downloadText(filename,text,type='text/plain'){
  const blob=new Blob([text],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export function readFile(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsText(file);});}
export function debounce(fn,ms=180){let t;return(...args)=>{clearTimeout(t);t=setTimeout(()=>fn(...args),ms);};}
export function setText(el,text){if(el)el.textContent=text;return el;}
export function make(tag,attrs={},children=[]){
  const el=document.createElement(tag);
  for(const [k,v] of Object.entries(attrs||{})){
    if(v===undefined||v===null)continue;
    if(k==='class')el.className=v;else if(k==='text')el.textContent=v;else if(k.startsWith('aria-'))el.setAttribute(k,v);else if(k==='dataset')Object.assign(el.dataset,v);else if(k in el)el[k]=v;else el.setAttribute(k,v);
  }
  for(const child of Array.isArray(children)?children:[children]){if(child===null||child===undefined)continue;el.append(child?.nodeType?child:document.createTextNode(String(child)));}
  return el;
}
export function focusMain(){requestAnimationFrame(()=>document.querySelector('#main')?.focus({preventScroll:true}));}
export function safeJSONParse(text,fallback=null){try{return JSON.parse(text);}catch{return fallback;}}
export function slug(s=''){return normalizeText(s).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}
export function announce(message){const el=document.querySelector('#liveRegion');if(!el)return;el.textContent='';requestAnimationFrame(()=>{el.textContent=message;});}
