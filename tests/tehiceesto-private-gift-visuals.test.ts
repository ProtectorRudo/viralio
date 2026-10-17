import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe,expect,it } from "vitest";
import { experiences } from "../src/app/tehiceesto/data";
import {fillPrivateGiftPhotos as fillV5GiftPhotos} from "../src/app/tehiceesto/template-v5/privateGiftVisuals";
import {
  fillPrivateGiftPhotos,
  privateGiftVisualUrl,
  PRIVATE_PHOTO_SLOTS,
} from "../src/app/tehiceesto/privateGiftVisuals";

describe("private customer gifts use anonymous artwork for missing photos",()=>{
  it("supports every current demo category without changing its sample photos",()=>{
    expect(experiences.map(experience=>experience.slug)).toEqual([
      "pareja","cumpleanos","hijos","abuelos","aniversario","propuesta","mama","papa","amistad",
    ]);
    for(const experience of experiences){
      const before=JSON.stringify(experience.demo.photos);
      const output=fillPrivateGiftPhotos(experience.slug,["memories"],[]);
      expect(output).toHaveLength(3);
      expect(JSON.stringify(experience.demo.photos)).toBe(before);
      expect(output.every(photo=>photo.url.startsWith("data:image/svg+xml"))).toBe(true);
    }
  });

  it("never inserts a stock-person or external image URL",()=>{
    for(const experience of experiences){
      for(let variant=0;variant<5;variant++){
        const url=privateGiftVisualUrl(experience.slug,variant);
        expect(url).toMatch(/^data:image\/svg\+xml;charset=UTF-8,/);
        const svg=decodeURIComponent(url.slice(url.indexOf(",")+1));
        expect(svg).toMatch(/^<svg /);
        expect(svg.replace('xmlns="http://www.w3.org/2000/svg"',"" )).not.toMatch(/<image|https?:\/\/|unsplash|<foreignObject|<script/);
        expect(svg).toContain("viewBox");
      }
    }
  });

  it("keeps each uploaded photo untouched and fills only missing slots",()=>{
    const one={url:"https://customer-cdn.example/my-real-photo.png",caption:"Nuestro día",scene:"memories"};
    const result=fillPrivateGiftPhotos("mama",["intro","memories","childhood","sacrifices"],[one]);
    expect(result[0]).toEqual(one);
    expect(result.filter(photo=>photo.scene==="memories")).toHaveLength(3);
    expect(result.filter(photo=>photo.scene==="childhood")).toHaveLength(1);
    expect(result.filter(photo=>photo.scene==="sacrifices")).toHaveLength(4);
    expect(result[1].url).not.toBe(one.url);
    expect(result[1].url).toContain("data:image/svg+xml");
    const replaced=fillPrivateGiftPhotos("mama",["memories"],[one,{
      url:"https://customer-cdn.example/real-2.jpg",scene:"memories",
    },{
      url:"https://customer-cdn.example/real-3.jpg",scene:"memories",
    }]);
    expect(replaced).toHaveLength(3);
    expect(replaced.every(photo=>photo.url.startsWith("https://customer-cdn.example/"))).toBe(true);
  });

  it("fills photo-sensitive scenes without adding unrelated scenes",()=>{
    const scenes=["memories","light","childhood","origin","voices","sacrifices","lessons","presence","inheritance"];
    const result=fillPrivateGiftPhotos("papa",["intro",...scenes,"finale"],[]);
    const total=scenes.reduce((n,s)=>n+PRIVATE_PHOTO_SLOTS[s],0);
    expect(result).toHaveLength(total);
    for(const scene of scenes)expect(result.filter(photo=>photo.scene===scene)).toHaveLength(PRIVATE_PHOTO_SLOTS[scene]);
    expect(result.some(photo=>photo.scene==="intro"||photo.scene==="finale")).toBe(false);
  });

  it("uses all seven uploaded family photos across the full Mama gift, not demo placeholders",()=>{
    const seven=Array.from({length:7},(_,i)=>({
      url:`https://example.test/family-photo-${i+1}.jpg`,
      scene:"memories" as const,caption:`Recuerdo ${i+1}`,
    }));
    const route=["intro","childhood","memories","care","sacrifices","voices","letter","finale"];
    const photos=fillV5GiftPhotos("mama",route,seven);
    expect(photos.filter(p=>p.scene==="memories")).toHaveLength(7);
    expect(photos.filter(p=>p.scene==="childhood")).toHaveLength(1);
    expect(photos.filter(p=>p.scene==="sacrifices")).toHaveLength(4);
    expect(photos.filter(p=>p.scene==="voices")).toHaveLength(3);
    expect(photos.every(p=>p.url.startsWith("https://example.test/family-photo-"))).toBe(true);
    for(let i=0;i<seven.length;i++)expect(photos[i]).toEqual(seven[i]);
    expect(photos.filter(p=>p.scene!=="memories").every(p=>p.caption===undefined)).toBe(true);
    const chosen=[...seven,{url:"https://example.test/specific-childhood.jpg",scene:"childhood" as const}];
    const withAssignment=fillV5GiftPhotos("mama",route,chosen);
    expect(withAssignment.filter(p=>p.scene==="childhood")).toHaveLength(1);
    expect(withAssignment.find(p=>p.scene==="childhood")?.url).toContain("specific-childhood");
  });

  it("prevents duplicated floating Mama photos from covering mobile buttons in editor and published gifts",()=>{
    const root=resolve(process.cwd(),"src/app/tehiceesto");
    const engine=readFileSync(resolve(root,"template-v5/ExperienceEngine.tsx"),"utf8");
    const studio=readFileSync(resolve(root,"editar/CustomerStudio.tsx"),"utf8");
    const published=readFileSync(resolve(root,"r/[code]/page.tsx"),"utf8");
    // Both entry points use premium-v5 with customerGift=true.
    expect(studio).toContain("<PremiumV5Engine");
    expect(studio).toContain("customerGift");
    expect(published).toContain("frozenV5?PremiumV5Engine");
    expect(published).toContain("<Engine customerGift");
    // The scene photos remain available in their designed slots.
    expect(engine).toContain("const scenePhotos=currentPhotos.length?");
    expect(engine).toContain('const attachedPhotos=customerGift&&experience.slug==="mama"?[]:currentPhotos;');
    expect(engine).toContain('current!=="memories"&&attachedPhotos.length>0');
    expect(engine).toContain('<AttachedSceneMedia scene={current} photos={attachedPhotos}');
    expect(engine).not.toContain('<AttachedSceneMedia scene={current} photos={currentPhotos}');
    const css=readFileSync(resolve(root,"tehiceesto.css"),"utf8");
    expect(css).toContain(".thi-attached-media{position:absolute");
    expect(css).toContain("bottom:76px");
  });

  it("globally protects every sold engine from floating media overlays without changing demo styling",()=>{
    const root=resolve(process.cwd(),"src/app/tehiceesto");
    const versions=["ExperienceEngine.tsx",...Array.from({length:5},(_,index)=>`template-v${index+1}/ExperienceEngine.tsx`)];
    for(const file of versions){
      const engine=readFileSync(resolve(root,file),"utf8");
      expect(engine).toContain('data-customer-gift={customerGift?"true":undefined}');
      expect(engine).toContain("has-attached-media");
      expect(engine).toContain("<AttachedSceneMedia");
    }
    const layout=readFileSync(resolve(root,"layout.tsx"),"utf8");
    expect(layout).toContain('import "./tehiceesto-customer-media.css";');
    const css=readFileSync(resolve(root,"tehiceesto-customer-media.css"),"utf8");
    expect(css).toContain('.thi-experience[data-customer-gift="true"] .thi-scene-stage > .thi-attached-media');
    expect(css).toContain("position:relative;");
    expect(css).toContain("grid-template-columns:minmax(0,1fr)");
    expect(css).toContain("padding-bottom:max(120px,");
    expect(css).not.toContain("display:none!important");
  });

  it("is restricted to gifts and keeps the three original model engines unchanged",()=>{
    const root=resolve(process.cwd(),"src/app/tehiceesto");
    const published=readFileSync(resolve(root,"r/[code]/page.tsx"),"utf8");
    const customerPreview=readFileSync(resolve(root,"editar/CustomerStudio.tsx"),"utf8");
    const adminPreview=readFileSync(resolve(root,"admin/AdminGiftEditor.tsx"),"utf8");
    expect(published).toContain("fillLegacyGiftPhotos");
    expect(published).toContain("fillV3GiftPhotos");
    expect(published).toContain("demo:{...base.demo,photos:[]}");
    expect(customerPreview).toContain("fillPrivateGiftPhotos(");
    expect(adminPreview).toContain("fillPrivateGiftPhotos(");
    for(const version of ["template-v1","template-v2","template-v3"]){
      const engine=readFileSync(resolve(root,version,"ExperienceEngine.tsx"),"utf8");
      expect(engine).not.toContain("privateGiftVisuals");
    }
  });
});
