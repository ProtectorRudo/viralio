begin;
do $qa$
declare
 u uuid:=gen_random_uuid();b uuid:=gen_random_uuid();oldid uuid:=gen_random_uuid();newid uuid:=gen_random_uuid();
 contact text:=repeat('d',64); n integer; picked uuid;
begin
 insert into auth.users(id,instance_id,aud,role,email,created_at,updated_at)
 values(u,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',
 'cierre.qa.gates.'||u::text||'@invalid.test',now(),now());
 insert into public.cierre_businesses(id,owner_id,name,industry) values(b,u,'QA NEVER SEND CHECKS','corralon');
 update public.cierre_connections set state='connected',
  meta_phone_number_id='89988776655443',last_event_at=now(),
  inbound_seen=true,seller_echo_seen=true,pdf_echo_seen=true where business_id=b;
 update public.cierre_settings set followup_hours=36,paused=false,contact_scope='all' where business_id=b;
 update public.cierre_delivery_approvals set enabled=true,
  device_coverage_verified=true,external_sales_sync_verified=true,
  template_name='qa_approved',template_language='es_AR',
  approved_text_md5=md5((select followup_text from public.cierre_settings where business_id=b))
 where business_id=b;
 insert into public.cierre_recipient_secrets(business_id,contact_ref,encrypted_phone) values(b,contact,repeat('x',80));
 insert into public.cierre_provider_tokens(business_id,encrypted_access_token) values(b,repeat('y',80));
 insert into public.cierre_opportunities(id,business_id,contact_ref,quote_ref,quote_number,
 sent_at,last_activity_at,status,reason,amount,currency,document_state,ai_state,eligibility)
 values
 (oldid,b,contact,'QA-OLD','P-10',now()-interval '48 hours',now()-interval '48 hours',
  'candidate','verified',100000,'ARS','extracted','evaluated','blocked'),
 (newid,b,contact,'QA-NEW','P-11',now()-interval '40 hours',now()-interval '40 hours',
  'candidate','verified',160000,'ARS','extracted','evaluated','blocked');
 insert into public.cierre_sale_verifications(opportunity_id,business_id,quote_number,no_sale_confirmed,source,checked_at)
 values(oldid,b,'P-10',true,'verified_ecommerce',now()),(newid,b,'P-11',true,'verified_ecommerce',now());
 n:=public.cierre_stage_safe_followups();
 if n<>0 then raise exception 'FAIL missing opt-in should not stage';end if;
 insert into public.cierre_consent_evidence(business_id,contact_ref,source,verified_at)
 values(b,contact,'qa_written_optin',now()-interval '2 days');
 n:=public.cierre_stage_safe_followups();
 if n<>1 then raise exception 'FAIL expected only newest quote to stage, got %',n;end if;
 select opportunity_id into picked from public.cierre_send_outbox where business_id=b;
 if picked<>newid then raise exception 'FAIL outdated quote staged';end if;
 delete from public.cierre_send_outbox where business_id=b;
 update public.cierre_settings set contact_scope='unsaved' where business_id=b;
 n:=public.cierre_stage_safe_followups();
 if n<>0 then raise exception 'FAIL unknown contacts treated as unsaved';end if;
 update public.cierre_settings set contact_scope='all',paused=true where business_id=b;
 n:=public.cierre_stage_safe_followups();
 if n<>0 then raise exception 'FAIL paused';end if;
 update public.cierre_settings set paused=false,followup_text=followup_text||' Cambiado.' where business_id=b;
 n:=public.cierre_stage_safe_followups();
 if n<>0 then raise exception 'FAIL edited template must invalidate old approval';end if;
 update public.cierre_delivery_approvals set approved_text_md5=md5((select followup_text from public.cierre_settings where business_id=b)) where business_id=b;
 update public.cierre_sale_verifications set no_sale_confirmed=false where opportunity_id=newid;
 n:=public.cierre_stage_safe_followups();
 if n<>0 then raise exception 'FAIL confirmed external sale cannot stage';end if;
 raise notice 'PASS: opt-in, newest quote, unknown agenda, pause, template mismatch, external sale';
end $qa$;
rollback;