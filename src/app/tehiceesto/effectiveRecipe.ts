export type MediaPresence={
  hasPhoto:boolean;
  hasVoice:boolean;
  hasVideo:boolean;
};

export function effectiveRecipeForMedia<T extends string>(
  recipe:readonly T[],
  media:MediaPresence,
):T[]{
  return recipe.filter(scene=>{
    if(scene==="memories")return media.hasPhoto||media.hasVideo;
    if(scene==="voices")return media.hasVoice;
    if(scene==="video")return media.hasVideo;
    return true;
  });
}
