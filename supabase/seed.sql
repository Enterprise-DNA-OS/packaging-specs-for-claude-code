insert into suppliers(id,name,owner) values ('10000000-0000-0000-0000-000000000001','Harbour Packaging','Aroha'),('10000000-0000-0000-0000-000000000002','Tasman Fibre','Mia') on conflict do nothing;
insert into specs(id,code,name,supplier_id,owner) values
('20000000-0000-0000-0000-000000000001','BOT-500','Clear bottle 500 ml','10000000-0000-0000-0000-000000000001','Aroha'),
('20000000-0000-0000-0000-000000000002','CAP-28','Bottle cap 28 mm','10000000-0000-0000-0000-000000000001','Aroha'),
('20000000-0000-0000-0000-000000000003','BOX-06','Six bottle carton','10000000-0000-0000-0000-000000000002','Mia') on conflict do nothing;
insert into revisions(id,spec_id,version,material,mass_g,recycled_percent,food_contact,intended_use,source,review_due,editor,reason) values
('30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001',1,'PET',24,30,true,'Chilled non-carbonated juice; no heating','Fictional supplier sheet B1',current_date+30,'Aroha','Demo receipt'),
('30000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000002',1,'HDPE',3,0,true,'Closure for chilled juice','Fictional supplier sheet C1',current_date-4,'Aroha','Demo overdue review'),
('30000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000003',1,'Corrugated fibre',180,80,false,'Outer transit carton for sealed bottles','Fictional supplier sheet F1',current_date+60,'Mia','Demo receipt') on conflict do nothing;
insert into evidence(id,revision_id,kind,reference,valid_until,checked_by,suitability_note) values
('40000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','food-contact','Fictional declaration BOT-500',current_date+90,'Reviewer','Covers chilled juice and specified contact conditions'),
('40000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000001','recycled-content','Fictional recycled PET evidence',current_date+90,'Reviewer','Supplier evidence covers stated 30 percent'),
('40000000-0000-0000-0000-000000000003','30000000-0000-0000-0000-000000000002','food-contact','Fictional expired cap declaration',current_date-1,'Reviewer','Old declaration requires supplier renewal') on conflict do nothing;
insert into decisions(id,revision_id,outcome,reviewer,note) values ('50000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','approved','Mia','Demo evidence reviewed') on conflict do nothing;
insert into products(id,code,name,owner) values ('60000000-0000-0000-0000-000000000001','JUICE-06','Chilled juice six-pack','Tama'),('60000000-0000-0000-0000-000000000002','WATER-01','Still water single','Tama') on conflict do nothing;
insert into components(id,product_id,spec_id,quantity) values
('70000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001',6),
('70000000-0000-0000-0000-000000000002','60000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000002',6),
('70000000-0000-0000-0000-000000000003','60000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000003',1),
('70000000-0000-0000-0000-000000000004','60000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001',1) on conflict do nothing;
insert into actions(id,spec_id,title,owner,due) values ('80000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000002','Request current cap declaration','Aroha',current_date-2) on conflict do nothing;
