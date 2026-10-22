create function touch_updated() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
create function immutable_record() returns trigger language plpgsql as $$ begin raise exception 'Record is append-only'; end $$;
create table suppliers(id uuid primary key default gen_random_uuid(), name text not null check(length(trim(name))>0), owner text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table specs(id uuid primary key default gen_random_uuid(), code text not null, name text not null, supplier_id uuid not null references suppliers, owner text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create unique index spec_code on specs(lower(code));
create table revisions(id uuid primary key default gen_random_uuid(), spec_id uuid not null references specs, version integer not null check(version>0), material text not null, mass_g numeric(14,4) not null check(mass_g>0), recycled_percent numeric(7,4) not null check(recycled_percent between 0 and 100), food_contact boolean not null, intended_use text not null, source text not null, review_due date not null, editor text not null, reason text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(spec_id,version));
create table evidence(id uuid primary key default gen_random_uuid(), revision_id uuid not null references revisions, kind text not null check(kind in ('food-contact','recycled-content')), reference text not null, valid_until date not null, checked_by text not null, suitability_note text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table decisions(id uuid primary key default gen_random_uuid(), revision_id uuid not null references revisions, sequence bigint generated always as identity unique, outcome text not null check(outcome in ('approved','changes')), reviewer text not null, note text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table products(id uuid primary key default gen_random_uuid(), code text not null, name text not null, owner text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create unique index product_code on products(lower(code));
create table components(id uuid primary key default gen_random_uuid(), product_id uuid not null references products, spec_id uuid not null references specs, quantity numeric(14,4) not null check(quantity>0), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(product_id,spec_id));
create table actions(id uuid primary key default gen_random_uuid(), spec_id uuid not null references specs, title text not null, owner text not null, due date not null, closed_at timestamptz, resolution text, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table notes(id uuid primary key default gen_random_uuid(), spec_id uuid not null references specs, note text not null, actor text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table audit_events(id uuid primary key default gen_random_uuid(), actor text not null, event text not null, entity_id uuid not null, detail jsonb not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table imports(id uuid primary key default gen_random_uuid(), source text not null, digest text not null, actor text not null, inserted integer not null, unchanged integer not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table releases(id uuid primary key default gen_random_uuid(), product_id uuid not null references products, actor text not null, snapshot jsonb not null, digest text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
do $$ declare t text; begin
foreach t in array array['suppliers','specs','revisions','evidence','decisions','products','components','actions','notes','audit_events','imports','releases'] loop
execute format('alter table %I enable row level security',t);
execute format('revoke all on %I from public',t);
execute format('create trigger touch before update on %I for each row execute function touch_updated()',t);
end loop;
foreach t in array array['revisions','evidence','decisions','notes','audit_events','imports','releases'] loop
execute format('create trigger immutable before update or delete on %I for each row execute function immutable_record()',t);
end loop;
end $$;
create view current_specs with(security_invoker=true) as
select s.id,s.code,s.name,s.owner,s.supplier_id,u.name as supplier,r.id as revision_id,r.version,r.material,r.mass_g,r.recycled_percent,r.food_contact,r.intended_use,r.source,r.review_due,r.editor,coalesce(d.outcome,'draft') as status,
 exists(select 1 from evidence e where e.revision_id=r.id and e.kind='food-contact' and e.valid_until>=current_date) as food_evidence,
 exists(select 1 from evidence e where e.revision_id=r.id and e.kind='recycled-content' and e.valid_until>=current_date) as recycled_evidence
from specs s join suppliers u on u.id=s.supplier_id
join lateral(select * from revisions where spec_id=s.id order by version desc limit 1) r on true
left join lateral(select * from decisions where revision_id=r.id order by sequence desc limit 1) d on true;
create view compliance_findings with(security_invoker=true) as
select id,code,name,'REVIEW'::text as rule,'Specification review overdue'::text as issue from current_specs where review_due<current_date
union all select id,code,name,'FOOD','Food-contact suitability evidence missing or expired' from current_specs where food_contact and not food_evidence
union all select id,code,name,'RECYCLED','Recycled-content claim evidence missing or expired' from current_specs where recycled_percent>0 and not recycled_evidence
union all select id,code,name,'DECISION','Current revision needs approval' from current_specs where status<>'approved';
create view product_impact with(security_invoker=true) as
select p.id as product_id,p.code as product_code,p.name as product,s.id as spec_id,s.code as spec_code,s.version,s.status,c.quantity,s.mass_g,round(c.quantity*s.mass_g,4) as component_mass_g,s.recycled_percent
from products p join components c on c.product_id=p.id join current_specs s on s.id=c.spec_id;
create view packaging_week with(security_invoker=true) as
select s.code,s.name,s.supplier,s.owner,s.version,s.status,s.review_due,
(select count(*) from compliance_findings f where f.id=s.id) as findings,
(select count(*) from components c where c.spec_id=s.id) as affected_products from current_specs s;
create view packaging_mass with(security_invoker=true) as
select product_id,product_code,product,round(sum(component_mass_g),4) as mass_per_pack_g,
round(sum(component_mass_g*recycled_percent/100),4) as claimed_recycled_g,
count(*) as component_types from product_impact group by product_id,product_code,product;
