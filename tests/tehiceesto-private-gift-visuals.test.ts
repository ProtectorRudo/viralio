import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe,expect,it } from "vitest";
import { experiences } from "../src/app/tehiceesto/data";
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
