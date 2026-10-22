import fs from 'node:fs';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {getDb,REPO_ROOT} from './lib/db.mjs';
import {parseCsv} from './lib/csv.mjs';
import {table as textTable} from './lib/format.mjs';
import {page,table,writeOut} from './lib/render.mjs';

export const usage={
 help:'Show commands',suppliers:'List suppliers','add-supplier':'--name=NAME --owner=NAME --actor=NAME',
 specs:'List current specifications',show:'SPEC', 'add-spec':'--code=CODE --name=NAME --supplier=NAME --owner=NAME --material=TEXT --mass=GRAMS --recycled=PERCENT --food-contact=yes|no --use=TEXT --source=TEXT --review-due=DATE --actor=NAME --reason=TEXT',
 revise:'SPEC; same revision fields as add-spec, no identity fields',evidence:'SPEC', 'add-evidence':'SPEC --kind=food-contact|recycled-content --reference=TEXT --until=DATE --note=TEXT --actor=NAME',
 review:'SPEC --decision=approved|changes --note=TEXT --actor=NAME', 'spec-review':'Weekly specification review queue',
 'supplier-chase':'Missing or expired supplier evidence', 'change-impact':'SPEC', products:'List products',
 'add-product':'--code=CODE --name=NAME --owner=NAME --actor=NAME', 'link-component':'PRODUCT --spec=SPEC --quantity=NUMBER --actor=NAME',
 'pack-check':'PRODUCT; current readiness findings', 'material-rollup':'Nominal component mass per pack, not a regulatory return',
 actions:'List open actions','add-action':'SPEC --title=TEXT --owner=NAME --due=DATE --actor=NAME',
 'close-action':'ACTION_ID --evidence=TEXT --actor=NAME',log:'SPEC --note=TEXT --actor=NAME',
 history:'SPEC',compliance:'Evidence checks against cited principles and house rules',attention:'Overdue work and missing reviews',insights:'Ten cross-record questions',
 'draft-supplier-request':'SPEC; local HTML only','weekly-review':'Local HTML review from three views',
 release:'PRODUCT --actor=NAME; checked immutable internal snapshot',releases:'Saved internal snapshots',
 import:'specright FILE.csv --map=FILE.json --source=TEXT --actor=NAME [--dry-run]',imports:'Import receipts',export:'--out=FILE.json'
};
const mutable=new Set(['add-supplier','add-spec','revise','add-evidence','review','add-product','link-component','add-action','close-action','log','release','import']);
const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
export const hash=v=>createHash('sha256').update(typeof v==='string'?v:JSON.stringify(canonical(JSON.parse(JSON.stringify(v))))).digest('hex');
const text=(v,label)=>{if(typeof v!=='string'||!v.trim())throw Error(`${label} is required`);return v.trim();};
export function date(v){v=text(v,'Date');if(!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v)throw Error('Date must be a valid YYYY-MM-DD');return v;}
export function decimal(v,{zero=false,max=9999999999}={}){v=text(v,'Decimal');if(!/^\d+(?:\.\d{1,4})?$/.test(v)||!Number.isFinite(Number(v))||Number(v)>max||(zero?Number(v)<0:Number(v)<=0))throw Error('Expected a positive decimal with at most four places (zero allowed only for percentages)');return v;}
const yesno=v=>{if(!['yes','no'].includes(v))throw Error('food-contact must be yes or no');return v==='yes';};
const actor=o=>text(o.actor,'actor');
const audit=(db,o,event,id,detail)=>db.query('insert into audit_events(actor,event,entity_id,detail) values($1,$2,$3,$4)',[actor(o),event,id,detail]);
export async function resolve(db,kind,value){
 if(!['suppliers','specs','products','actions'].includes(kind))throw Error('Invalid record kind');
 value=text(value,kind);const name=kind==='actions'?'title':'name';
 const rows=await db.query(`select * from ${kind} where lower(${name})=lower($1) ${['specs','products'].includes(kind)?'or lower(code)=lower($1)':''} or starts_with(id::text,lower($1)) order by id`,[value]);
 if(rows.length!==1)throw Error(`${rows.length?'Ambiguous':'No matching'} ${kind}: ${value}${rows.length?'\n'+rows.map(r=>`${r.id} ${r[name]}`).join('\n'):''}`);
 return rows[0];
}
async function current(db,value,lock=false){const s=await resolve(db,'specs',value);if(lock)await db.query('select id from specs where id=$1 for update',[s.id]);return (await db.query('select * from current_specs where id=$1',[s.id]))[0];}
function revision(o){return {material:text(o.material,'material'),mass_g:decimal(o.mass),recycled_percent:decimal(o.recycled,{zero:true,max:100}),food_contact:yesno(o['food-contact']),intended_use:text(o.use,'use'),source:text(o.source,'source'),review_due:date(o['review-due']),editor:actor(o),reason:text(o.reason,'reason')};}
async function insertRevision(db,id,version,r){return (await db.query(`insert into revisions(spec_id,version,material,mass_g,recycled_percent,food_contact,intended_use,source,review_due,editor,reason) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) returning *`,[id,version,...Object.values(r)]))[0];}
async function packCheck(db,p){
 const parts=await db.query('select * from product_impact where product_id=$1 order by spec_code',[p.id]);
 const findings=await db.query('select f.* from compliance_findings f join components c on c.spec_id=f.id where c.product_id=$1 order by f.code,f.rule',[p.id]);
 if(!parts.length)findings.push({code:p.code,rule:'EMPTY',issue:'Product has no packaging components'});
 return {product:p,parts,findings,ready:findings.length===0};
}
export async function run(db,cmd,args=[],o={}){
 if(!Object.hasOwn(usage,cmd))throw Error(`Unknown command: ${cmd}`);
 if(o['dry-run']!==undefined&&o['dry-run']!==true)throw Error('--dry-run is a boolean flag');
 if(mutable.has(cmd)){
  actor(o);await db.exec('BEGIN');
  try{const result=await execute(db,cmd,args,o);await db.exec(o['dry-run']?'ROLLBACK':'COMMIT');return result;}catch(e){await db.exec('ROLLBACK');throw e;}
 }
 return execute(db,cmd,args,o);
}
async function execute(db,cmd,args,o){
 const q=(s,p=[])=>db.query(s,p);
 switch(cmd){
 case 'help':return Object.entries(usage).map(([command,arguments_])=>({command,arguments:arguments_}));
 case 'suppliers':return q('select id,name,owner from suppliers order by name');
 case 'add-supplier':{const r=(await q('insert into suppliers(name,owner) values($1,$2) returning *',[text(o.name,'name'),text(o.owner,'owner')]))[0];await audit(db,o,cmd,r.id,r);return r;}
 case 'specs':return q('select code,name,supplier,version,material,mass_g,status,review_due from current_specs order by code');
 case 'show':{const s=await current(db,args[0]);return {spec:s,evidence:await q('select * from evidence where revision_id=$1 order by created_at,id',[s.revision_id]),products:await q('select * from product_impact where spec_id=$1 order by product_code',[s.id])};}
 case 'add-spec':{const r=revision(o),u=await resolve(db,'suppliers',o.supplier);const s=(await q('insert into specs(code,name,supplier_id,owner) values($1,$2,$3,$4) returning *',[text(o.code,'code'),text(o.name,'name'),u.id,text(o.owner,'owner')]))[0];await insertRevision(db,s.id,1,r);await audit(db,o,cmd,s.id,r);return current(db,s.id);}
 case 'revise':{const s=await current(db,args[0],true),r=revision(o);await insertRevision(db,s.id,s.version+1,r);await audit(db,o,cmd,s.id,r);return current(db,s.id);}
 case 'evidence':{const s=await current(db,args[0]);return q('select * from evidence where revision_id=$1 order by created_at,id',[s.revision_id]);}
 case 'add-evidence':{const s=await current(db,args[0],true);if(!['food-contact','recycled-content'].includes(o.kind))throw Error('Unknown evidence kind');const r=(await q('insert into evidence(revision_id,kind,reference,valid_until,checked_by,suitability_note) values($1,$2,$3,$4,$5,$6) returning *',[s.revision_id,o.kind,text(o.reference,'reference'),date(o.until),actor(o),text(o.note,'note')]))[0];await audit(db,o,cmd,s.id,r);return r;}
 case 'review':{const s=await current(db,args[0],true);if(!['approved','changes'].includes(o.decision))throw Error('decision must be approved or changes');if(s.editor.trim().toLowerCase()===actor(o).toLowerCase())throw Error('Different reviewer required');if(o.decision==='approved'){const f=await q("select * from compliance_findings where id=$1 and rule<>'DECISION'",[s.id]);if(f.length)throw Error(`Evidence not ready: ${f.map(x=>x.issue).join('; ')}`);}const r=(await q('insert into decisions(revision_id,outcome,reviewer,note) values($1,$2,$3,$4) returning *',[s.revision_id,o.decision,actor(o),text(o.note,'note')]))[0];await audit(db,o,cmd,s.id,r);return r;}
 case 'spec-review':return q('select * from packaging_week order by findings desc,code');
 case 'supplier-chase':return q("select s.code,s.supplier,s.owner,f.rule,f.issue from current_specs s join compliance_findings f on f.id=s.id where f.rule in ('FOOD','RECYCLED') order by s.supplier,s.code");
 case 'change-impact':{const s=await current(db,args[0]);return q('select product_code,product,spec_code,version,status,quantity from product_impact where spec_id=$1 order by product_code',[s.id]);}
 case 'products':return q('select id,code,name,owner from products order by code');
 case 'add-product':{const r=(await q('insert into products(code,name,owner) values($1,$2,$3) returning *',[text(o.code,'code'),text(o.name,'name'),text(o.owner,'owner')]))[0];await audit(db,o,cmd,r.id,r);return r;}
 case 'link-component':{const p=await resolve(db,'products',args[0]);await q('select id from products where id=$1 for update',[p.id]);const s=await current(db,o.spec,true);const r=(await q('insert into components(product_id,spec_id,quantity) values($1,$2,$3) on conflict(product_id,spec_id) do update set quantity=excluded.quantity returning *',[p.id,s.id,decimal(o.quantity)]))[0];await audit(db,o,cmd,p.id,r);return r;}
 case 'pack-check':return packCheck(db,await resolve(db,'products',args[0]));
 case 'material-rollup':return q('select product_code,product,mass_per_pack_g,claimed_recycled_g,component_types from packaging_mass order by product_code');
 case 'actions':return q('select a.id,s.code,a.title,a.owner,a.due from actions a join specs s on s.id=a.spec_id where a.closed_at is null order by due,a.id');
 case 'add-action':{const s=await current(db,args[0]);const r=(await q('insert into actions(spec_id,title,owner,due) values($1,$2,$3,$4) returning *',[s.id,text(o.title,'title'),text(o.owner,'owner'),date(o.due)]))[0];await audit(db,o,cmd,s.id,r);return r;}
 case 'close-action':{const a=await resolve(db,'actions',args[0]);const r=(await q('update actions set closed_at=now(),resolution=$2 where id=$1 and closed_at is null returning *',[a.id,text(o.evidence,'evidence')]))[0];if(!r)throw Error('Action already closed');await audit(db,o,cmd,a.spec_id,r);return r;}
 case 'log':{const s=await current(db,args[0]);const r=(await q('insert into notes(spec_id,note,actor) values($1,$2,$3) returning *',[s.id,text(o.note,'note'),actor(o)]))[0];await audit(db,o,cmd,s.id,r);return r;}
 case 'history':{const s=await current(db,args[0]);return {revisions:await q('select * from revisions where spec_id=$1 order by version',[s.id]),decisions:await q('select d.* from decisions d join revisions r on r.id=d.revision_id where r.spec_id=$1 order by sequence',[s.id]),evidence:await q('select e.* from evidence e join revisions r on r.id=e.revision_id where r.spec_id=$1 order by e.created_at,e.id',[s.id]),notes:await q('select * from notes where spec_id=$1 order by created_at,id',[s.id]),audit:await q('select * from audit_events where entity_id=$1 order by created_at,id',[s.id])};}
 case 'compliance':return q('select code,name,rule,issue from compliance_findings order by code,rule');
 case 'attention':return q("select code,issue as needs_attention from compliance_findings union all select s.code,'Overdue: '||a.title from actions a join specs s on s.id=a.spec_id where closed_at is null and due<current_date order by code,needs_attention");
 case 'insights':{
 const queries=[
 ['Which specifications have overdue reviews?',"select code,review_due from current_specs where review_due<current_date order by code"],
 ['Which food-contact components lack current suitability evidence?',"select code,intended_use from current_specs where food_contact and not food_evidence order by code"],
 ['Which recycled-content claims lack current evidence?',"select code,recycled_percent from current_specs where recycled_percent>0 and not recycled_evidence order by code"],
 ['Which products use a component awaiting approval?',"select product_code,spec_code,version from product_impact where status<>'approved' order by product_code,spec_code"],
 ['Which components are shared by more than one product?',"select spec_code,count(*) as products from product_impact group by spec_code having count(*)>1 order by spec_code"],
 ['What is the nominal packaging mass of each pack?',"select product_code,mass_per_pack_g from packaging_mass order by product_code"],
 ['Which suppliers owe evidence for multiple components?',"select s.supplier,count(distinct s.id) as components from current_specs s join compliance_findings f on f.id=s.id where f.rule in ('FOOD','RECYCLED') group by s.supplier having count(distinct s.id)>1 order by s.supplier"],
 ['Which owners have overdue actions?',"select owner,count(*) as overdue from actions where closed_at is null and due<current_date group by owner order by owner"],
 ['Which specifications have no product usage?',"select s.code from specs s where not exists(select 1 from components c where c.spec_id=s.id) order by s.code"],
 ['Which products have no current evidence findings?',"select p.code from products p where exists(select 1 from components c where c.product_id=p.id) and not exists(select 1 from components c join compliance_findings f on f.id=c.spec_id where c.product_id=p.id) order by p.code"]
 ];return Promise.all(queries.map(async([question,sql])=>({question,answer:await q(sql)})));}
 case 'draft-supplier-request':{const s=await current(db,args[0]);const file=writeOut('drafts',`supplier-${s.code.replace(/[^a-z0-9-]/gi,'-')}-${randomUUID()}`,page({title:'Supplier evidence request: draft',subtitle:`${s.supplier}: ${s.code} revision ${s.version}`,sections:[{title:'Specification',html:table([s])},{title:'Evidence to check',html:table(await q('select rule,issue from compliance_findings where id=$1',[s.id]))},{title:'Operator notes',html:table(await q('select note,actor from notes where spec_id=$1 order by created_at',[s.id]))}]}));return {file,sent:false};}
 case 'weekly-review':{const sections=[];for(const [c,title] of [['spec-review','Specification review'],['attention','Attention'],['compliance','Compliance evidence']])sections.push({title,html:table(await execute(db,c,[],{}))});return {file:writeOut('drafts',`weekly-${randomUUID()}`,page({title:'Packaging weekly review: draft',sections})),sent:false};}
 case 'release':{
 const p=await resolve(db,'products',args[0]);await q('select id from products where id=$1 for update',[p.id]);
 await q('select s.id from specs s join components c on c.spec_id=s.id where c.product_id=$1 order by s.id for update of s',[p.id]);
 const check=await packCheck(db,p);if(!check.ready)throw Error(`Pack not ready: ${check.findings.map(f=>f.issue).join('; ')}`);
 const specifications=await q('select s.* from current_specs s join components c on c.spec_id=s.id where c.product_id=$1 order by s.code',[p.id]);
 const evidence=await q('select e.* from evidence e join current_specs s on s.revision_id=e.revision_id join components c on c.spec_id=s.id where c.product_id=$1 order by e.id',[p.id]);
 const decisions=await q('select d.* from decisions d join current_specs s on s.revision_id=d.revision_id join components c on c.spec_id=s.id where c.product_id=$1 order by d.sequence',[p.id]);
 const snapshot={product:p,components:check.parts,specifications,evidence,decisions,as_of:new Date().toISOString(),purpose:'Internal packaging review; not a safety certificate or authority to manufacture'};
 const digest=hash(snapshot),r=(await q('insert into releases(product_id,actor,snapshot,digest) values($1,$2,$3,$4) returning id',[p.id,actor(o),snapshot,digest]))[0];await audit(db,o,cmd,p.id,{id:r.id,digest});return {id:r.id,digest,components:check.parts.length,sent:false};}
 case 'releases':return q('select r.id,p.code,r.actor,r.digest,r.created_at from releases r join products p on p.id=r.product_id order by r.created_at,r.id');
 case 'import':return importSpecright(db,args,o);
 case 'imports':return q('select * from imports order by created_at,id');
 case 'export':{
 const file=path.resolve(text(o.out,'out')),records={};await db.exec('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
 try{for(const t of ['suppliers','specs','revisions','evidence','decisions','products','components','actions','notes','audit_events','imports','releases'])records[t]=await q(`select * from ${t} order by id`);await db.exec('COMMIT');}catch(e){await db.exec('ROLLBACK');throw e;}
 fs.writeFileSync(file,JSON.stringify({format:1,exported_at:new Date().toISOString(),records},null,2),{flag:'wx',mode:0o600});return {file,records:Object.values(records).reduce((n,r)=>n+r.length,0)};}
 }
}
async function importSpecright(db,args,o){
 if(args[0]!=='specright')throw Error('Use import specright FILE.csv');
 const file=text(args[1],'CSV path');if(!/\.csv$/i.test(file))throw Error('Save export as CSV UTF-8 first');
 const raw=fs.readFileSync(file,'utf8'),rows=parseCsv(raw),map=JSON.parse(fs.readFileSync(text(o.map,'map'),'utf8'));
 if(!rows.length)throw Error('CSV contains no records');
 const keys=['code','name','supplier','owner','material','mass','recycled','food-contact','use','review-due'];
 for(const k of keys){if(typeof map[k]!=='string'||!Object.hasOwn(rows[0],map[k]))throw Error(`Mapped header not found: ${k}`);}
 const seen=new Set();let inserted=0,unchanged=0;const source=text(o.source,'source');
 for(const row of rows){
 const r=Object.fromEntries(keys.map(k=>[k,row[map[k]].trim()]));const code=text(r.code,'code');
 if(seen.has(code.toLowerCase()))throw Error(`Duplicate CSV code: ${code}`);seen.add(code.toLowerCase());
 const opts={...r,actor:actor(o),source,reason:'Specright CSV import'};const rev=revision(opts);
 const old=await db.query('select * from current_specs where lower(code)=lower($1)',[code]);
 if(old.length){const s=old[0];const same=s.name===r.name&&s.supplier===r.supplier&&s.owner===r.owner&&s.material===rev.material&&Number(s.mass_g)===Number(rev.mass_g)&&Number(s.recycled_percent)===Number(rev.recycled_percent)&&s.food_contact===rev.food_contact&&s.intended_use===rev.intended_use&&s.review_due===rev.review_due;
 if(!same)throw Error(`Existing specification differs: ${code}; use revise with review`);unchanged++;continue;}
 let suppliers=await db.query('select * from suppliers where lower(name)=lower($1)',[text(r.supplier,'supplier')]);
 if(suppliers.length>1)throw Error(`Ambiguous suppliers: ${r.supplier}`);
 if(!suppliers.length)suppliers=[await execute(db,'add-supplier',[],{name:r.supplier,owner:text(r.owner,'owner'),actor:actor(o)})];
 await execute(db,'add-spec',[],{...opts,supplier:suppliers[0].id});inserted++;
 }
 if(!o['dry-run'])await db.query('insert into imports(source,digest,actor,inserted,unchanged) values($1,$2,$3,$4,$5)',[source,hash(raw),actor(o),inserted,unchanged]);
 return {inserted,unchanged,dry_run:!!o['dry-run'],approved:0};
}
export function parseArgs(argv){const args=[],options={};for(const arg of argv){if(arg.startsWith('--')){const i=arg.indexOf('='),key=arg.slice(2,i<0?undefined:i);if(!key||Object.hasOwn(options,key))throw Error(`Duplicate or empty flag: ${key}`);options[key]=i<0?true:arg.slice(i+1);}else args.push(arg);}return {cmd:args.shift()||'help',args,options};}
export function human(value){if(Array.isArray(value)&&value.length&&value.every(v=>v&&typeof v==='object'&&!Array.isArray(v)))return textTable(value,Object.keys(value[0]).map(key=>({key,label:key,format:v=>typeof v==='object'?JSON.stringify(v):v})));return Array.isArray(value)&&!value.length?'(none)':JSON.stringify(value,null,2);}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){let db;try{const {cmd,args,options}=parseArgs(process.argv.slice(2));db=await getDb();const result=await run(db,cmd,args,options);console.log(options.json?JSON.stringify(result,null,2):human(result));}catch(e){console.error(e.message);process.exitCode=1;}finally{if(db)await db.close();}}
