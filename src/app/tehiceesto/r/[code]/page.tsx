import { notFound } from "next/navigation";
import ExperienceEngine from "../../ExperienceEngine";
import PremiumV1Engine from "../../template-v1/ExperienceEngine";
import PremiumV2Engine from "../../template-v2/ExperienceEngine";
import { getExperience } from "../../data";
import { getExperience as getPremiumV1Experience } from "../../template-v1/data";
import { getExperience as getPremiumV2Experience } from "../../template-v2/data";
import type { DeepPartial,ExperienceCopy } from "../../experienceCopy";
import { normalizeSceneTextOverrides,type SceneTextOverrides } from "../../sceneText";
import { normalizeSceneTextOverrides as normalizePremiumV1SceneTextOverrides } from "../../template-v1/sceneText";
import { normalizeSceneTextOverrides as normalizePremiumV2SceneTextOverrides } from "../../template-v2/sceneText";
import AffiliateRedirect from "./AffiliateRedirect";
import { effectiveRecipeForMedia } from "../../effectiveRecipe";
import { effectiveRecipeForMedia as effectivePremiumV1RecipeForMedia } from "../../template-v1/effectiveRecipe";
import { effectiveRecipeForMedia as effectivePremiumV2RecipeForMedia } from "../../template-v2/effectiveRecipe";

const SUPABASE_URL="https://efvvadfxuyieswdqnsjg.supabase.co";
const PUBLISHABLE_KEY="sb_publishable_nzbFJECAwVxyMfQUuLXRXQ_gqYvGeYN";

type EdgeGift={
  template_version:string|null;experience_slug:string;giver_name:string;recipient_name:string;opening_text:string|null;letter_text:string|null;closing_text:string|null;scene_recipe:string[]|null;
  story_data:{relationship?:string;keyDate?:string;anecdote?:string;script?:DeepPartial<ExperienceCopy>;sceneContent?:SceneTextOverrides}|null;
  theme_data:{accent?:string}|null;
};
type EdgeMedia={kind:"image"|"audio"|"video";caption:string|null;sort_order:number;metadata:{fit?:"cover"|"contain";position?:"center"|"top"|"bottom"|"left"|"right";scene?:import("../../data").SceneType;role?:"voice"|"soundtrack"}|null;url:string|null};

export default async function PublishedGiftPage({
  params,
  searchParams,
}:{
  params:Promise<{code:string}>;
  searchParams:Promise<{src?:string|string[]}>;
}){
  const {code}=await params;
  if(!/^[a-f0-9]{18}$/.test(code)){
    if(!/^[a-z0-9][a-z0-9-]{2,49}$/.test(code))notFound();
    const query=await searchParams;
    const source=Array.isArray(query.src)?query.src[0]||"":query.src||"";
    return <AffiliateRedirect code={code} source={source.slice(0,60).toLowerCase()}/>;
  }
  const response=await fetch(`${SUPABASE_URL}/functions/v1/gift-read?code=${encodeURIComponent(code)}`,{headers:{apikey:PUBLISHABLE_KEY,accept:"application/json"},cache:"no-store"});
  if(response.status===404)notFound();if(!response.ok)throw new Error("gift_read_failed");
  const payload=(await response.json()) as {gift:EdgeGift;media:EdgeMedia[]};const templateVersion=payload.gift.template_version||"premium-v1";const frozenV1=templateVersion==="premium-v1";const frozenV2=templateVersion==="premium-v2";const base=frozenV1?getPremiumV1Experience(payload.gift.experience_slug):frozenV2?getPremiumV2Experience(payload.gift.experience_slug):getExperience(payload.gift.experience_slug);if(!base)notFound();
  const ordered=[...(payload.media||[])].sort((a,b)=>a.sort_order-b.sort_order);
  const hasPhoto=ordered.some(item=>item.kind==="image"&&item.url);
  const hasVideo=ordered.some(item=>item.kind==="video"&&item.url);
  const hasVoice=ordered.some(item=>item.kind==="audio"&&item.url&&item.metadata?.role!=="soundtrack");
  const hasLightPhoto=ordered.some(item=>item.kind==="image"&&item.url&&item.metadata?.scene==="light");
  const storedRecipe=Array.isArray(payload.gift.scene_recipe)&&payload.gift.scene_recipe.length?payload.gift.scene_recipe:base.recipe;
  const recipeResolver=frozenV1
    ?effectivePremiumV1RecipeForMedia
    :frozenV2
      ?effectivePremiumV2RecipeForMedia
      :effectiveRecipeForMedia;
  const effectiveRecipe=recipeResolver(storedRecipe,{
    hasPhoto,
    hasVoice,
    hasVideo,
    hasLightPhoto,
  }) as typeof base.recipe;
  const experience={...base,demoGiver:payload.gift.giver_name,demoRecipient:payload.gift.recipient_name,opening:payload.gift.opening_text||base.opening,closing:payload.gift.closing_text||base.closing,
    recipe:effectiveRecipe,accent:payload.gift.theme_data?.accent||base.accent};
  const soundtrack=ordered.find(item=>item.kind==="audio"&&item.url&&item.metadata?.role==="soundtrack");
  const Engine=frozenV1?PremiumV1Engine:frozenV2?PremiumV2Engine:ExperienceEngine;
  const sceneTextOverrides=frozenV1
    ?normalizePremiumV1SceneTextOverrides(payload.gift.story_data?.sceneContent)
    :frozenV2
      ?normalizePremiumV2SceneTextOverrides(payload.gift.story_data?.sceneContent)
      :normalizeSceneTextOverrides(payload.gift.story_data?.sceneContent);
  // Gift pages have no sales UI. Keep a route-level guard independent of the template version.
  return <div className="thi-purchased-experience" data-purchased-gift="true" style={{display:"contents"}}><Engine customerGift experience={experience} copyOverride={payload.gift.story_data?.script} letterText={payload.gift.letter_text||undefined}
    photoMedia={ordered.filter(item=>item.kind==="image"&&item.url).map(item=>({url:item.url as string,caption:item.caption||undefined,fit:item.metadata?.fit||"cover",position:item.metadata?.position||"center",scene:item.metadata?.scene}))}
    audioMedia={ordered.filter(item=>item.kind==="audio"&&item.url&&item.metadata?.role!=="soundtrack").map(item=>({url:item.url as string,caption:item.caption||undefined,scene:item.metadata?.scene}))}
    soundtrackMedia={soundtrack?{url:soundtrack.url as string,caption:soundtrack.caption||undefined}:undefined}
    storyContext={{keyDate:payload.gift.story_data?.keyDate,anecdote:payload.gift.story_data?.anecdote}}
    sceneTextOverrides={sceneTextOverrides}
    videoMedia={ordered.filter(item=>item.kind==="video"&&item.url).map(item=>({url:item.url as string,caption:item.caption||undefined,scene:item.metadata?.scene}))}/></div>;
}
