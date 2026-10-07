/* eslint-disable @next/next/no-img-element */
"use client";

// github-bridge release: premium-mama-finale-v3

// github-bridge release: premium-mama-finale-v2

// github-bridge release: premium-mama-finale

// github-bridge release: mama-without-return

// github-bridge release: cinematic-pair-intro
// github-bridge release: premium-threshold-door

import { useEffect,useRef,useState,type CSSProperties,type MouseEvent as ReactMouseEvent,type PointerEvent as ReactPointerEvent } from "react";
import { flushSync } from "react-dom";
import Link from "next/link";
import type { Experience,SceneType } from "./data";
import ScratchReveal from "./ScratchReveal";
import CandleBlow from "./CandleBlow";
import LightReveal from "./LightReveal";
import HoldReveal from "./HoldReveal";
import { getExperienceCopy,type DeepPartial,type ExperienceCopy } from "./experienceCopy";
import { mediaBelongsToScene } from "./mediaRouting";
import type { SceneTextOverrides } from "./sceneText";

export type ThiPhoto={url:string;caption?:string;fit?:"cover"|"contain";position?:"center"|"top"|"bottom"|"left"|"right";scene?:SceneType};
export type ThiAudio={url:string;caption?:string;scene?:SceneType};
export type ThiVideo={url:string;caption?:string;scene?:SceneType};

const premiumFallbackPhotos=[
  "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1200&q=85",
];

function AttachedSceneMedia({scene,photos,audios,videos}:{scene:SceneType;photos:ThiPhoto[];audios:ThiAudio[];videos:ThiVideo[]}){
  const attachedPhotos=(scene==="memories"||scene==="light")?[]:photos;
  const attachedAudios=scene==="voices"?[]:audios;
  const attachedVideos=scene==="video"?[]:videos;
  if(!attachedPhotos.length&&!attachedAudios.length&&!attachedVideos.length) return null;
  return <aside className="thi-attached-media" data-attached-scene={scene}>
    {attachedPhotos.slice(0,2).map((item,index)=><figure className={`thi-attached-photo p${index+1}`} key={item.url}>
      <img src={item.url} alt={item.caption||"Recuerdo"} style={{objectFit:item.fit||"cover",objectPosition:item.position||"center"}}/>
      {item.caption&&<figcaption>{item.caption}</figcaption>}
    </figure>)}
    {attachedVideos.slice(0,1).map(item=><figure className="thi-attached-video" key={item.url}>
      <video src={item.url} controls playsInline preload="metadata"/>
      {item.caption&&<figcaption>{item.caption}</figcaption>}
    </figure>)}
    {attachedAudios.slice(0,2).map((item,index)=><article className="thi-attached-audio" key={item.url}>
      <span>♪</span><div><small>{item.caption||`Audio ${index+1}`}</small><audio src={item.url} controls preload="metadata"/></div>
    </article>)}
  </aside>;
}

export default function ExperienceEngine({experience,letterText,photoMedia,audioMedia,soundtrackMedia,videoMedia,copyOverride,initialScene,previewScene,onSceneChange,storyContext,sceneTextOverrides,customerGift=false}:{experience:Experience;letterText?:string;photoMedia?:ThiPhoto[];audioMedia?:ThiAudio[];soundtrackMedia?:ThiAudio;videoMedia?:ThiVideo[];copyOverride?:DeepPartial<ExperienceCopy>;initialScene?:SceneType;previewScene?:SceneType;onSceneChange?:(scene:SceneType,index:number,total:number)=>void;storyContext?:{keyDate?:string;anecdote?:string};sceneTextOverrides?:SceneTextOverrides;customerGift?:boolean}){
  const requestedInitialScene=previewScene||initialScene;
  const initialSceneIndex=requestedInitialScene?Math.max(0,experience.recipe.indexOf(requestedInitialScene)):0;
  const [internalSceneIndex,setInternalSceneIndex]=useState(initialSceneIndex);const [runId,setRunId]=useState(0);const [transitioning,setTransitioning]=useState(false);const [direction,setDirection]=useState<"forward"|"back">("forward");
  const [stars,setStars]=useState<number[]>([]);const [letterOpen,setLetterOpen]=useState(false);const [scratched,setScratched]=useState(false);const [candlesOut,setCandlesOut]=useState(false);const [popped,setPopped]=useState<number[]>([]);
  const [quizChoice,setQuizChoice]=useState<number|null>(null);const [vaultOpen,setVaultOpen]=useState(false);const [capsuleOpen,setCapsuleOpen]=useState(false);const [voicesPlayed,setVoicesPlayed]=useState<number[]>([]);const [demoVoiceStatus,setDemoVoiceStatus]=useState<"idle"|"playing"|"paused">("idle");const [mamaVoiceIndex,setMamaVoiceIndex]=useState<number|null>(null);const [mamaVoiceProgress,setMamaVoiceProgress]=useState(0);const [mamaVoiceRealPlaying,setMamaVoiceRealPlaying]=useState(false);const [finalReaction,setFinalReaction]=useState<number|null>(null);const [mamaMemoryIndex,setMamaMemoryIndex]=useState(0);
  const [doorOpen,setDoorOpen]=useState(false);const [lightRevealed,setLightRevealed]=useState(false);const [holdRevealed,setHoldRevealed]=useState(false);const [lastStar,setLastStar]=useState<number|null>(null);
  const [archiveOpen,setArchiveOpen]=useState(false);const [homeOpen,setHomeOpen]=useState<number[]>([]);const [legacyOpen,setLegacyOpen]=useState(false);
  const [ritualsOpen,setRitualsOpen]=useState<number[]>([]);const [chapterOpen,setChapterOpen]=useState<number[]>([]);const [futureOpen,setFutureOpen]=useState(false);
  const [reasonsOpen,setReasonsOpen]=useState<number[]>([]);const [certaintyOpen,setCertaintyOpen]=useState<number[]>([]);const [thresholdHolding,setThresholdHolding]=useState(false);const [thresholdOpen,setThresholdOpen]=useState(false);
  const [careOpen,setCareOpen]=useState<number[]>([]);const [sacrificesOpen,setSacrificesOpen]=useState<number[]>([]);const [lessonsOpen,setLessonsOpen]=useState<number[]>([]);const [presenceOpen,setPresenceOpen]=useState<number[]>([]);const [inheritanceOpen,setInheritanceOpen]=useState<number[]>([]);const [returnOpen,setReturnOpen]=useState(false);const [lookbackOpen,setLookbackOpen]=useState(false);
  const [casefileOpen,setCasefileOpen]=useState(false);const [insideJokesOpen,setInsideJokesOpen]=useState<number[]>([]);const [incidentsOpen,setIncidentsOpen]=useState<number[]>([]);const [proofOpen,setProofOpen]=useState<number[]>([]);const [pactOpen,setPactOpen]=useState<number[]>([]);
  const [soundtrackStarted,setSoundtrackStarted]=useState(false);const [soundtrackPaused,setSoundtrackPaused]=useState(false);
  const soundtrackRef=useRef<HTMLAudioElement|null>(null);const soundtrackFadeRef=useRef<number|null>(null);const demoVoiceMessageRef=useRef<string|null>(null);const demoVoiceRunRef=useRef(0);const mamaVoiceAudioRef=useRef<HTMLAudioElement|null>(null);
  const shellRef=useRef<HTMLElement|null>(null);const mamaMemorySwipeRef=useRef<{pointerId:number|null;x:number;y:number}>({pointerId:null,x:0,y:0});const mamaLetterSwipeRef=useRef<{pointerId:number|null;x:number;y:number;swiped:boolean}>({pointerId:null,x:0,y:0,swiped:false});

  const copy=getExperienceCopy(experience,copyOverride);
  const scenes=customerGift?experience.recipe.filter(scene=>{
    if(scene==="voices")return (audioMedia||[]).some(item=>mediaBelongsToScene("audio",item.scene,"voices"));
    if(scene==="light")return (photoMedia||[]).some(item=>mediaBelongsToScene("image",item.scene,"light"));
    return true;
  }):experience.recipe;
  const controlledSceneIndex=previewScene?scenes.indexOf(previewScene):-1;
  const sceneIndex=controlledSceneIndex>=0?controlledSceneIndex:internalSceneIndex;
  const current=scenes[sceneIndex];const total=scenes.length;const progress=((sceneIndex+1)/Math.max(total,1))*100;
  useEffect(()=>{
    if(current)onSceneChange?.(current,sceneIndex,total);
  },[current,sceneIndex,total,onSceneChange]);

  useEffect(()=>{
    const root=shellRef.current;if(!root||!sceneTextOverrides)return;
    let applying=false;
    const apply=()=>{
      if(applying)return;applying=true;
      try{
        const scene=root.dataset.scene||"";const overrides=sceneTextOverrides[scene];if(!overrides)return;
        const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node=walker.nextNode();
        while(node){
          const textNode=node as Text;const parent=textNode.parentElement;const raw=textNode.textContent||"";const source=raw.trim();
          if(source&&parent&&!parent.closest(".thi-progress,.thi-scene-meta,.thi-reset-journey,.soundtrack-control")){
            const replacement=overrides[source];
            if(typeof replacement==="string"){
              const leading=raw.match(/^\s*/)?.[0]||"";const trailing=raw.match(/\s*$/)?.[0]||"";
              const nextValue=leading+replacement+trailing;if(raw!==nextValue)textNode.textContent=nextValue;
            }
          }
          node=walker.nextNode();
        }
      }finally{applying=false}
    };
    apply();
    const observer=new MutationObserver(()=>queueMicrotask(apply));
    observer.observe(root,{childList:true,characterData:true,subtree:true});
    return()=>observer.disconnect();
  },[sceneTextOverrides,sceneIndex,runId]);

  const token=(value:string)=>value.replaceAll("{giver}",experience.demoGiver).replaceAll("{recipient}",experience.demoRecipient).replaceAll("{opening}",experience.opening).replaceAll("{closing}",experience.closing);
  const countText=(one:string,many:string,count:number)=>token((count===1?one:many).replace("{count}",String(count)));
  const titleLines=(parts:string[])=>parts.map((line,index)=><span key={`${line}-${index}`}>{token(line)}{index<parts.length-1&&<br/>}</span>);
  const memoryLines=(copy.memories.items.length?copy.memories.items:["Ese día todavía no sabíamos todo lo que iba a venir.","Los mejores recuerdos casi nunca avisan que van a ser importantes.","Sin darnos cuenta, empezamos a coleccionar un mundo propio."]).map((line,index)=>index===0&&storyContext?.anecdote?.trim()?storyContext.anecdote.trim():line);
  const starLines=copy.stars.items.length?copy.stars.items:["Tu forma de hacer hogar.","Cómo te reís cuando te olvidás de cuidarte.","La calma que traés sin darte cuenta.","Todo lo que todavía soñamos.","Que te volvería a elegir."];
  const balloonLines=copy.balloons.items.length?copy.balloons.items:["Te queremos","Tu risa","Hoy mandás vos","Una salida","Un abrazo","Nunca cambies"];
  const timelineEntries=copy.timeline.entries.length?copy.timeline.entries:[{title:"El comienzo",body:"Cuando todavía no sabíamos en qué se iba a convertir todo esto."},{title:"Ese día",body:"Uno de esos momentos que después entendemos que fueron gigantes."},{title:"Hoy",body:"La historia sigue. Y eso es lo mejor."}];
  const voiceEntries=copy.voices.entries.length?copy.voices.entries:[{name:experience.demoGiver,message:"Esto es sólo una pequeña forma de decirte cuánto importás."}];
  const storyDateLabel=storyContext?.keyDate?new Intl.DateTimeFormat("es-AR",{day:"numeric",month:"long",year:"numeric"}).format(new Date(`${storyContext.keyDate}T12:00:00`)):"";
  const currentPhotos=(photoMedia||[]).filter(item=>mediaBelongsToScene("image",item.scene,current));
  const currentAudios=(audioMedia||[]).filter(item=>mediaBelongsToScene("audio",item.scene,current));
  const currentVideos=(videoMedia||[]).filter(item=>mediaBelongsToScene("video",item.scene,current));
  const demoPhotos=(experience.demo.photos||[]).map((item,index)=>({url:item.url,caption:memoryLines[index]||undefined,fit:"cover" as const,position:item.position||"center" as const}));
  const displayPhotos=current==="memories"?(currentPhotos.length?currentPhotos.slice(0,8):customerGift?[]:demoPhotos):[];
  const scenePhotos=currentPhotos.length?currentPhotos.slice(0,8):customerGift?[]:demoPhotos;
  const hasAttachedMedia=(current!=="memories"&&currentPhotos.length>0)||(current!=="voices"&&currentAudios.length>0)||(current!=="video"&&currentVideos.length>0);

  const fadeSoundtrack=(target:number,duration=650)=>{
    const audio=soundtrackRef.current;if(!audio)return;
    if(soundtrackFadeRef.current!==null)cancelAnimationFrame(soundtrackFadeRef.current);
    const start=audio.volume;let startedAt:number|null=null;
    const tick=(now:number)=>{if(startedAt===null)startedAt=now;const elapsed=Math.min(1,(now-startedAt)/duration);const eased=1-Math.pow(1-elapsed,3);audio.volume=Math.max(0,Math.min(1,start+(target-start)*eased));if(elapsed<1)soundtrackFadeRef.current=requestAnimationFrame(tick);else soundtrackFadeRef.current=null};
    soundtrackFadeRef.current=requestAnimationFrame(tick);
  };
  const startSoundtrack=async()=>{const audio=soundtrackRef.current;if(!audio||soundtrackStarted)return;try{audio.volume=0;await audio.play();setSoundtrackStarted(true);setSoundtrackPaused(false);fadeSoundtrack(.24,1500)}catch{}};
  const pauseSoundtrack=()=>{const audio=soundtrackRef.current;if(!audio||audio.paused)return;fadeSoundtrack(0,260);window.setTimeout(()=>{audio.pause();setSoundtrackPaused(true)},280)};
  const resumeSoundtrack=async()=>{const audio=soundtrackRef.current;if(!audio)return;try{audio.volume=0;await audio.play();setSoundtrackStarted(true);setSoundtrackPaused(false);fadeSoundtrack(.24,520)}catch{}};
  const duckSoundtrack=()=>{if(soundtrackStarted&&!soundtrackPaused)fadeSoundtrack(.055,260)};
  const restoreSoundtrack=()=>{if(soundtrackStarted&&!soundtrackPaused)fadeSoundtrack(["finale","proposal"].includes(current)?.11:.24,520)};
  useEffect(()=>{if(soundtrackStarted&&!soundtrackPaused)fadeSoundtrack(["finale","proposal"].includes(current)?.11:.24,900)},[current,soundtrackStarted,soundtrackPaused]);
  useEffect(()=>()=>{if(soundtrackFadeRef.current!==null)cancelAnimationFrame(soundtrackFadeRef.current);if(typeof window!=="undefined"&&"speechSynthesis" in window){try{window.speechSynthesis.cancel()}catch{}}},[]);
  const handleMediaPlay=(event:React.SyntheticEvent<HTMLElement>)=>{if((event.target as HTMLElement)===soundtrackRef.current)return;duckSoundtrack()};
  const handleMediaRest=()=>restoreSoundtrack();

  const resetAllInteractions=()=>{setStars([]);setLastStar(null);setLetterOpen(false);setScratched(false);setCandlesOut(false);setPopped([]);setQuizChoice(null);setVaultOpen(false);setCapsuleOpen(false);setVoicesPlayed([]);setDemoVoiceStatus("idle");setMamaVoiceIndex(null);setMamaVoiceProgress(0);setMamaVoiceRealPlaying(false);setDoorOpen(false);setLightRevealed(false);setHoldRevealed(false);setArchiveOpen(false);setHomeOpen([]);setLegacyOpen(false);setRitualsOpen([]);setChapterOpen([]);setFutureOpen(false);setReasonsOpen([]);setCertaintyOpen([]);setThresholdHolding(false);setThresholdOpen(false);setCareOpen([]);setSacrificesOpen([]);setLessonsOpen([]);setPresenceOpen([]);setInheritanceOpen([]);setReturnOpen(false);setLookbackOpen(false);setCasefileOpen(false);setInsideJokesOpen([]);setIncidentsOpen([]);setProofOpen([]);setPactOpen([]);setFinalReaction(null);setMamaMemoryIndex(0)};
  const resetSceneState=(type:SceneType)=>{if(type==="stars"){setStars([]);setLastStar(null)};if(type==="letter")setLetterOpen(false);if(type==="scratch")setScratched(false);if(type==="candles")setCandlesOut(false);if(type==="balloons")setPopped([]);if(type==="quiz")setQuizChoice(null);if(type==="vault")setVaultOpen(false);if(type==="capsule")setCapsuleOpen(false);if(type==="voices"){setVoicesPlayed([]);setDemoVoiceStatus("idle");setMamaVoiceIndex(null);setMamaVoiceProgress(0);setMamaVoiceRealPlaying(false)};if(type==="door")setDoorOpen(false);if(type==="light")setLightRevealed(false);if(type==="hold")setHoldRevealed(false);if(type==="archive")setArchiveOpen(false);if(type==="home")setHomeOpen([]);if(type==="legacy")setLegacyOpen(false);if(type==="rituals")setRitualsOpen([]);if(type==="chapters")setChapterOpen([]);if(type==="future")setFutureOpen(false);if(type==="reasons")setReasonsOpen([]);if(type==="certainty")setCertaintyOpen([]);if(type==="threshold"){setThresholdHolding(false);setThresholdOpen(false)};if(type==="care")setCareOpen([]);if(type==="sacrifices")setSacrificesOpen([]);if(type==="lessons")setLessonsOpen([]);if(type==="presence")setPresenceOpen([]);if(type==="inheritance")setInheritanceOpen([]);if(type==="return")setReturnOpen(false);if(type==="lookback")setLookbackOpen(false);if(type==="casefile")setCasefileOpen(false);if(type==="insidejokes")setInsideJokesOpen([]);if(type==="incidents")setIncidentsOpen([]);if(type==="proof")setProofOpen([]);if(type==="pact")setPactOpen([]);if(type==="finale")setFinalReaction(null);if(type==="memories")setMamaMemoryIndex(0)};
  const haptic=(pattern:number|number[]=10)=>{if(typeof navigator!=="undefined"&&"vibrate" in navigator){try{navigator.vibrate(pattern)}catch{}}};
  const passiveHapticPatterns:Record<string,number|number[]>={
    "archive-open":[10,28,8],
    "home-memory":7,
    "legacy-open":[9,24,9],
    "ritual-open":7,
    "chapter-open":[7,18,7],
    "future-open":[9,28,10],
    "reason-open":7,
    "certainty-open":[7,16,7],
    "care-open":7,
    "sacrifice-open":[8,20,8],
    "return-open":[11,30,9],
    "lesson-open":7,
    "presence-open":7,
    "inheritance-open":[7,18,7],
    "lookback-open":[9,24,9],
    "casefile-open":[10,30,8],
    "insidejoke-open":7,
    "incident-open":[8,18,8],
    "proof-open":7,
    "pact-open":[8,20,8],
  };
  const handlePassiveHaptic=(event:ReactMouseEvent<HTMLElement>)=>{
    const target=event.target as Element|null;
    const control=target?.closest<HTMLElement>("[data-action]");
    if(!control||control.matches(":disabled,.open,.signed"))return;
    const pattern=passiveHapticPatterns[control.dataset.action||""];
    if(pattern!==undefined)haptic(pattern);
  };
  const stopDemoVoice=()=>{demoVoiceRunRef.current+=1;demoVoiceMessageRef.current=null;setDemoVoiceStatus("idle");if(mamaVoiceAudioRef.current){try{mamaVoiceAudioRef.current.pause()}catch{}}setMamaVoiceRealPlaying(false);if(typeof window!=="undefined"&&"speechSynthesis" in window){try{window.speechSynthesis.cancel()}catch{}}restoreSoundtrack()};
  const toggleDemoVoice=(message:string)=>{
    try{
      if(typeof window==="undefined"||!("speechSynthesis" in window))return;
      const synth=window.speechSynthesis;
      if(demoVoiceMessageRef.current===message&&demoVoiceStatus==="playing"){synth.pause();setDemoVoiceStatus("paused");restoreSoundtrack();return}
      if(demoVoiceMessageRef.current===message&&demoVoiceStatus==="paused"){synth.resume();setDemoVoiceStatus("playing");duckSoundtrack();return}
      synth.cancel();
      const run=++demoVoiceRunRef.current;
      const utterance=new SpeechSynthesisUtterance(message);
      utterance.lang="es-AR";utterance.rate=.92;utterance.pitch=.9;
      const voices=synth.getVoices();
      const preferred=voices.find(v=>v.lang.toLowerCase().startsWith("es-ar"))||voices.find(v=>v.lang.toLowerCase().startsWith("es"));
      if(preferred)utterance.voice=preferred;
      const finish=()=>{if(demoVoiceRunRef.current!==run)return;demoVoiceMessageRef.current=null;setDemoVoiceStatus("idle");restoreSoundtrack()};
      utterance.onend=finish;utterance.onerror=finish;
      demoVoiceMessageRef.current=message;setDemoVoiceStatus("playing");duckSoundtrack();synth.speak(utterance);
    }catch{}
  };
  const commitSceneIndex=(nextIndex:number)=>{const destination=scenes[nextIndex];if(previewScene&&onSceneChange&&destination){onSceneChange(destination,nextIndex,total);return}setInternalSceneIndex(nextIndex)};
  const restart=()=>{stopDemoVoice();resetAllInteractions();setDirection("back");setTransitioning(false);commitSceneIndex(0);setRunId(v=>v+1);haptic([8,22,8])};
  const playFx=(kind:"chime"|"pop"|"door"|"seal"|"unlock")=>{try{const context=new AudioContext();const oscillator=context.createOscillator();const gain=context.createGain();const now=context.currentTime;oscillator.connect(gain);gain.connect(context.destination);const presets={chime:{type:"sine" as OscillatorType,start:760,end:1180,duration:.34,volume:.035},pop:{type:"triangle" as OscillatorType,start:240,end:72,duration:.12,volume:.05},door:{type:"sine" as OscillatorType,start:95,end:48,duration:.42,volume:.035},seal:{type:"triangle" as OscillatorType,start:330,end:180,duration:.18,volume:.035},unlock:{type:"sine" as OscillatorType,start:420,end:820,duration:.42,volume:.035}};const preset=presets[kind];oscillator.type=preset.type;oscillator.frequency.setValueAtTime(preset.start,now);oscillator.frequency.exponentialRampToValueAtTime(Math.max(1,preset.end),now+preset.duration);gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(preset.volume,now+.02);gain.gain.exponentialRampToValueAtTime(.0001,now+preset.duration);oscillator.start(now);oscillator.stop(now+preset.duration+.02);window.setTimeout(()=>void context.close(),Math.ceil((preset.duration+.1)*1000))}catch{}};

  const moveTo=(nextIndex:number,dir:"forward"|"back")=>{if(nextIndex<0||nextIndex>=total||nextIndex===sceneIndex)return;stopDemoVoice();const destination=scenes[nextIndex];const commitScene=()=>{resetSceneState(destination);setDirection(dir);setTransitioning(false);commitSceneIndex(nextIndex);setRunId(v=>v+1)};haptic(8);if(typeof document!=="undefined"&&typeof window!=="undefined"){const viewDocument=document as Document&{startViewTransition?:(update:()=>void)=>unknown};const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;if(viewDocument.startViewTransition&&!reduced){viewDocument.startViewTransition(()=>flushSync(commitScene));return}}commitScene()};
  const next=()=>moveTo(Math.min(total-1,sceneIndex+1),"forward");const prev=()=>moveTo(Math.max(0,sceneIndex-1),"back");
  const openDoor=()=>{if(doorOpen)return;setDoorOpen(true);haptic([12,35,9]);playFx("door")};
  const openLetter=()=>{if(letterOpen)return;setLetterOpen(true);haptic([10,30,8]);playFx("seal")};

  const canAdvance=()=>{switch(current){case"intro":case"memories":case"timeline":case"video":case"origin":case"childhood":return true;case"door":return doorOpen;case"light":return lightRevealed;case"hold":return holdRevealed;case"stars":return experience.slug==="pareja"?stars.length>=starLines.length:stars.length>=3;case"scratch":return scratched;case"letter":return letterOpen;case"candles":return candlesOut;case"balloons":return popped.length>=3;case"voices":return experience.slug==="mama"?voicesPlayed.length>=Math.min(3,currentAudios.length||voiceEntries.length):voicesPlayed.length>0;case"quiz":return quizChoice!==null;case"vault":return vaultOpen;case"capsule":return capsuleOpen;case"archive":return archiveOpen;case"home":return homeOpen.length>=3;case"legacy":return legacyOpen;case"rituals":return ritualsOpen.length>=3;case"chapters":return chapterOpen.length>=2;case"future":return futureOpen;case"reasons":return reasonsOpen.length>=3;case"certainty":return certaintyOpen.length>=3;case"threshold":return thresholdOpen;case"care":return careOpen.length>=3;case"sacrifices":return experience.slug==="mama"?sacrificesOpen.length>=4:sacrificesOpen.length>=3;case"return":return returnOpen;case"lessons":return lessonsOpen.length>=3;case"presence":return presenceOpen.length>=2;case"inheritance":return inheritanceOpen.length>=3;case"lookback":return lookbackOpen;case"casefile":return casefileOpen;case"insidejokes":return insideJokesOpen.length>=3;case"incidents":return incidentsOpen.length>=3;case"proof":return proofOpen.length>=3;case"pact":return pactOpen.length>=3;default:return false}};

  function scene(type:SceneType){
    switch(type){
      case"intro":
        if(experience.slug==="mama")return <section className="thi-scene thi-mama-intro thi-scene-rich">
          <div className="thi-mama-intro-atmosphere" aria-hidden="true"><i/><i/><i/><i/><b/><b/></div>
          <p className="thi-kicker">{token(copy.intro.kicker)}</p>
          <h1>{token(copy.intro.title)}</h1>
          <div className="thi-mama-intro-divider" aria-hidden="true"><span/></div>
          <p className="thi-lead">{token(copy.intro.lead)}</p>
          <button data-action="advance" className="thi-mama-intro-cta" onClick={next}><span>{token(copy.intro.cta)}</span><b>→</b></button>
        </section>;
        return <section className="thi-scene thi-intro thi-scene-rich"><div className="thi-glow a"/><div className="thi-glow b"/><div className="thi-intro-constellation" aria-hidden="true"><i/><i/><i/><i/><i/><i/></div><p className="thi-kicker">{token(copy.intro.kicker)}</p><h1>{token(copy.intro.title)}</h1>{experience.slug==="pareja"?<p className="thi-intro-whisper">{token(copy.intro.footnote)}</p>:<div className="thi-hairline"/>}<p className="thi-lead">{token(copy.intro.lead)}</p><button data-action="advance" className="thi-primary thi-primary-premium" onClick={next}><span>{token(copy.intro.cta)}</span><b>→</b></button>{experience.slug!=="pareja"&&<small>{token(copy.intro.footnote)}</small>}</section>;
      case"door":return experience.slug==="pareja"?<section className={`thi-scene thi-pair-threshold ${doorOpen?"is-open":""}`}><div className="thi-pair-threshold-atmosphere" aria-hidden="true"/><div className="thi-pair-threshold-orbit" aria-hidden="true"/><div className="thi-pair-threshold-copy"><p className="thi-kicker">{token(copy.door.kicker)}</p><h2>{titleLines(copy.door.title)}</h2></div><button data-action="open-door" className="thi-pair-threshold-door" onClick={openDoor} aria-label={doorOpen?"Puerta abierta":token(copy.door.closedHint)}><span className="thi-pair-threshold-frame"><span className="thi-pair-threshold-light"/><span className="thi-pair-threshold-leaf"><i/></span><span className="thi-pair-threshold-floor"/></span></button>{!doorOpen?<p className="thi-pair-threshold-hint">{token(copy.door.closedHint)}</p>:<><p className="thi-pair-threshold-whisper">Del otro lado estamos nosotros.</p><button data-action="advance" className="thi-pair-threshold-cta" onClick={next}><span>{token(copy.door.openCta).replace(/\s*→\s*$/,"")}</span><b>→</b></button></>}</section>:<section className="thi-scene thi-scene-door thi-scene-rich"><p className="thi-kicker">{token(copy.door.kicker)}</p><h2>{titleLines(copy.door.title)}</h2><div className="thi-door-light" aria-hidden="true"/><div className="thi-door-floor" aria-hidden="true"/><button data-action="open-door" className={`thi-door-wrap ${doorOpen?"opening":""}`} onClick={openDoor}><span className="thi-door-frame"><span className="thi-door"><i/><b/></span><span className="thi-door-world"/></span></button>{!doorOpen?<p className="thi-hint">{token(copy.door.closedHint)}</p>:<button data-action="advance" className="thi-primary thi-door-enter" onClick={next}>{token(copy.door.openCta)}</button>}</section>;
      case"memories":{
        if(experience.slug==="mama"){
          const mamaMemoryItems=(displayPhotos.length?displayPhotos:memoryLines.map(caption=>({url:"",caption,fit:"cover" as const,position:"center" as const}))).slice(0,3);
          const safeItems=mamaMemoryItems.length?mamaMemoryItems:[{url:"",caption:memoryLines[0]||"",fit:"cover" as const,position:"center" as const}];
          const active=Math.min(mamaMemoryIndex,safeItems.length-1);
          const labels=["LO COTIDIANO","LO QUE CUIDABA","LO QUE QUEDA"];
          const goMemory=(nextIndex:number)=>{const clamped=Math.max(0,Math.min(safeItems.length-1,nextIndex));if(clamped===active)return;setMamaMemoryIndex(clamped);haptic(7)};
          const memorySwipeStart=(event:ReactPointerEvent<HTMLDivElement>)=>{
            if(!event.isPrimary)return;
            mamaMemorySwipeRef.current={pointerId:event.pointerId,x:event.clientX,y:event.clientY};
            try{event.currentTarget.setPointerCapture(event.pointerId)}catch{}
          };
          const memorySwipeEnd=(event:ReactPointerEvent<HTMLDivElement>)=>{
            const start=mamaMemorySwipeRef.current;
            if(start.pointerId!==event.pointerId)return;
            mamaMemorySwipeRef.current={pointerId:null,x:0,y:0};
            try{if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId)}catch{}
            const dx=event.clientX-start.x;
            const dy=event.clientY-start.y;
            if(Math.abs(dx)<46||Math.abs(dx)<Math.abs(dy)*1.2)return;
            if(dx<0&&active<safeItems.length-1)goMemory(active+1);
            if(dx>0&&active>0)goMemory(active-1);
          };
          const memorySwipeCancel=(event:ReactPointerEvent<HTMLDivElement>)=>{
            if(mamaMemorySwipeRef.current.pointerId!==event.pointerId)return;
            mamaMemorySwipeRef.current={pointerId:null,x:0,y:0};
          };
          return <section className="thi-scene thi-mama-memories thi-scene-rich">
            <div className="thi-mama-memories-atmosphere" aria-hidden="true"><i/><i/><b/><b/></div>
            <p className="thi-kicker">{token(copy.memories.kicker)}</p>
            <h2>{titleLines(copy.memories.title)}</h2>
            <div className="thi-mama-memory-deck" data-active={active} onPointerDown={memorySwipeStart} onPointerUp={memorySwipeEnd} onPointerCancel={memorySwipeCancel} aria-label="Álbum de recuerdos. Deslizá hacia los costados para cambiar de foto.">
              {safeItems.map((item,i)=>{
                const relation=i-active;
                const positionClass=relation===0?"is-active":relation===-1?"is-prev":relation===1?"is-next":"is-hidden";
                return <button type="button" data-action="mama-memory-card" className={`thi-mama-memory-card ${positionClass}`} key={item.url||item.caption||i} onClick={()=>relation!==0&&goMemory(i)} aria-label={relation===0?`Recuerdo ${i+1} activo`:`Ver recuerdo ${i+1}`}>
                  <span className="thi-mama-memory-photo">
                    {item.url&&<img src={item.url} alt="" loading="eager" decoding="async" referrerPolicy="no-referrer" style={{objectFit:item.fit||"cover",objectPosition:item.position||"center"}}/>}
                    <i aria-hidden="true"/>
                  </span>
                  <span className="thi-mama-memory-caption">
                    <small>{String(i+1).padStart(2,"0")} · {labels[i]||"RECUERDO"}</small>
                    <em aria-hidden="true"/>
                    <strong>{token(item.caption||memoryLines[i%memoryLines.length])}</strong>
                  </span>
                </button>;
              })}
            </div>
            <div className="thi-mama-memory-local-nav">
              <button type="button" aria-label={active===0?"Volver a Infancia":"Recuerdo anterior"} onClick={()=>active===0?prev():goMemory(active-1)}>←</button>
              <div aria-label={`Recuerdo ${active+1} de ${safeItems.length}`}>{safeItems.map((_,i)=><button type="button" key={i} className={i===active?"is-active":""} aria-label={`Ir al recuerdo ${i+1}`} onClick={()=>goMemory(i)}/>)}</div>
              <button type="button" aria-label="Recuerdo siguiente" disabled={active>=safeItems.length-1} onClick={()=>goMemory(active+1)}>→</button>
            </div>
            {active>=safeItems.length-1?<button data-action="advance" className="thi-mama-memories-continue" onClick={next}>Seguir con la historia <span>→</span></button>:<p className="thi-mama-memory-hint">deslizá para recorrer los recuerdos <span>→</span></p>}
          </section>;
        }
        return <section className="thi-scene thi-scene-memories thi-scene-rich"><p className="thi-kicker">{token(copy.memories.kicker)}</p><h2>{titleLines(copy.memories.title)}</h2>{storyDateLabel&&<p className="thi-memory-date-stamp">{storyDateLabel}</p>}<div className="thi-film">{(displayPhotos.length?displayPhotos:memoryLines.map(caption=>({url:"",caption,fit:"cover" as const,position:"center" as const}))).map((item,i)=><article className={`thi-memory m${(i%3)+1}`} key={item.url||item.caption||i}><div className="thi-memory-photo">{item.url&&<img src={item.url} alt="" loading="eager" decoding="async" referrerPolicy="no-referrer" style={{objectFit:item.fit||"cover",objectPosition:item.position||"center"}}/>}<span>{String(i+1).padStart(2,"0")}</span><i className="thi-photo-sheen"/></div><p>{token(item.caption||memoryLines[i%memoryLines.length])}</p></article>)}</div><button data-action="advance" className="thi-primary" onClick={next}>{token(copy.memories.cta)}</button></section>;
      }
      case"light":return <section className={`thi-scene thi-scene-light thi-scene-rich ${experience.slug==="pareja"?"thi-pair-light-scene":""}`}><p className="thi-kicker">{token(copy.light.kicker)}</p><h2>{token(copy.light.title)}</h2><LightReveal accent={experience.accent} kicker={token(copy.light.kicker)} title={token(copy.light.title)} secret={token(copy.light.secret)} hint={token(copy.light.hint)} revealedLabel={token(copy.light.revealedLabel)} ariaLabel={token(copy.light.ariaLabel)} revealed={lightRevealed} cinematic={experience.slug==="pareja"} photoUrl={(scenePhotos[1]||scenePhotos[0])?.url} photoPosition={(scenePhotos[1]||scenePhotos[0])?.position||"center"} onReveal={()=>{setLightRevealed(true);haptic([7,20,10]);playFx("chime")}}/>{lightRevealed&&<button data-action="advance" className={`thi-primary ${experience.slug==="pareja"?"thi-pair-light-continue":""}`} onClick={next}>{token(copy.light.cta)}</button>}</section>;
      case"stars":return <section className={`thi-scene thi-scene-stars thi-scene-rich ${experience.slug==="pareja"?"thi-pair-stars-scene":""}`}><div className="thi-sky-dust" aria-hidden="true"/><p className="thi-kicker">{token(copy.stars.kicker)}</p><h2>{titleLines(copy.stars.title)}</h2>{experience.slug==="pareja"?<div className={`thi-pair-constellation ${stars.length===starLines.length?"is-complete":""}`}>
        <svg className="thi-pair-constellation-lines" viewBox="0 0 760 390" aria-hidden="true">
          <path className={stars.length>=2?"is-drawn":""} d="M105 292 L316 170"/>
          <path className={stars.length>=3?"is-drawn":""} d="M316 170 L586 91"/>
          <path className={stars.length>=4?"is-drawn":""} d="M586 91 L675 232"/>
          <path className={stars.length>=5?"is-drawn":""} d="M675 232 L502 330"/>
          <path className={stars.length>=5?"is-drawn":""} d="M502 330 L105 292"/>
        </svg>
        {starLines.map((line,i)=>{
          const discovered=stars.includes(i);
          const active=!discovered&&i===stars.length;
          return <button
            data-action="star"
            aria-label={discovered?token(line):active?`Descubrir cosa ${i+1}`:`Primero descubrí la luz ${stars.length+1}`}
            key={line}
            disabled={!active}
            className={`thi-pair-star-node n${i+1} ${discovered?"is-discovered":""} ${active?"is-active":""}`}
            onClick={()=>{
              if(!active)return;
              setStars(v=>[...v,i]);
              setLastStar(i);
              haptic([7,18,9]);
              playFx("chime");
            }}
          ><span aria-hidden="true"/><i aria-hidden="true"/></button>;
        })}
      </div>:<div className={`thi-stars ${stars.length>=3?"complete":""}`}><svg className="thi-constellation-lines" viewBox="0 0 700 350" aria-hidden="true"><path d="M105 66 L585 50 L350 175 L130 305 L570 300 L350 175 Z"/></svg>{starLines.map((line,i)=><button data-action="star" key={line} className={stars.includes(i)?"revealed":""} onClick={()=>{setStars(v=>v.includes(i)?v:[...v,i]);haptic(9);playFx("chime")}}><span>✦</span><em>{stars.includes(i)?token(line):token(copy.stars.hiddenLabel)}</em><i/></button>)}{stars.length>=3&&<div className="thi-constellation-complete"><span>✦</span><small>{token(copy.stars.completeLabel)}</small></div>}</div>}
      {experience.slug==="pareja"?<div className={`thi-pair-stars-story ${lastStar!==null?"has-story":""} ${stars.length===starLines.length?"is-complete":""}`}>
        <small>{lastStar===null?"01 — 05":`${String((lastStar||0)+1).padStart(2,"0")} — ${String(starLines.length).padStart(2,"0")}`}</small>
        <blockquote>{lastStar===null?"Tocá la primera luz.":token(starLines[lastStar])}</blockquote>
        {stars.length===starLines.length&&<div className="thi-pair-stars-finale"><i/><strong>Ya estaban todas ahí.</strong><span>{token("Cinco cosas tuyas que {giver} no quería dejar sin decir.")}</span></div>}
      </div>:null}
      {experience.slug==="pareja"?(stars.length===starLines.length&&<button data-action="advance" className="thi-pair-stars-cta" onClick={next}>{token(copy.stars.cta)}</button>):<button data-action="advance" className="thi-primary" disabled={stars.length<3} onClick={next}>{stars.length<3?countText(copy.stars.remainingOne,copy.stars.remainingMany,3-stars.length):token(copy.stars.cta)}</button>}</section>;
      case"scratch":return <section className="thi-scene thi-scene-scratch thi-scene-rich"><p className="thi-kicker">{token(copy.scratch.kicker)}</p><h2>{titleLines(copy.scratch.title)}</h2><ScratchReveal accent={experience.accent} eyebrow={token(copy.scratch.eyebrow)} reward={token(copy.scratch.reward)} note={token(copy.scratch.note)} coverTitle={token(copy.scratch.coverTitle)} coverHint={token(copy.scratch.coverHint)} fallbackLabel={token(copy.scratch.fallbackLabel)} revealed={scratched} onReveal={()=>{setScratched(true);haptic([8,20,8]);playFx("chime")}}/><button data-action="advance" className="thi-primary" disabled={!scratched} onClick={next}>{token(copy.scratch.cta)}</button></section>;
      case"hold":return <section className="thi-scene thi-scene-hold thi-scene-rich"><p className="thi-kicker">{token(copy.hold.kicker)}</p><h2>{titleLines(copy.hold.title)}</h2><HoldReveal accent={experience.accent} symbol={token(copy.hold.symbol)} prompt={token(copy.hold.prompt)} reveal={token(copy.hold.reveal)} instruction={token(copy.hold.instruction)} revealed={holdRevealed} cinematic={experience.slug==="pareja"} onReveal={()=>{setHoldRevealed(true);haptic([18,45,18,45,28]);playFx("seal")}}/>{holdRevealed&&<button data-action="advance" className="thi-primary" onClick={next}>{token(copy.hold.cta)}</button>}</section>;
      case"letter":return <section className={`thi-scene thi-scene-letter thi-scene-rich ${experience.slug==="pareja"?"thi-pair-letter":""} ${experience.slug==="mama"?"thi-mama-letter":""} ${letterOpen?"is-open":""}`}>
        <div className="thi-pair-letter-atmosphere" aria-hidden="true"><i/><i/><i/><i/><b/><b/></div>
        <p className="thi-kicker">{token(copy.letter.kicker)}</p>
        <h2>{titleLines(copy.letter.title)}</h2>
        <div className="thi-letter-aura" aria-hidden="true"/>
        <button
          data-action="open-letter"
          className={`thi-envelope ${letterOpen?"open":""}`}
          onClick={()=>{
            if(experience.slug==="mama"&&mamaLetterSwipeRef.current.swiped){
              mamaLetterSwipeRef.current={pointerId:null,x:0,y:0,swiped:false};
              return;
            }
            openLetter();
          }}
          onPointerDown={experience.slug==="mama"?(event)=>{
            if(letterOpen||!event.isPrimary)return;
            mamaLetterSwipeRef.current={pointerId:event.pointerId,x:event.clientX,y:event.clientY,swiped:false};
            try{event.currentTarget.setPointerCapture(event.pointerId)}catch{}
          }:undefined}
          onPointerUp={experience.slug==="mama"?(event)=>{
            const start=mamaLetterSwipeRef.current;
            if(letterOpen||start.pointerId!==event.pointerId)return;
            const dx=event.clientX-start.x;
            const dy=event.clientY-start.y;
            const swiped=Math.abs(dx)>=42&&Math.abs(dx)>Math.abs(dy)*1.1;
            mamaLetterSwipeRef.current={pointerId:null,x:0,y:0,swiped};
            try{if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId)}catch{}
            if(swiped)openLetter();
          }:undefined}
          onPointerCancel={experience.slug==="mama"?(event)=>{
            if(mamaLetterSwipeRef.current.pointerId!==event.pointerId)return;
            mamaLetterSwipeRef.current={pointerId:null,x:0,y:0,swiped:false};
          }:undefined}
          aria-label={letterOpen?"Carta abierta":experience.slug==="mama"?"Deslizá para abrir la carta":token(copy.letter.sealHint)}
        >
          <span className="back"/>
          <span className="flap"/>
          <span className="paper">
            <small>{token(copy.letter.recipientLabel)}</small>
            <strong>{copyOverride?.letter?.body?token(String(copyOverride.letter.body)):letterText||token(copy.letter.body)}</strong>
            <em>{token(copy.letter.signature)}</em>
          </span>
          <span className="front"/>
          <span className="wax"><i/><b>♥</b></span>
        </button>
        {!letterOpen?<p className="thi-hint">{experience.slug==="pareja"?"Tocá el sello":experience.slug==="mama"?"Deslizá para abrir":token(copy.letter.sealHint)}</p>:<button data-action="advance" className={experience.slug==="pareja"?"thi-letter-continue":"thi-primary"} onClick={next}>{experience.slug==="pareja"?"Continuar →":token(copy.letter.cta)}</button>}
      </section>;
      case"candles":return <section className="thi-scene thi-scene-candles thi-scene-rich"><p className="thi-kicker">{token(copy.candles.kicker)}</p><h2>{titleLines(copy.candles.title)}</h2>{experience.slug==="cumpleanos"?<div className={`thi-birthday-ritual ${candlesOut?"out":""}`}>
        <div className="thi-birthday-candlelight" aria-hidden="true"/>
        <div className="thi-birthday-table" aria-hidden="true"/>
        <div className="thi-birthday-cake-premium" aria-label="Torta de cumpleaños con cinco velas">
          <span className="thi-birthday-cake-edge"/><span className="thi-birthday-cake-top"/>
          <div className="thi-birthday-candles">{[0,1,2,3,4].map(i=><span className={`c${i+1}`} key={i}><b/><i/><em/></span>)}</div>
        </div>
        <p>{candlesOut?"Tu deseo queda entre vos y las velas.":"Cerrá los ojos un segundo."}</p>
      </div>:<div className={`thi-cake ${candlesOut?"out":""}`}><div className="thi-cake-shadow"/><div className="thi-cake-plate"/><div className="thi-cake-body"><span className="thi-cake-top"/><span className="thi-cake-icing"/><span className="thi-cake-sprinkles"/></div><div className="thi-candles">{[0,1,2,3,4].map(i=><span key={i}><i/><b/></span>)}</div></div>}<CandleBlow blown={candlesOut} labels={{idle:token(copy.candles.micIdle),active:token(copy.candles.micActive),fallback:token(copy.candles.tapFallback),unavailable:token(copy.candles.tapUnavailable)}} onBlow={()=>{setCandlesOut(true);haptic([10,20,10]);playFx("chime")}}/>{candlesOut&&<><p className="thi-wish-made">{token(copy.candles.wishLabel)}</p><button data-action="advance" className="thi-ghost" onClick={next}>{token(copy.candles.cta)}</button></>}</section>;
      case"balloons":return <section className="thi-scene thi-scene-balloons thi-scene-rich"><p className="thi-kicker">{token(copy.balloons.kicker)}</p><h2>{titleLines(copy.balloons.title)}</h2><div className="thi-balloons">{balloonLines.map((line,i)=><button data-action="balloon" key={line} className={popped.includes(i)?"pop":""} onClick={()=>{setPopped(v=>v.includes(i)?v:[...v,i]);haptic(10);playFx("pop")}}><span>{popped.includes(i)?token(line):""}</span><i>{popped.includes(i)?"✦":token(copy.balloons.popLabel)}</i></button>)}</div><button data-action="advance" className="thi-primary" disabled={popped.length<3} onClick={next}>{popped.length<3?countText(copy.balloons.remainingOne,copy.balloons.remainingMany,3-popped.length):token(copy.balloons.cta)}</button></section>;
      case"timeline":return <section className="thi-scene thi-scene-timeline thi-scene-rich"><p className="thi-kicker">{token(copy.timeline.kicker)}</p><h2>{titleLines(copy.timeline.title)}</h2><div className="thi-timeline"><div className="thi-timeline-line" aria-hidden="true"/>{timelineEntries.map((entry,index)=><article key={entry.title}><span>{String(index+1).padStart(2,"0")}</span><i/><strong>{token(entry.title)}</strong><p>{token(entry.body)}</p></article>)}</div><button data-action="advance" className="thi-primary" onClick={next}>{token(copy.timeline.cta)}</button></section>;
      case"voices":{
        if(experience.slug==="mama"){
          const usingRealAudio=currentAudios.length>0;
          const count=Math.min(3,usingRealAudio?currentAudios.length:voiceEntries.length);
          const entries=Array.from({length:count},(_,i)=>{
            const voice=customerGift?undefined:(voiceEntries[i]||voiceEntries[0]);
            const audio=currentAudios[i];
            const photo=scenePhotos[i%Math.max(1,scenePhotos.length)];
            return {
              name:token(audio?.caption||voice?.name||`Mensaje ${i+1}`),
              message:customerGift&&audio?"":token(voice?.message||"Hay algo que quería decirte hace tiempo."),
              audio,
              photo
            };
          });
          const active=mamaVoiceIndex===null?null:Math.min(mamaVoiceIndex,count-1);
          const allHeard=voicesPlayed.length>=count;
          const openVoice=(index:number)=>{
            stopDemoVoice();
            if(mamaVoiceAudioRef.current){try{mamaVoiceAudioRef.current.pause()}catch{}}
            setMamaVoiceRealPlaying(false);setMamaVoiceProgress(0);setMamaVoiceIndex(index);haptic([7,18,7]);
          };
          const backToVoices=()=>{
            stopDemoVoice();
            if(mamaVoiceAudioRef.current){try{mamaVoiceAudioRef.current.pause()}catch{}}
            setMamaVoiceRealPlaying(false);setMamaVoiceProgress(0);setMamaVoiceIndex(null);haptic(6);
          };
          const toggleMamaVoice=async()=>{
            if(active===null)return;
            if(usingRealAudio){
              const audio=mamaVoiceAudioRef.current;if(!audio)return;
              try{if(audio.paused){await audio.play()}else audio.pause()}catch{}
              return;
            }
            setVoicesPlayed(v=>v.includes(active)?v:[...v,active]);
            toggleDemoVoice(entries[active].message);
            haptic(7);
          };
          if(active===null&&allHeard)return <section className="thi-scene thi-mama-voices thi-mama-voices-complete">
            <div className="thi-mama-voices-atmosphere" aria-hidden="true"><i/><i/><b/><b/></div>
            <p className="thi-kicker">Voz</p>
            <div className="thi-mama-voice-checks" aria-label="Tres mensajes escuchados">{entries.map((_,i)=><i key={i}>✓</i>)}</div>
            <div className="thi-mama-voice-photo-stack" aria-hidden="true">{entries.map((entry,i)=><figure key={i} className={`v${i+1}`}>{entry.photo?.url&&<img src={entry.photo.url} alt="" style={{objectFit:entry.photo.fit||"cover",objectPosition:entry.photo.position||"center"}}/>}</figure>)}</div>
            <h2>Tres voces.<br/>Una misma cosa<br/>por decirte.</h2>
            <span className="thi-mama-voice-complete-rule" aria-hidden="true"/>
            <p>Gracias por escuchar todo lo que tenían para decirte.</p>
            <button data-action="advance" className="thi-mama-voice-final-cta" onClick={next}>Seguir <span>→</span></button>
          </section>;
          if(active!==null){
            const entry=entries[active];
            const isPlaying=usingRealAudio?mamaVoiceRealPlaying:demoVoiceStatus==="playing";
            const isPaused=usingRealAudio?!mamaVoiceRealPlaying&&mamaVoiceProgress>0:demoVoiceStatus==="paused";
            const progress=usingRealAudio?mamaVoiceProgress:(isPlaying?38:isPaused?38:voicesPlayed.includes(active)?100:0);
            return <section className="thi-scene thi-mama-voices thi-mama-voice-player">
              <div className="thi-mama-voices-atmosphere" aria-hidden="true"><i/><i/><b/><b/></div>
              <p className="thi-kicker">Voz</p>
              <div className="thi-mama-voice-top-progress"><small>{String(active+1).padStart(2,"0")} / {String(count).padStart(2,"0")}</small><div>{entries.map((_,i)=><i key={i} className={voicesPlayed.includes(i)?"heard":i===active?"active":""}/>)}</div></div>
              <article className="thi-mama-voice-paper">
                <figure>{entry.photo?.url&&<img src={entry.photo.url} alt="" style={{objectFit:entry.photo.fit||"cover",objectPosition:entry.photo.position||"center"}}/>}<span aria-hidden="true"/></figure>
                <small>Un mensaje para vos</small>
                <h2>{entry.name}</h2>
                {entry.message&&<blockquote>“{entry.message}”</blockquote>}
                <div className={`thi-mama-voice-wave ${isPlaying?"is-playing":""}`} style={{"--voice-progress":`${progress}%`} as CSSProperties} aria-hidden="true">{Array.from({length:34}).map((_,bar)=><i key={bar}/>)}</div>
                {usingRealAudio&&<audio
                  ref={mamaVoiceAudioRef}
                  data-action="mama-real-audio"
                  src={entry.audio?.url}
                  preload="metadata"
                  onPlay={()=>{setMamaVoiceRealPlaying(true);setVoicesPlayed(v=>v.includes(active)?v:[...v,active]);duckSoundtrack();haptic(6)}}
                  onPause={()=>{setMamaVoiceRealPlaying(false);restoreSoundtrack()}}
                  onTimeUpdate={event=>{const el=event.currentTarget;setMamaVoiceProgress(el.duration?Math.min(100,(el.currentTime/el.duration)*100):0)}}
                  onEnded={()=>{setMamaVoiceRealPlaying(false);setMamaVoiceProgress(100);setVoicesPlayed(v=>v.includes(active)?v:[...v,active]);restoreSoundtrack()}}
                />}
                <button data-action="mama-voice-toggle" data-voice-state={isPlaying?"playing":isPaused?"paused":voicesPlayed.includes(active)?"played":"idle"} className="thi-mama-voice-play" onClick={toggleMamaVoice} aria-label={isPlaying?"Pausar mensaje":isPaused?"Continuar mensaje":"Escuchar mensaje"}>{isPlaying?"Ⅱ":"▶"}</button>
                <p className="thi-mama-voice-status">{isPlaying?"Escuchando…":isPaused?"Pausado":voicesPlayed.includes(active)?"Mensaje escuchado":"Tocá para escuchar"}</p>
              </article>
              <button data-action="mama-voice-back" className="thi-mama-voice-back" onClick={backToVoices}>{allHeard?"Ya escuché todas":"Escuchar otra voz"} <span>→</span></button>
            </section>;
          }
          return <section className="thi-scene thi-mama-voices thi-mama-voice-picker">
            <div className="thi-mama-voices-atmosphere" aria-hidden="true"><i/><i/><b/><b/></div>
            <p className="thi-kicker">Hay gente esperando decirte algo</p>
            <h2>Hay cosas que<br/>se sienten distinto<br/>cuando las escuchás<br/>en su voz.</h2>
            <p className="thi-mama-voice-prompt">Elegí a quién escuchar primero.</p>
            <div className="thi-mama-voice-list">
              {entries.map((entry,i)=><button type="button" data-action="mama-voice-choice" key={i} className={voicesPlayed.includes(i)?"heard":""} onClick={()=>openVoice(i)}>
                <span className="thi-mama-voice-thumb">{entry.photo?.url&&<img src={entry.photo.url} alt="" style={{objectFit:entry.photo.fit||"cover",objectPosition:entry.photo.position||"center"}}/>}</span>
                <span className="thi-mama-voice-list-copy"><small>{String(i+1).padStart(2,"0")} · UN MENSAJE PARA VOS</small><strong>{entry.name}</strong>{entry.message&&<em>“{entry.message}”</em>}<i className="thi-mama-voice-mini-wave" aria-hidden="true">{Array.from({length:22}).map((_,bar)=><b key={bar}/>)}</i></span>
                <span className="thi-mama-voice-list-play">{voicesPlayed.includes(i)?"✓":"▶"}</span>
              </button>)}
            </div>
          </section>;
        }
        return <section className="thi-scene thi-scene-voices thi-scene-rich"><p className="thi-kicker">{token(copy.voices.kicker)}</p><h2>{titleLines(copy.voices.title)}</h2>{currentAudios.length?<div className="thi-voices">{currentAudios.map((a,i)=><article key={a.url} className={voicesPlayed.includes(i)?"thi-voice-audio played":"thi-voice-audio"}><span>♪</span><strong>{a.caption||`Mensaje ${i+1}`}</strong><audio data-action="real-audio" src={a.url} controls preload="metadata" onPlay={()=>{setVoicesPlayed(v=>v.includes(i)?v:[...v,i]);haptic(6)}}/></article>)}</div>:experience.slug==="pareja"?<div className="thi-romantic-audio">{voiceEntries.slice(0,1).map((voice,i)=><button data-action="demo-voice" key={voice.name} className={`${voicesPlayed.includes(i)?"played ":""}${demoVoiceStatus}`} onClick={()=>{setVoicesPlayed(v=>v.includes(i)?v:[...v,i]);haptic([7,18,7]);toggleDemoVoice(token(voice.message))}} aria-label={demoVoiceStatus==="playing"?"Pausar audio":demoVoiceStatus==="paused"?"Continuar audio":token(copy.voices.playLabel)}><span className="thi-audio-avatar">{voice.name.slice(0,1)}</span><span className="thi-audio-copy"><small>{token(copy.voices.noteLabel.replace("{name}",voice.name))}</small><strong>{demoVoiceStatus==="playing"?token(copy.voices.playingLabel):demoVoiceStatus==="paused"?"Pausado · tocá para continuar":token(copy.voices.playLabel)}</strong><i className="thi-waveform" aria-hidden="true">{Array.from({length:24}).map((_,bar)=><b key={bar}/>)}</i></span><span className="thi-audio-play">{demoVoiceStatus==="playing"?"❚❚":"▶"}</span></button>)}{voicesPlayed.length>0&&<p>“{token(voiceEntries[0].message)}”</p>}</div>:<div className="thi-voices">{voiceEntries.map((voice,i)=><button data-action="demo-voice" key={voice.name} className={voicesPlayed.includes(i)?"played":""} onClick={()=>{setVoicesPlayed(v=>v.includes(i)?v:[...v,i]);haptic(6)}}><span>{voicesPlayed.includes(i)?"▶":"●"}</span><strong>{token(voice.name)}</strong><small>{voicesPlayed.includes(i)?`“${token(voice.message)}”`:token(copy.voices.playLabel)}</small></button>)}</div>}<button data-action="advance" className="thi-primary" disabled={!voicesPlayed.length} onClick={next}>{token(copy.voices.cta)}</button></section>;
      }
      case"quiz":return <section className="thi-scene thi-scene-quiz thi-scene-rich"><p className="thi-kicker">{token(copy.quiz.kicker)}</p><h2>{token(copy.quiz.question)}</h2><div className="thi-quiz">{copy.quiz.answers.map((answer,i)=><button data-action="quiz-answer" key={answer} className={quizChoice!==null&&i===copy.quiz.correctIndex?"ok":quizChoice===i?"wrong":""} onClick={()=>{setQuizChoice(i);haptic(8)}}><span>{String.fromCharCode(65+i)}</span>{token(answer)}<i>{quizChoice!==null&&i===copy.quiz.correctIndex?"✓":quizChoice===i?"·":""}</i></button>)}</div>{quizChoice!==null&&<p className="thi-lead thi-reveal-copy">{token(copy.quiz.after)}</p>}<button data-action="advance" className="thi-primary" disabled={quizChoice===null} onClick={next}>{token(copy.quiz.cta)}</button></section>;
      case"vault":return <section className="thi-scene thi-scene-vault thi-scene-rich"><p className="thi-kicker">{token(copy.vault.kicker)}</p><h2>{titleLines(copy.vault.title)}</h2><div className="thi-vault-aura" aria-hidden="true"/><button data-action="open-vault" className={`thi-vault ${vaultOpen?"open":""}`} onClick={()=>{setVaultOpen(true);haptic([12,40,12]);playFx("unlock")}}><span><i>◇</i><b/></span><strong>{token(vaultOpen?copy.vault.openLabel:copy.vault.closedLabel)}</strong><small>{token(vaultOpen?copy.vault.openSmall:copy.vault.closedSmall)}</small></button>{vaultOpen&&<><p className="thi-lead thi-reveal-copy">{token(copy.vault.reveal)}</p><button data-action="advance" className="thi-primary" onClick={next}>{token(copy.vault.cta)}</button></>}</section>;
      case"capsule":return <section className="thi-scene thi-scene-capsule thi-scene-rich"><p className="thi-kicker">{token(copy.capsule.kicker)}</p><h2>{titleLines(copy.capsule.title)}</h2><button data-action="open-capsule" className={`thi-capsule ${capsuleOpen?"open":""}`} onClick={()=>{setCapsuleOpen(true);haptic([8,25,8])}}><span>{token(copy.capsule.year)}<i/></span><strong>{token(capsuleOpen?copy.capsule.openLabel:copy.capsule.closedLabel)}</strong><p>{token(capsuleOpen?copy.capsule.open:copy.capsule.closed)}</p></button>{capsuleOpen&&<button data-action="advance" className="thi-primary" onClick={next}>{token(copy.capsule.cta)}</button>}</section>;
      case"video":return <section className="thi-scene thi-scene-video thi-scene-rich"><p className="thi-kicker">{token(copy.video.kicker)}</p><h2>{titleLines(copy.video.title)}</h2>{currentVideos.length?<div className="thi-video-wrap"><div className="thi-video-frame"><video src={currentVideos[0].url} controls playsInline preload="metadata"/></div>{currentVideos[0].caption&&<p>{currentVideos[0].caption}</p>}</div>:<div className="thi-video-placeholder"><span>▶</span><small>{token(copy.video.placeholder)}</small></div>}<button data-action="advance" className="thi-primary" onClick={next}>{token(copy.video.cta)}</button></section>;
      case "archive":
        return (
          <section className="scene scene-archive">
            <div className="archive-dust" aria-hidden="true" />
            <p className="scene-kicker">Archivo familiar · reservado</p>
            <h2>Hay una vida entera guardada acá adentro.</h2>
            <button data-action="archive-open" className={`archive-folder ${archiveOpen ? "open" : ""}`} onClick={() => setArchiveOpen(true)}>
              <span className="archive-tab">FAMILIA · {experience.demoRecipient.toUpperCase()}</span>
              <span className="archive-cover">
                <small>ARCHIVO Nº 01</small>
                <strong>Una vida<br/>que merece quedar.</strong>
                <em>Fotografías · historias · voces · recetas</em>
              </span>
              <span className="archive-paper">
                <small>PRIMERA NOTA</small>
                <strong>Antes de seguir:</strong>
                <p>esto no es un resumen de tu vida. Es apenas una colección de las huellas que fuiste dejando en la nuestra.</p>
              </span>
            </button>
            {!archiveOpen && <p className="scene-hint">Tocá el archivo para abrirlo</p>}
            {archiveOpen && <button data-action="advance" className="primary-action" onClick={next}>Empezar por el principio</button>}
          </section>
        );

      case "home":
        return (
          <section className="scene scene-home">
            <p className="scene-kicker">La casa también se acuerda</p>
            <h2>No heredamos sólo historias. Heredamos pequeñas cosas.</h2>
            <div className="home-memory">
              {[
                ["La cocina", "Ese olor que alcanzaba para saber qué estabas haciendo antes de entrar."],
                ["La mesa", "Donde siempre aparecía lugar para uno más, incluso cuando parecía imposible."],
                ["Tus manos", "La manera de arreglar, preparar, señalar, acariciar y hacer que todo siguiera funcionando."],
                ["Tus frases", "Las repetimos riéndonos. Y un día descubrimos que empezamos a decirlas igual que vos."],
              ].map(([title, copy], index) => (
                <button key={title} data-action="home-memory" className={homeOpen.includes(index) ? "open" : ""} onClick={() => setHomeOpen((items) => items.includes(index) ? items : [...items, index])}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{title}</strong>
                  <p>{homeOpen.includes(index) ? copy : "Tocá para recordar"}</p>
                </button>
              ))}
            </div>
            <button data-action="advance" className="primary-action" onClick={next} disabled={homeOpen.length < 3}>
              {homeOpen.length < 3 ? `Encontrá ${3 - homeOpen.length} recuerdos más` : "Escuchar a la familia"}
            </button>
          </section>
        );

      case "legacy":
        return (
          <section className="scene scene-legacy">
            <div className="legacy-roots" aria-hidden="true">
              <i /><i /><i /><i /><i />
            </div>
            <p className="scene-kicker">Y entonces entendimos algo</p>
            <h2>Una familia también se parece a quien la enseñó a querer.</h2>
            <button data-action="legacy-open" className={`legacy-seal ${legacyOpen ? "open" : ""}`} onClick={() => setLegacyOpen(true)}>
              <span>⌁</span>
              <strong>{legacyOpen ? "Mirá todo lo que empezó en vos" : "Tocá acá"}</strong>
            </button>
            {legacyOpen && (
              <div className="legacy-names">
                <span>historias</span><span>costumbres</span><span>recetas</span><span>frases</span><span>abrazos</span><span>nosotros</span>
              </div>
            )}
            {legacyOpen && <p className="legacy-copy">No todo legado lleva apellido. A veces es una forma de poner la mesa, de llamar para saber si llegamos bien o de hacer sentir a alguien que siempre puede volver.</p>}
            {legacyOpen && <button data-action="advance" className="primary-action" onClick={next}>Una última cosa</button>}
          </section>
        );

      case "rituals":
        return (
          <section className="scene scene-rituals">
            <p className="scene-kicker">Las cosas que nadie sube a Instagram</p>
            <h2>También somos todo esto.</h2>
            <div className="ritual-grid">
              {[
                ["01", "El mensaje de siempre", "Ese “avisame cuando llegues” que parece pequeño hasta que un día entendés todo lo que contiene."],
                ["02", "Nuestra comida", "Ese pedido, plato o improvisación que ya sabe a nosotros aunque nadie más entienda por qué."],
                ["03", "El lado de la cama", "Pequeñas negociaciones que hace años dejaron de negociarse."],
                ["04", "El idioma propio", "Palabras, caras y chistes que serían incomprensibles para cualquier otra persona."],
              ].map(([number, title, copy], index) => (
                <button key={title} data-action="ritual-open" className={ritualsOpen.includes(index) ? "open" : ""} onClick={() => setRitualsOpen((items) => items.includes(index) ? items : [...items, index])}>
                  <span>{number}</span>
                  <strong>{title}</strong>
                  <p>{ritualsOpen.includes(index) ? copy : "Tocá para abrir"}</p>
                </button>
              ))}
            </div>
            <button data-action="advance" className="primary-action" onClick={next} disabled={ritualsOpen.length < 3}>
              {ritualsOpen.length < 3 ? `Abrí ${3 - ritualsOpen.length} más` : "Y también atravesamos cosas"}
            </button>
          </section>
        );

      case "chapters":
        return (
          <section className="scene scene-chapters">
            <p className="scene-kicker">No todo fue una foto linda</p>
            <h2>Hay capítulos que valen por haberlos atravesado juntos.</h2>
            <div className="chapter-stack">
              {[
                ["Lo que tuvimos que aprender", "Que amar no era adivinar al otro. Era aprender a hablar, escuchar y volver a intentar."],
                ["Lo que cambió", "Nosotros también. Y aun así encontramos maneras nuevas de reconocernos."],
                ["Lo que sostuvimos", "Cuando era más fácil encerrarse cada uno en lo suyo, hubo veces en que elegimos acercarnos."],
              ].map(([title, copy], index) => (
                <button key={title} data-action="chapter-open" className={chapterOpen.includes(index) ? "open" : ""} onClick={() => setChapterOpen((items) => items.includes(index) ? items : [...items, index])}>
                  <span>CAPÍTULO {String(index + 1).padStart(2, "0")}</span>
                  <strong>{title}</strong>
                  <p>{chapterOpen.includes(index) ? copy : "Abrir capítulo"}</p>
                </button>
              ))}
            </div>
            <button data-action="advance" className="primary-action" onClick={next} disabled={chapterOpen.length < 2}>
              {chapterOpen.length < 2 ? "Abrí al menos dos capítulos" : "Seguir"}
            </button>
          </section>
        );

      case "future":
        return (
          <section className="scene scene-future">
            <div className="future-line" aria-hidden="true" />
            <p className="scene-kicker">No estamos celebrando sólo lo que pasó</p>
            <h2>También estamos celebrando que todavía hay cosas que no vivimos.</h2>
            <button data-action="future-open" className={`future-card ${futureOpen ? "open" : ""}`} onClick={() => setFutureOpen(true)}>
              <small>PRÓXIMO CAPÍTULO</small>
              <strong>{futureOpen ? "Todavía no sabemos exactamente qué viene." : "Abrir lo que sigue"}</strong>
              <p>{futureOpen ? "Pero quiero conocerlo con vos: más domingos, más lugares, más conversaciones, más versiones nuestras y algunos planes que hoy ni siquiera existen." : "Hay futuro guardado acá."}</p>
              <span>{futureOpen ? "∞" : "→"}</span>
            </button>
            {futureOpen && <button data-action="advance" className="primary-action" onClick={next}>Llegar al final</button>}
          </section>
        );

      case "origin":
        return (
          <section className="scene scene-origin">
            <p className="scene-kicker">Antes de la pregunta</p>
            <h2>Hubo un momento en que todavía no sabía todo lo que ibas a significar.</h2>
            <div className="origin-frame">
              <div
                className="origin-photo"
                style={{
                  backgroundImage: `url("${scenePhotos[0]?.url || premiumFallbackPhotos[0]}")`,
                  backgroundSize: scenePhotos[0]?.fit || "cover",
                  backgroundPosition: scenePhotos[0]?.position || "center",
                }}
              />
              <div className="origin-caption">
                <small>CAPÍTULO 01</small>
                <strong>Acá todavía no sabía.</strong>
                <p>Que ibas a convertirte en la persona con la que iba a querer compartir las noticias buenas, los días comunes y también los difíciles.</p>
              </div>
            </div>
            <button data-action="advance" className="primary-action" onClick={next}>Seguir recordando</button>
          </section>
        );

      case "reasons":
        return (
          <section className="scene scene-reasons">
            <p className="scene-kicker">No es una lista. Es una certeza que se fue formando.</p>
            <h2>Hay razones que fui entendiendo de a poco.</h2>
            <div className="reason-ledger">
              {[
                ["01", "Cómo se siente estar con vos", "No tengo que actuar, impresionar ni medir cada palabra. Puedo estar."],
                ["02", "Cómo hacemos equipo", "No porque siempre pensemos igual, sino porque aprendimos a volver al mismo lado."],
                ["03", "Cómo cambia el futuro cuando te imagino ahí", "Los planes dejan de ser ideas sueltas y empiezan a parecer una vida."],
                ["04", "La tranquilidad de elegirte", "No es vértigo. Es esa calma rara de saber hacia dónde quiero ir."],
              ].map(([number, title, copy], index) => (
                <button
                  key={title}
                  data-action="reason-open" className={reasonsOpen.includes(index) ? "open" : ""}
                  onClick={() => setReasonsOpen((items) => items.includes(index) ? items : [...items, index])}
                >
                  <span>{number}</span>
                  <div>
                    <strong>{title}</strong>
                    <p>{reasonsOpen.includes(index) ? copy : "Tocá para leer"}</p>
                  </div>
                </button>
              ))}
            </div>
            <button data-action="advance" className="primary-action" onClick={next} disabled={reasonsOpen.length < 3}>
              {reasonsOpen.length < 3 ? `Abrí ${3 - reasonsOpen.length} más` : "Hay algo más"}
            </button>
          </section>
        );

      case "certainty":
        return (
          <section className="scene scene-certainty">
            <p className="scene-kicker">Quiero decirlo bien</p>
            <h2>No te estoy prometiendo una vida perfecta.</h2>
            <div className="certainty-lines">
              {[
                ["No prometo", "que nada vaya a cambiar."],
                ["No prometo", "que siempre sepamos qué hacer."],
                ["Sí prometo", "seguir construyendo, aprendiendo y volviendo a elegirte."],
              ].map(([lead, copy], index) => (
                <button
                  key={index}
                  data-action="certainty-open" className={certaintyOpen.includes(index) ? "open" : ""}
                  onClick={() => setCertaintyOpen((items) => items.includes(index) ? items : [...items, index])}
                >
                  <span>{certaintyOpen.includes(index) ? lead : "···"}</span>
                  <strong>{certaintyOpen.includes(index) ? copy : "Tocá para revelar"}</strong>
                </button>
              ))}
            </div>
            <button data-action="advance" className="primary-action" onClick={next} disabled={certaintyOpen.length < 3}>Seguir</button>
          </section>
        );

      case "threshold":
        return (
          <section className={`scene scene-threshold ${thresholdOpen ? "open" : ""}`}>
            <div className="threshold-aura" />
            <p className="scene-kicker">Último paso</p>
            <h2>{thresholdOpen ? "Ya no queda nada entre vos y la pregunta." : "Lo que sigue cambia esta historia."}</h2>
            {!thresholdOpen ? (
              <>
                <button
                  data-action="threshold-hold" className={`threshold-hold ${thresholdHolding ? "holding" : ""}`}
                  onPointerDown={() => setThresholdHolding(true)}
                  onPointerUp={() => setThresholdHolding(false)}
                  onPointerLeave={() => setThresholdHolding(false)}
                  onPointerCancel={() => setThresholdHolding(false)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setThresholdOpen(true); haptic([14,34,18]); playFx("unlock"); }
                  }}
                  aria-label="Mantener presionado para continuar"
                >
                  <span onAnimationEnd={() => {
                    if (thresholdHolding) {
                      setThresholdOpen(true);
                      setThresholdHolding(false);
                      haptic([14,34,18]);
                      playFx("unlock");
                    }
                  }} />
                  <strong>Mantené presionado</strong>
                  <small>No es un botón para tocar rápido.</small>
                </button>
              </>
            ) : (
              <button data-action="advance" className="primary-action threshold-continue" onClick={next}>Continuar</button>
            )}
          </section>
        );

      case "childhood":
        return (
          <section className="scene scene-childhood">
            <div className="childhood-light" aria-hidden="true" />
            <div className="childhood-atmosphere" aria-hidden="true"><i/><i/><b/><b/></div>
            <p className="scene-kicker">Volver un segundo atrás</p>
            <h2>Hubo un tiempo en que el mundo era enorme y mamá era el lugar conocido.</h2>
            <div className="childhood-memory">
              <div
                className="childhood-photo"
                role="img"
                aria-label="Recuerdo de mamá con su hijo"
                style={{
                  backgroundImage: `url("${scenePhotos[0]?.url || premiumFallbackPhotos[0]}")`,
                  backgroundSize: scenePhotos[0]?.fit || "cover",
                  backgroundPosition: scenePhotos[0]?.position || "center",
                }}
              />
              <div className="childhood-note">
                <small>RECUERDO · 01</small>
                <span className="childhood-note-rule" aria-hidden="true" />
                <strong>Yo no veía todo.</strong>
                <p>Veía la comida servida, la ropa lista, el cumpleaños, la mano que aparecía cuando tenía miedo.</p>
                <p>No veía el cansancio, las cuentas, las dudas ni todo lo que acomodabas para que yo pudiera ser chico.</p>
              </div>
            </div>
            <button data-action="advance" className="primary-action childhood-continue" onClick={next}>Seguir recordando <span>→</span></button>
          </section>
        );

      case "care":
        if(experience.slug==="mama"){
          const careItems=[
            {n:"01",label:"LO QUE NADIE VEÍA",title:"Recordar por todos",copy:"Fechas, turnos, tareas, lo que faltaba en casa. Lo llevabas adentro sin pedir que nadie lo notara."},
            {n:"02",label:"HACER ESPACIO",title:"Hacer lugar",copy:"En la mesa, en el día, en el presupuesto y hasta en el cansancio. De alguna manera siempre aparecía lugar para nosotros."},
            {n:"03",label:"ANTES DE PEDIRLO",title:"Estar antes de que lo pidiera",copy:"Muchas veces entendiste qué me pasaba antes de que yo pudiera ponerle palabras. Ya estabas ahí cuando todavía no sabía cómo pedir ayuda."},
          ];
          return (
            <section className={`scene scene-care scene-care-mama care-open-${Math.min(careOpen.length,3)}`}>
              <div className="mama-care-atmosphere" aria-hidden="true"><i/><i/><b/><b/></div>
              <p className="scene-kicker">Las cosas que parecían pequeñas</p>
              <h2>Gran parte del amor estaba escondido en <em>cosas que nadie aplaudía.</em></h2>
              <div className="mama-care-divider" aria-hidden="true"><i/><span>♡</span><i/></div>
              <div className="mama-care-files" aria-label="Archivo de cuidados invisibles">
                {careItems.map((item,index)=>{
                  const isOpen=careOpen.includes(index);
                  return (
                    <button
                      key={item.title}
                      type="button"
                      data-action="care-open"
                      aria-expanded={isOpen}
                      className={`mama-care-file ${isOpen?"open":""}`}
                      onClick={()=>setCareOpen(items=>items.includes(index)?items:[...items,index])}
                    >
                      <span className="mama-care-file-tab" aria-hidden="true"/>
                      <span className="mama-care-file-head">
                        <small>{item.n} · {item.label}</small>
                        {!isOpen&&<i aria-hidden="true">›</i>}
                      </span>
                      <strong>{item.title}</strong>
                      <span className="mama-care-file-rule" aria-hidden="true"/>
                      <p>{isOpen?item.copy:"Tocá para abrir"}</p>
                      {isOpen&&<span className="mama-care-botanical" aria-hidden="true"><i/><i/><i/><b/></span>}
                    </button>
                  );
                })}
              </div>
              <div className="mama-care-mini-progress" aria-label={`${Math.min(careOpen.length,3)} de 3 cuidados descubiertos`}>
                {[0,1,2].map(index=><i key={index} className={careOpen.includes(index)?"done":""}/>)}
              </div>
              {careOpen.length>=3&&<div className="mama-care-resolution">
                <p>Ahora entiendo todo lo que había detrás.</p>
                <button data-action="advance" className="mama-care-continue" onClick={next}>Seguir <span>→</span></button>
              </div>}
            </section>
          );
        }
        return (
          <section className="scene scene-care">
            <p className="scene-kicker">Las cosas que parecían pequeñas</p>
            <h2>Gran parte del amor estaba escondido en tareas que nadie aplaudía.</h2>
            <div className="care-grid">
              {[
                ["01", "Recordar por todos", "Turnos, horarios, gustos, lo que faltaba, lo que había que llevar y hasta cosas que yo ya había olvidado."],
                ["02", "Hacer lugar", "En la mesa, en el día, en el presupuesto, en el cansancio. De alguna manera siempre aparecía espacio."],
                ["03", "Estar antes de que lo pidiera", "Muchas veces entendiste qué me pasaba antes de que yo pudiera ponerle palabras."],
                ["04", "Convertir rutina en hogar", "No eran grandes gestos. Era repetir pequeñas cosas durante años hasta volverlas parte de mí."],
              ].map(([n,title,copy],index)=>(
                <button key={title} data-action="care-open" className={careOpen.includes(index) ? "open" : ""} onClick={()=>setCareOpen(items=>items.includes(index)?items:[...items,index])}>
                  <span>{n}</span>
                  <strong>{title}</strong>
                  <p>{careOpen.includes(index) ? copy : "Tocá para recordar"}</p>
                </button>
              ))}
            </div>
            <button data-action="advance" className="primary-action" onClick={next} disabled={careOpen.length < 3}>
              {careOpen.length < 3 ? `Descubrí ${3-careOpen.length} más` : "Hay algo que de chico no veía"}
            </button>
          </section>
        );

      case "sacrifices":
        if(experience.slug==="mama"){
          const sacrificeItems=[
            {
              n:"01",
              title:"TIEMPO",
              headline:"Horas que eran tuyas y terminaron siendo nuestras.",
              copy:"Días, noches, esperas y planes que cambiaste sin hacer ruido."
            },
            {
              n:"02",
              title:"ENERGÍA",
              headline:"Una energía que no se veía, pero siempre estaba.",
              copy:"Tu fuerza para seguir, incluso cuando estabas cansada. Tu ánimo, tu paciencia, tu sonrisa para que todo estuviera bien."
            },
            {
              n:"03",
              title:"PREOCUPACIÓN",
              headline:"Había miedos que llevabas vos para que nosotros no tuviéramos que llevarlos.",
              copy:"Prever, cuidar, preguntar, esperar despierta. Muchas cosas recién las entendimos cuando crecimos."
            },
            {
              n:"04",
              title:"VOS",
              headline:"Y también estabas vos.",
              copy:"La mujer detrás de ser mamá. Con sueños, cansancio, dudas y una vida propia que demasiadas veces quedó para después."
            },
          ];
          return (
            <section className={`scene scene-sacrifices scene-sacrifices-mama sacrifices-open-${Math.min(sacrificesOpen.length,4)}`}>
              <div className="mama-sacrifice-atmosphere" aria-hidden="true"><i/><i/><b/><b/></div>
              <p className="scene-kicker">Lo invisible también cuenta</p>
              <h2>Ahora entiendo que muchas veces vos quedabas última para que nosotros pudiéramos ir primero.</h2>
              <div className="mama-sacrifice-ledger">
                <div className="mama-sacrifice-spine" aria-hidden="true"/>
                {sacrificeItems.map((item,index)=>{
                  const isOpen=sacrificesOpen.includes(index);
                  const photo=scenePhotos[index%Math.max(1,scenePhotos.length)];
                  return (
                    <article key={item.title} className={`mama-sacrifice-entry ${isOpen?"open":""} ${index===3?"is-self":""}`}>
                      <button
                        type="button"
                        data-action="sacrifice-open"
                        aria-expanded={isOpen}
                        className="mama-sacrifice-trigger"
                        onClick={()=>setSacrificesOpen(items=>items.includes(index)?items:[...items,index])}
                      >
                        <span className="mama-sacrifice-node" aria-hidden="true"/>
                        <small>{item.n}</small>
                        <strong>{item.title}</strong>
                        <em>{isOpen?"✓":"Descubrir"}</em>
                        <i aria-hidden="true">{isOpen?"⌄":"›"}</i>
                      </button>
                      <div className="mama-sacrifice-reveal" aria-hidden={!isOpen}>
                        <div className="mama-sacrifice-paper">
                          <div className="mama-sacrifice-copy">
                            <strong>{item.headline}</strong>
                            <p>{item.copy}</p>
                          </div>
                          {photo?.url&&<figure className="mama-sacrifice-photo">
                            <img src={photo.url} alt="" loading="eager" decoding="async" referrerPolicy="no-referrer" style={{objectFit:photo.fit||"cover",objectPosition:photo.position||"center"}}/>
                            <span aria-hidden="true"/>
                          </figure>}
                          <div className="mama-sacrifice-botanical" aria-hidden="true"><i/><i/><i/><b/></div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
              {sacrificesOpen.length>=4&&<div className="mama-sacrifice-resolution">
                <p>Nunca fue “simplemente ser mamá”.</p>
                <button data-action="advance" className="mama-sacrifice-continue" onClick={next}>Seguir <span>→</span></button>
              </div>}
            </section>
          );
        }
        return (
          <section className="scene scene-sacrifices">
            <p className="scene-kicker">Lo invisible también cuenta</p>
            <h2>Ahora entiendo que muchas veces vos quedabas última para que nosotros pudiéramos ir primero.</h2>
            <div className="sacrifice-thread" aria-hidden="true" />
            <div className="sacrifice-list">
              {[
                ["TIEMPO", "Horas que eran tuyas y terminaron siendo nuestras."],
                ["ENERGÍA", "Días en los que estabas cansada y aun así había algo más que resolver."],
                ["PREOCUPACIÓN", "Miedos que muchas veces llevaste en silencio para no pasármelos."],
                ["VOS", "Y también quiero agradecerte por la mujer que siguió existiendo detrás de ser mamá."],
              ].map(([title,copy],index)=>(
                <button key={title} data-action="sacrifice-open" className={sacrificesOpen.includes(index) ? "open" : ""} onClick={()=>setSacrificesOpen(items=>items.includes(index)?items:[...items,index])}>
                  <span>{title}</span>
                  <p>{sacrificesOpen.includes(index) ? copy : "Abrir"}</p>
                </button>
              ))}
            </div>
            <button data-action="advance" className="primary-action" onClick={next} disabled={sacrificesOpen.length < 3}>Escuchar a la familia</button>
          </section>
        );

      case "return":
        return (
          <section className={`scene scene-return ${returnOpen ? "open" : ""}`}>
            <div className="return-window" aria-hidden="true"><i /></div>
            <p className="scene-kicker">Hay algo que no cambia del todo</p>
            <h2>{returnOpen ? "No importa cuánto crezca: hay una parte de mí que siempre sabe volver a vos." : "Algunas personas se vuelven una dirección."}</h2>
            {!returnOpen ? (
              <button data-action="return-open" className="return-key" onClick={()=>setReturnOpen(true)}>
                <span>⌂</span><strong>Abrir la puerta</strong>
              </button>
            ) : (
              <button data-action="advance" className="primary-action" onClick={next}>Una última cosa</button>
            )}
          </section>
        );

      case "lessons":
        return (
          <section className="scene scene-lessons">
            <div className="lesson-line" aria-hidden="true" />
            <p className="scene-kicker">Todo lo que me enseñaste sin dar una clase</p>
            <h2>Muchas lecciones tuyas tardaron años en hacer sentido.</h2>
            <div className="lesson-ledger">
              {[
                ["01", "Resolver", "No saber no era una excusa para quedarse quieto. Primero se mira, se prueba, se pregunta y se vuelve a intentar."],
                ["02", "Cumplir", "Llegar, llamar, hacerse cargo, sostener la palabra incluso cuando nadie está mirando."],
                ["03", "Cuidar", "Entendí que proteger no siempre es hablar. A veces es estar cerca, prever, acompañar y dejar que el otro intente."],
                ["04", "Seguir", "Hay días en los que el coraje se parece menos a una hazaña y más a levantarse y hacer lo que toca."],
              ].map(([n,title,copy],index)=>(
                <button key={title} data-action="lesson-open" className={lessonsOpen.includes(index) ? "open" : ""} onClick={()=>setLessonsOpen(items=>items.includes(index)?items:[...items,index])}>
                  <span>{n}</span><div><strong>{title}</strong><p>{lessonsOpen.includes(index) ? copy : "Abrir lección"}</p></div>
                </button>
              ))}
            </div>
            <button data-action="advance" className="primary-action" onClick={next} disabled={lessonsOpen.length < 3}>
              {lessonsOpen.length < 3 ? `Faltan ${3-lessonsOpen.length}` : "Seguir"}
            </button>
          </section>
        );

      case "presence":
        return (
          <section className="scene scene-presence">
            <p className="scene-kicker">Las formas de estar</p>
            <h2>No todos los recuerdos importantes tienen una conversación.</h2>
            <div className="presence-track">
              {[
                ["LA MANO", "La que sostenía la bici, señalaba cómo hacerlo o aparecía en un hombro cuando hacía falta."],
                ["LA ESPERA", "Quedarte hasta que terminara. Ir a buscarme. Esperar despierto. Estar cuando volvía."],
                ["LA MIRADA", "Ese gesto que podía decir “bien”, “ojo”, “seguí” o “estoy acá” sin una sola palabra."],
              ].map(([title,copy],index)=>(
                <button key={title} data-action="presence-open" className={presenceOpen.includes(index) ? "open" : ""} onClick={()=>setPresenceOpen(items=>items.includes(index)?items:[...items,index])}>
                  <span>{String(index+1).padStart(2,"0")}</span>
                  <strong>{title}</strong>
                  <p>{presenceOpen.includes(index) ? copy : "Tocá para recordar"}</p>
                </button>
              ))}
            </div>
            <button data-action="advance" className="primary-action" onClick={next} disabled={presenceOpen.length < 2}>Ver lo que quedó</button>
          </section>
        );

      case "inheritance":
        return (
          <section className="scene scene-inheritance">
            <p className="scene-kicker">La herencia que no se firma</p>
            <h2>Hay cosas tuyas que un día descubrí viviendo en mí.</h2>
            <div className="inheritance-board">
              {[
                ["LA FORMA DE MIRAR UN PROBLEMA", "Antes de pedir ayuda, trato de entender cómo funciona."],
                ["ALGUNAS FRASES", "Juraba que nunca las iba a decir. Ahora salen solas."],
                ["CIERTOS GESTOS", "Maneras de ordenar, manejar, cocinar, arreglar o pensar que aparecieron sin permiso."],
                ["UNA PARTE DE TU CARÁCTER", "No todo. Pero lo suficiente como para reconocerte en mí de vez en cuando."],
              ].map(([title,copy],index)=>(
                <button key={title} data-action="inheritance-open" className={inheritanceOpen.includes(index) ? "open" : ""} onClick={()=>setInheritanceOpen(items=>items.includes(index)?items:[...items,index])}>
                  <span>0{index+1}</span><strong>{title}</strong><p>{inheritanceOpen.includes(index) ? copy : "Revelar"}</p>
                </button>
              ))}
            </div>
            <button data-action="advance" className="primary-action" onClick={next} disabled={inheritanceOpen.length < 3}>Escuchar a la familia</button>
          </section>
        );

      case "lookback":
        return (
          <section className={`scene scene-lookback ${lookbackOpen ? "open" : ""}`}>
            <div className="lookback-horizon" aria-hidden="true" />
            <p className="scene-kicker">Ahora te miro distinto</p>
            <h2>{lookbackOpen ? "De grande dejé de verte sólo como “papá”. Empecé a ver también al hombre que estaba haciendo lo mejor que podía con lo que tenía." : "Hay una parte de crecer que también es volver a conocer a nuestros padres."}</h2>
            {!lookbackOpen ? (
              <button data-action="lookback-open" className="lookback-button" onClick={()=>setLookbackOpen(true)}><span>→</span><strong>Mirar de nuevo</strong></button>
            ) : (
              <button data-action="advance" className="primary-action" onClick={next}>Una última cosa</button>
            )}
          </section>
        );

      case "casefile":
        return (
          <section className="scene scene-casefile">
            <div className="casefile-scan" aria-hidden="true" />
            <p className="scene-kicker">EXPEDIENTE 021 · NIVEL DE ACCESO: CUESTIONABLE</p>
            <h2>Hay pruebas suficientes para confirmar que esto se nos fue de las manos hace años.</h2>
            <button data-action="casefile-open" className={`casefile-folder ${casefileOpen ? "open" : ""}`} onClick={() => setCasefileOpen(true)}>
              <span className="casefile-tab">{experience.demoRecipient.toUpperCase()} + {experience.demoGiver.toUpperCase()}</span>
              <span className="casefile-cover">
                <small>ARCHIVO CONFIDENCIAL</small>
                <strong>AMISTAD<br/>BAJO INVESTIGACIÓN</strong>
                <em>Incidentes · evidencia · códigos · reincidencia</em>
                <b>CLASIFICADO</b>
              </span>
              <span className="casefile-sheet">
                <small>INFORME PRELIMINAR</small>
                <strong>Conclusión:</strong>
                <p>Demasiadas historias compartidas como para fingir que esto sigue siendo una amistad normal.</p>
              </span>
            </button>
            {!casefileOpen && <p className="scene-hint">Tocá para desclasificar</p>}
            {casefileOpen && <button data-action="advance" className="primary-action" onClick={next}>Ver evidencia</button>}
          </section>
        );

      case "insidejokes":
        return (
          <section className="scene scene-insidejokes">
            <p className="scene-kicker">DICCIONARIO NO AUTORIZADO</p>
            <h2>Hay un idioma que sólo existe porque nos conocemos demasiado.</h2>
            <div className="joke-decoder">
              {[
                ["“YA FUE”", "Frase históricamente pronunciada segundos antes de una decisión que no debía tomarse."],
                ["ESA CARA", "Sistema de comunicación completo. Traducción simultánea innecesaria."],
                ["“5 MINUTOS”", "Unidad temporal sin relación demostrable con cinco minutos reales."],
                ["EL NOMBRE PROHIBIDO", "No hace falta escribirlo. Ya sabés perfectamente de quién estamos hablando."],
              ].map(([code,meaning],index)=>(
                <button key={code} data-action="insidejoke-open" className={insideJokesOpen.includes(index) ? "open" : ""} onClick={()=>setInsideJokesOpen(items=>items.includes(index)?items:[...items,index])}>
                  <span>CODE 0{index+1}</span>
                  <strong>{code}</strong>
                  <p>{insideJokesOpen.includes(index) ? meaning : "Tocá para decodificar"}</p>
                </button>
              ))}
            </div>
            <button data-action="advance" className="primary-action" onClick={next} disabled={insideJokesOpen.length < 3}>
              {insideJokesOpen.length < 3 ? `Decodificá ${3-insideJokesOpen.length} más` : "Pasar a antecedentes"}
            </button>
          </section>
        );

      case "incidents":
        return (
          <section className="scene scene-incidents">
            <p className="scene-kicker">ANTECEDENTES · REINCIDENCIA CONFIRMADA</p>
            <h2>No digo que esta dupla tome malas decisiones. Digo que hay evidencia.</h2>
            <div className="incident-stack">
              {[
                ["CASO 001", "La salida que iba a ser tranqui", "Duración estimada: 2 horas. Duración real: información reservada."],
                ["CASO 014", "El mensaje que no había que mandar", "Se discutió. Se analizó. Se mandó igual."],
                ["CASO 028", "El plan sin plan", "Logística inexistente. Presupuesto dudoso. Resultado: inexplicablemente memorable."],
                ["CASO 041", "La vez que dijimos “nunca más”", "El archivo registra múltiples reincidencias posteriores."],
              ].map(([caseNo,title,copy],index)=>(
                <button key={caseNo} data-action="incident-open" className={incidentsOpen.includes(index) ? "open" : ""} onClick={()=>setIncidentsOpen(items=>items.includes(index)?items:[...items,index])}>
                  <span>{caseNo}</span>
                  <strong>{title}</strong>
                  <p>{incidentsOpen.includes(index) ? copy : "ABRIR INFORME"}</p>
                  {incidentsOpen.includes(index) && <em>CONFIRMADO</em>}
                </button>
              ))}
            </div>
            <button data-action="advance" className="primary-action" onClick={next} disabled={incidentsOpen.length < 3}>
              {incidentsOpen.length < 3 ? "La investigación continúa" : "Hay otra clase de pruebas"}
            </button>
          </section>
        );

      case "proof":
        return (
          <section className="scene scene-proof">
            <div className="proof-shift" aria-hidden="true" />
            <p className="scene-kicker">Y después están las pruebas que sí importan</p>
            <h2>Porque estar de verdad también fue aparecer cuando no había nada divertido para contar.</h2>
            <div className="proof-list">
              {[
                ["ESTUVISTE", "Cuando no sabía bien qué decir y tampoco hacía falta que arreglaras nada."],
                ["TE ALEGRASTE", "Por cosas buenas que me pasaban aunque no tuvieran absolutamente nada que ver con vos."],
                ["ME DIJISTE LA VERDAD", "Incluso cuando hubiera sido mucho más cómodo darme la razón."],
                ["TE QUEDASTE", "En versiones mías que ni yo sabía cuánto iban a durar."],
              ].map(([title,copy],index)=>(
                <button key={title} data-action="proof-open" className={proofOpen.includes(index) ? "open" : ""} onClick={()=>setProofOpen(items=>items.includes(index)?items:[...items,index])}>
                  <span>{String(index+1).padStart(2,"0")}</span>
                  <strong>{title}</strong>
                  <p>{proofOpen.includes(index) ? copy : "Tocá"}</p>
                </button>
              ))}
            </div>
            <button data-action="advance" className="primary-action" onClick={next} disabled={proofOpen.length < 3}>Ahora sí</button>
          </section>
        );

      case "pact":
        return (
          <section className="scene scene-pact">
            <p className="scene-kicker">PACTO NO LEGAL · VIGENCIA INDEFINIDA</p>
            <h2>Para que quede por escrito, por si alguna vez la vida se pone demasiado seria.</h2>
            <div className="pact-paper">
              <small>ACUERDO ENTRE {experience.demoRecipient.toUpperCase()} Y {experience.demoGiver.toUpperCase()}</small>
              {[
                ["I", "Podemos pasar semanas sin hablar y retomar como si hubieran sido veinte minutos."],
                ["II", "Si alguien está haciendo una estupidez, la otra persona tiene obligación moral de avisar. Una vez."],
                ["III", "Los logros de una persona se festejan sin medirlos contra la vida de la otra."],
                ["IV", "Si todo se complica, existe siempre el derecho irrestricto a mandar “¿estás?”."],
              ].map(([n,copy],index)=>(
                <button key={n} data-action="pact-open" className={pactOpen.includes(index) ? "signed" : ""} onClick={()=>setPactOpen(items=>items.includes(index)?items:[...items,index])}>
                  <span>{n}</span>
                  <p>{copy}</p>
                  <strong>{pactOpen.includes(index) ? "✓ ACEPTADO" : "ACEPTAR"}</strong>
                </button>
              ))}
              <div className="pact-signatures">
                <span>{experience.demoGiver}</span><i>+</i><span>{experience.demoRecipient}</span>
              </div>
            </div>
            <button data-action="advance" className="primary-action" onClick={next} disabled={pactOpen.length < 3}>Cerrar expediente</button>
          </section>
        );

      case"proposal":return <section className="thi-scene thi-final thi-proposal thi-scene-rich"><div className="thi-proposal-rings" aria-hidden="true"><i/><i/><i/></div><p className="thi-kicker">{token(copy.proposal.kicker)}</p><span className="thi-ring">◇</span><h2>{token(copy.proposal.title)}</h2><p className="thi-lead">{token(copy.proposal.lead)}</p><div className="thi-reactions">{copy.proposal.reactions.map(x=><button key={x} onClick={()=>haptic([10,20,10])}>{token(x)}</button>)}</div><small>{token(copy.proposal.createdWith)}</small></section>;
      case"finale":default:
        if(experience.slug==="mama"){
          const mamaFinalReactionIcons=[
            {label:"Me llegó",icon:<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="14.5" cy="14.5" r="9.2"/><path d="M10.9 12.4h.1M18.1 12.4h.1M11.2 18.4c1.1-1 2.2-1.4 3.4-1.4 1.3 0 2.4.5 3.3 1.4M25.9 22.7c0 2-1.3 3.3-2.9 3.3s-2.9-1.3-2.9-3.3c0-1.6 1.5-3.7 2.9-5.5 1.5 1.8 2.9 3.9 2.9 5.5Z"/></svg>},
            {label:"Amor",icon:<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 27 6.8 18.2C3.1 14.7 3.5 9.1 7.5 6.6c3-1.9 6.6-1.2 8.5 1.4 1.9-2.6 5.5-3.3 8.5-1.4 4 2.5 4.4 8.1.7 11.6L16 27Z"/></svg>},
            {label:"Me emocionó",icon:<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 4.2c4.2 5.2 8 10.1 8 14.6a8 8 0 1 1-16 0c0-4.5 3.8-9.4 8-14.6Z"/></svg>},
            {label:"Hermoso",icon:<svg viewBox="0 0 32 32" aria-hidden="true"><path d="m15.8 3.7 1.8 6.7 6.7 1.8-6.7 1.8-1.8 6.7-1.8-6.7-6.7-1.8 6.7-1.8 1.8-6.7ZM24.5 18.7l1 3.7 3.7 1-3.7 1-1 3.7-1-3.7-3.7-1 3.7-1 1-3.7Z"/></svg>},
          ];
          return <section className="thi-scene thi-final thi-mama-finale thi-scene-rich">
            <div className="thi-mama-finale-atmosphere" aria-hidden="true"><i/><i/><i/><i/><b/><b/><span/></div>
            <p className="thi-kicker">{token(copy.finale.kicker)}</p>
            <h2>{token(copy.finale.title)}</h2>
            <div className="thi-mama-finale-divider" aria-hidden="true"><i/><b>✦</b><i/></div>
            <p className="thi-lead">{token(copy.finale.lead)}</p>
            <div className="thi-mama-finale-reactions" aria-label="¿Qué te hizo sentir?">{mamaFinalReactionIcons.map((item,index)=><button key={item.label} type="button" className={finalReaction===index?"is-selected":""} aria-label={item.label} aria-pressed={finalReaction===index} onClick={()=>{setFinalReaction(index);haptic([6,18,6])}}>{item.icon}</button>)}</div>
            <button data-action="restart" className="thi-mama-finale-restart" onClick={restart}><span>↺</span>{token(copy.finale.restartLabel)}</button>
            <small className="thi-mama-finale-signature">{token(copy.finale.createdWith)}</small>
          </section>;
        }
        if(experience.slug==="pareja"){
          const finalInitials=`${(experience.demoRecipient||"E").trim().charAt(0).toUpperCase()} + ${(experience.demoGiver||"J").trim().charAt(0).toUpperCase()}`;
          const finalYear="2026";
          const reactionIcons=[
            {label:"Me llegó",icon:<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 27 6.8 18.2C3.1 14.7 3.5 9.1 7.5 6.6c3-1.9 6.6-1.2 8.5 1.4 1.9-2.6 5.5-3.3 8.5-1.4 4 2.5 4.4 8.1.7 11.6L16 27Z"/></svg>},
            {label:"Me hizo sonreír",icon:<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="10.5"/><path d="M11.5 18.2c1.1 2.2 2.7 3.3 4.5 3.3s3.4-1.1 4.5-3.3M12.2 13h.1M19.7 13h.1"/></svg>},
            {label:"Me emocionó",icon:<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="15.5" cy="15.5" r="10"/><path d="M11.5 18.7c1.3-1.2 2.7-1.8 4.1-1.8 1.5 0 2.8.6 4 1.8M11.7 12.9h.1M19.2 12.9h.1M24.9 22.8c0 2-1.3 3.2-2.8 3.2s-2.8-1.2-2.8-3.2c0-1.6 1.4-3.6 2.8-5.3 1.4 1.7 2.8 3.7 2.8 5.3Z"/></svg>},
            {label:"Hermoso",icon:<svg viewBox="0 0 32 32" aria-hidden="true"><path d="m16 4 1.7 6.3L24 12l-6.3 1.7L16 20l-1.7-6.3L8 12l6.3-1.7L16 4ZM24.5 19l.9 3.6 3.6.9-3.6.9-.9 3.6-.9-3.6-3.6-.9 3.6-.9.9-3.6Z"/></svg>},
          ];
          return <section className="thi-scene thi-final thi-pair-finale thi-scene-rich">
            <div className="thi-pair-finale-atmosphere" aria-hidden="true"><i/><i/><i/><i/><i/><i/><i/><i/><span/><span/></div>
            <p className="thi-kicker">{token(copy.finale.kicker)}</p>
            <h2>{token(copy.finale.title)}</h2>
            <p className="thi-lead">{token(copy.finale.lead)}</p>
            <div className="thi-pair-finale-divider" aria-hidden="true"><i/><b>✦</b><i/></div>
            <div className="thi-pair-finale-seal" aria-label={`Sello ${finalInitials}, ${finalYear}`}><strong>{finalInitials}</strong><small>{finalYear}</small><i aria-hidden="true"/></div>
            <div className="thi-pair-finale-reactions" aria-label="¿Qué te hizo sentir?">{reactionIcons.map((item,index)=><button key={item.label} type="button" className={finalReaction===index?"is-selected":""} aria-label={item.label} aria-pressed={finalReaction===index} onClick={()=>{setFinalReaction(index);haptic([6,18,6])}}>{item.icon}</button>)}</div>
            <button data-action="restart" className="thi-pair-finale-restart" onClick={restart}>{token(copy.finale.restartLabel)} <span>↺</span></button>
            {!customerGift&&<Link data-action="create-story" className="thi-pair-finale-create" href={`/tehiceesto/crear?experiencia=${experience.slug}`}><span>Quiero una así</span><b>→</b></Link>}
            <small className="thi-pair-finale-signature">{token(copy.finale.createdWith)}</small>
          </section>;
        }
        return <section className="thi-scene thi-final thi-scene-rich"><div className="thi-final-sparks" aria-hidden="true"><i/><i/><i/><i/><i/><i/></div><p className="thi-kicker">{token(copy.finale.kicker)}</p><h2>{token(copy.finale.title)}</h2><p className="thi-lead">{token(copy.finale.lead)}</p><div className="thi-reactions">{copy.finale.reactions.map(x=><button key={x} onClick={()=>haptic(7)}>{token(x)}</button>)}</div><button data-action="restart" className="thi-ghost" onClick={restart}>{token(copy.finale.restartLabel)}</button><small>{token(copy.finale.createdWith)}</small></section>;
    }
  }

  const moveAtmosphere=(event:ReactPointerEvent<HTMLElement>)=>{const node=event.currentTarget;const width=Math.max(window.innerWidth,1);const height=Math.max(window.innerHeight,1);node.style.setProperty("--pointer-left",`${event.clientX}px`);node.style.setProperty("--pointer-top",`${event.clientY}px`);node.style.setProperty("--parallax-x",`${((event.clientX/width)-.5)*18}px`);node.style.setProperty("--parallax-y",`${((event.clientY/height)-.5)*14}px`)};

  return <main ref={shellRef} className={`thi-experience thi-experience-premium thi-template-v1 thi-theme-${experience.slug}`} style={{"--accent":experience.accent} as CSSProperties} data-experience={experience.slug} data-scene={current} onClickCapture={handlePassiveHaptic} onPointerMove={moveAtmosphere} onPointerDownCapture={()=>{if(soundtrackMedia&&!soundtrackStarted)void startSoundtrack()}} onPlayCapture={handleMediaPlay} onPauseCapture={handleMediaRest} onEndedCapture={handleMediaRest}>
    {soundtrackMedia&&<audio ref={soundtrackRef} src={soundtrackMedia.url} preload="auto" loop playsInline/>}
    {soundtrackMedia&&(soundtrackStarted||sceneIndex>0)&&<button type="button" className={`soundtrack-control ${soundtrackPaused?"paused":""} ${!soundtrackStarted?"not-started":""}`} onClick={(event)=>{event.stopPropagation();if(!soundtrackStarted)void startSoundtrack();else if(soundtrackPaused)void resumeSoundtrack();else pauseSoundtrack()}} aria-label={!soundtrackStarted?"Activar música":soundtrackPaused?"Reanudar música":"Pausar música"} aria-pressed={soundtrackStarted&&!soundtrackPaused}>
      <span>{!soundtrackStarted||soundtrackPaused?"♪":"♫"}</span><div><small>{!soundtrackStarted?"Tocar para activar":soundtrackPaused?"Música pausada":"Sonando suave"}</small><strong>{soundtrackMedia.caption||"Música de fondo"}</strong></div><i aria-hidden="true"><b/><b/><b/><b/></i>
    </button>}
    <div className="thi-pointer-light" aria-hidden="true"/><div className="thi-experience-noise" aria-hidden="true"/><div className="thi-experience-vignette" aria-hidden="true"/><div className="thi-experience-orb orb-a" aria-hidden="true"/><div className="thi-experience-orb orb-b" aria-hidden="true"/><div className="thi-theme-signature" aria-hidden="true"><i/><i/><i/></div>
    <div className="thi-scene-meta"><span>{token(copy.ui.sceneLabels[current])}</span><i/><small>{String(sceneIndex+1).padStart(2,"0")} / {String(total).padStart(2,"0")}</small></div>
    <button data-action="restart" className="thi-reset-journey" type="button" onClick={restart} aria-label={token(copy.ui.resetAria)}><span>↻</span><small>{token(copy.ui.resetLabel)}</small></button>
    {sceneIndex>0&&<button data-action="back" className="thi-global-back-nav" type="button" onClick={prev} disabled={transitioning} aria-label="Volver a la pantalla anterior"><span>←</span><small>Atrás</small></button>}
    <div className={`thi-scene-stage ${transitioning?"leaving":""} ${direction} ${hasAttachedMedia?"has-attached-media":""}`} key={`${runId}-${sceneIndex}-${current}`}>
      {scene(current)}
      <AttachedSceneMedia scene={current} photos={currentPhotos} audios={currentAudios} videos={currentVideos}/>
    </div>
    <div className="thi-progress thi-progress-premium"><button data-action="previous" onClick={prev} disabled={!sceneIndex||transitioning} aria-label={token(copy.ui.previousAria)}>←</button><div><span style={{width:`${progress}%`}}/></div><small>{Math.round(progress)}%</small><button data-action="next" className="thi-progress-next" onClick={next} disabled={!canAdvance()||sceneIndex>=total-1} aria-label={token(copy.ui.nextAria)}>→</button></div>
  </main>;
}
