export const SCHEMA_VERSION='2.1.0-production';
export function validateDataset({subjects,units,concepts,questions}){
  const errors=[],warnings=[];const subjectIds=new Set(subjects.map(x=>x.id));const unitIds=new Set(units.map(x=>x.id));const conceptIds=new Set(concepts.map(x=>x.id));const all=[];
  for(const group of [subjects,units,concepts,questions])for(const x of group){if(all.includes(x.id))errors.push(`Duplicate ID ${x.id}`);else all.push(x.id);}
  for(const u of units){if(!subjectIds.has(u.subjectId))errors.push(`Unit ${u.id} has unknown subject ${u.subjectId}`);if(!u.title)errors.push(`Unit ${u.id} missing title`);}
  for(const c of concepts){
    for(const k of ['id','subjectId','unitId','title'])if(!c[k])errors.push(`Concept missing ${k}: ${c.id||'unknown'}`);
    if(!unitIds.has(c.unitId))errors.push(`Concept ${c.id} has unknown unit ${c.unitId}`);
    for(const p of c.prerequisites||[])if(p&&!conceptIds.has(p))errors.push(`Concept ${c.id} prerequisite missing: ${p}`);
    if(c.contentStatus==='needs-author-review')warnings.push(`${c.id}: teaching text needs author review`);
  }
  for(const q of questions){
    if(!q.id||!q.subjectId||!q.type||!q.stem)errors.push(`Malformed question ${q.id||'unknown'}`);
    if(q.unitId&&!unitIds.has(q.unitId))errors.push(`Question ${q.id}: unknown unit ${q.unitId}`);
    if(q.conceptId&&!conceptIds.has(q.conceptId))errors.push(`Question ${q.id}: unknown concept ${q.conceptId}`);
    if(!q.conceptId)warnings.push(`${q.id}: not concept-linked`);
  }
  return{ok:errors.length===0,errors,warnings};
}
