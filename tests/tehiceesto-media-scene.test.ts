import { describe,expect,it } from "vitest";
import { defaultSceneForMedia,mediaBelongsToScene,naturalSceneForMedia } from "../src/app/tehiceesto/mediaRouting";
import type { SceneType } from "../src/app/tehiceesto/data";
import { effectiveRecipeForMedia } from "../src/app/tehiceesto/effectiveRecipe";

describe("Te Hice Esto scene-directed media",()=>{
  const recipe:SceneType[]=["intro","memories","light","voices","letter","video","finale"];
  it("assigns new files to their natural scene when available",()=>{
    expect(defaultSceneForMedia("image",recipe)).toBe("memories");
    expect(defaultSceneForMedia("audio",recipe)).toBe("voices");
    expect(defaultSceneForMedia("video",recipe)).toBe("video");
  });
  it("falls back safely if the natural scene is not in the recipe",()=>{
    expect(defaultSceneForMedia("video",["intro","letter","finale"])).toBe("intro");
  });
  it("shows explicitly assigned media only in that scene",()=>{
    expect(mediaBelongsToScene("image","light","light")).toBe(true);
    expect(mediaBelongsToScene("image","light","memories")).toBe(false);
    expect(mediaBelongsToScene("audio","letter","letter")).toBe(true);
    expect(mediaBelongsToScene("audio","letter","voices")).toBe(false);
  });
  it("keeps preview and published recipes aligned with real media",()=>{
    const base=["intro","memories","voices","light","video","letter","finale"] as const;
    expect(effectiveRecipeForMedia(base,{hasPhoto:false,hasVoice:false,hasVideo:false}))
      .toEqual(["intro","light","letter","finale"]);
    expect(effectiveRecipeForMedia(base,{hasPhoto:true,hasVoice:false,hasVideo:false}))
      .toEqual(["intro","memories","light","letter","finale"]);
    expect(effectiveRecipeForMedia(base,{hasPhoto:false,hasVoice:true,hasVideo:true}))
      .toEqual(["intro","memories","voices","light","video","letter","finale"]);
  });

  it("keeps legacy unassigned media compatible",()=>{
    expect(naturalSceneForMedia("image")).toBe("memories");
    expect(mediaBelongsToScene("image",undefined,"memories")).toBe(true);
    expect(mediaBelongsToScene("audio",undefined,"voices")).toBe(true);
    expect(mediaBelongsToScene("video",undefined,"video")).toBe(true);
  });
});
