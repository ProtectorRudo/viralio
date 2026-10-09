import type { SceneType } from "./data";

export type ThiMediaKind="image"|"audio"|"video";

const NATURAL_SCENE:Record<ThiMediaKind,SceneType>={
  image:"memories",
  audio:"voices",
  video:"video",
};

export function naturalSceneForMedia(kind:ThiMediaKind):SceneType{
  return NATURAL_SCENE[kind];
}

export function defaultSceneForMedia(kind:ThiMediaKind,recipe:SceneType[]):SceneType{
  const natural=naturalSceneForMedia(kind);
  if(recipe.includes("gallery") && kind==="image")return "gallery";
  if(recipe.includes("recording") && kind==="audio")return "recording";
  if(recipe.includes("reveal") && kind==="video")return "reveal";
  return recipe.includes(natural)?natural:(recipe[0]||natural);
}

export function mediaBelongsToScene(kind:ThiMediaKind,assigned:SceneType|undefined,scene:SceneType):boolean{
  return assigned?assigned===scene:naturalSceneForMedia(kind)===scene;
}
