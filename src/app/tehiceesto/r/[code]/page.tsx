import { notFound } from "next/navigation";
import ExperienceEngine from "../../ExperienceEngine";
import PremiumV1Engine from "../../template-v1/ExperienceEngine";
import { getExperience } from "../../data";
import { getExperience as getPremiumV1Experience } from "../../template-v1/data";
import type { DeepPartial,ExperienceCopy } from "../../experienceCopy";
import { normalizeSceneTextOverrides,type SceneTextOverrides } from "../../sceneText";

const SUPABASE_URL="https://efvvadfxuyieswdqnsjg.supabase.co";
const PUBLISHABLE_KEY="sb_publishable_nzbFJECAwVxyMfQUuLXRXQ_gqYvGeYN";

type EdgeGift={
  template_version:string|null;experience_slug:string;giver_name:string;recipient_name:string;opening_text:string|null;letter_text:string|null;closing_text:string|null;scene_recipe:string[]|null;
  story_data:{relationship?:string;keyDate?:string;anecdote?:string;script?:DeepPartial<ExperienceCopy>;sceneContent?:SceneTextOverrides}|null;
  theme_data:{accent?:string}|null;
};
type EdgeMedia={kind:"image"|"audio"|"video";caption:string|null;sort_order:number;metadata:{fit?:"cover"|"contain";position?:"center"|"top"|"bottom"|"left"|"right";scene?:import("../../data").SceneType;role?:"voice"|"soundtrack"}|null;url:string|null};

export default async function PublishedGiftPage({params}:{params:Promise<{code:string}>}){
  const {code}=await params;if(!/^[a-f0-9]{18}$/.test(code))notFound();
  const response=await fetch(`${SUPABASE_URL}/functions/v1/gift-read?code=${encodeURIComponent(code)}`,{headers:{apikey:PUBLISHABLE_KEY,accept:"application/json"},cache:"no-store"});
  if(response.status===404)notFound();if(!response.ok)throw new Error("gift_read_failed");
  const payload=(await response.json()) as {gift:EdgeGift;media:EdgeMedia[]};const templateVersion=payload.gift.template_version||"premium-v1";const frozenV1=templateVersion==="premium-v1";const base=frozenV1?getPremiumV1Experience(payload.gift.experience_slug):getExperience(payload.gift.experience_slug);if(!base)notFound();
  const experience={...base,demoGiver:payload.gift.giver_name,demoRecipient:payload.gift.recipient_name,opening:payload.gift.opening_text||base.opening,closing:payload.gift.closing_text||base.closing,
    recipe:Array.isArray(payload.gift.scene_recipe)&&payload.gift.scene_recipe.length?(payload.gift.scene_recipe as typeof base.recipe):base.recipe,accent:payload.gift.theme_data?.accent||base.accent};
  const ordered=[...(payload.media||[])].sort((a,b)=>a.sort_order-b.sort_order);
  const soundtrack=ordered.find(item=>item.kind==="audio"&&item.url&&item.metadata?.role==="soundtrack");
  const Engine=frozenV1?PremiumV1Engine:ExperienceEngine;
  return <Engine experience={experience} copyOverride={payload.gift.story_data?.script} letterText={payload.gift.letter_text||undefined}
    photoMedia={ordered.filter(item=>item.kind==="image"&&item.url).map(item=>({url:item.url as string,caption:item.caption||undefined,fit:item.metadata?.fit||"cover",position:item.metadata?.position||"center",scene:item.metadata?.scene}))}
    audioMedia={ordered.filter(item=>item.kind==="audio"&&item.url&&item.metadata?.role!=="soundtrack").map(item=>({url:item.url as string,caption:item.caption||undefined,scene:item.metadata?.scene}))}
    soundtrackMedia={soundtrack?{url:soundtrack.url as string,caption:soundtrack.caption||undefined}:undefined}
    storyContext={{keyDate:payload.gift.story_data?.keyDate,anecdote:payload.gift.story_data?.anecdote}}
    sceneTextOverrides={normalizeSceneTextOverrides(payload.gift.story_data?.sceneContent)}
    videoMedia={ordered.filter(item=>item.kind==="video"&&item.url).map(item=>({url:item.url as string,caption:item.caption||undefined,scene:item.metadata?.scene}))}/>;
}
