begin;
do $qa$
declare
 u uuid:=gen_random_uuid(); b uuid:=gen_random_uuid();
 old_quote uuid:=gen_random_uuid(); new_quote uuid:=gen_random_uuid();
 contact text:=repeat('c',64); output_count integer;
 claim jsonb; msgid uuid; checkable boolean;
begin
 insert into auth.users(id,instance_id,aud,role,email,created_at,updated_at)
 values(u,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',
 'cierre.qa.outbox.'||u::text||'@invalid.test',now(),now());
 insert into public.cierre_businesses(id,owner_id,name,industry)
 values(b,u,'QA OUTBOX TRANSACTION ROLLBACK','corralon');
 update public.cierre_connections set state='connected',meta_phone_number_id='98765432123456',
  last_event_at=now(),inbound_seen=true,seller_echo_seen=true,pdf_echo_seen=true
 where business_id=b;
 update public.cierre_settings set followup_hours=36,contact_scope='all',paused=false where business_id=b;
 update public.cierre_delivery_approvals
   set enabled=true,device_coverage_verified=true,external_sales_sync_verified=true,
       template_name='cierre_qa_template',template_language='es_AR',
       approved_text_md5=md5((select followup_text from public.cierre_settings where business_id=b))
 where business_id=b;
 insert into public.cierre_consent_evidence(business_id,contact_ref,source,verified_at)
 values(b,contact,'qa_customer_opt_in',now()-interval '1 day');
 insert into public.cierre_recipient_secrets(business_id,contact_ref,encrypted_phone)
 values(b,contact,repeat('x',80));
 insert into public.cierre_provider_tokens(business_id,encrypted_access_token)
 values(b,repeat('y',80));
 insert into public.cierre_opportunities(id,business_id,contact_ref,quote_ref,quote_number,
  sent_at,last_activity_at,status,reason,amount,currency,document_state,ai_state,eligibility)
 values(old_quote,b,contact,'qa-old','P-100',now()-interval '42 hours',now()-interval '42 hours',
  'candidate','qa',800000,'ARS','extracted','evaluated','blocked');
 insert into public.cierre_sale_verifications(opportunity_id,business_id,quote_number,
   no_sale_confirmed,source,checked_at)
 values(old_quote,b,'P-100',true,'qa_sync_confirmed',now());
 output_count:=public.cierre_stage_safe_followups();
 if output_count<>1 then raise exception 'FAIL: ready stage expected 1 got %',output_count;end if;
 output_count:=public.cierre_stage_safe_followups();
 if output_count<>0 then raise exception 'FAIL: duplicate staged %',output_count;end if;
 claim:=public.cierre_claim_one_safe_send();
 if claim->>'ready'<>'true' then raise exception 'FAIL: expected claim ready, got %',claim;end if;
 msgid:=(claim->>'delivery_id')::uuid;
 checkable:=public.cierre_validate_claimed_send(msgid);
 if checkable is not true then raise exception 'FAIL: last-second recheck';end if;
 perform public.cierre_complete_safe_send(msgid,null,'uncertain');
 output_count:=public.cierre_stage_safe_followups();
 if output_count<>0 then raise exception 'FAIL: uncertain send should never retry';end if;
 -- Even an entirely new eligible quote for the same contact must respect
 -- the recent uncertain send; it may not silently contact again.
 insert into public.cierre_opportunities(id,business_id,contact_ref,quote_ref,quote_number,
  sent_at,last_activity_at,status,reason,amount,currency,document_state,ai_state,eligibility)
 values(new_quote,b,contact,'qa-new','P-101',now()-interval '40 hours',now()-interval '40 hours',
  'candidate','qa',1500000,'ARS','extracted','evaluated','blocked');
 insert into public.cierre_sale_verifications(opportunity_id,business_id,quote_number,
   no_sale_confirmed,source,checked_at)
 values(new_quote,b,'P-101',true,'qa_sync_confirmed',now());
 output_count:=public.cierre_stage_safe_followups();
 if output_count<>0 then raise exception 'FAIL: second quote bypassed recent uncertain contact';end if;
 -- Pausing blocks irrespective of everything else.
 update public.cierre_settings set paused=true where business_id=b;
 output_count:=public.cierre_stage_safe_followups();
 if output_count<>0 then raise exception 'FAIL: pause bypass';end if;
 -- Change in message automatically voids matching Meta template approval.
 update public.cierre_settings set paused=false,
   followup_text=followup_text||' Buen dia.' where business_id=b;
 output_count:=public.cierre_stage_safe_followups();
 if output_count<>0 then raise exception 'FAIL: message changed but still approved';end if;
 raise notice 'PASS: one-time staging, preflight, uncertain no-retry, 14-day cap, pause, template mismatch';
end $qa$;
rollback;