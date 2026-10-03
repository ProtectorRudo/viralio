export type SceneTextOverrides = Record<string, Record<string, string>>;

export function normalizeSceneTextOverrides(value: unknown): SceneTextOverrides {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result: SceneTextOverrides = {};
  for (const [scene, entries] of Object.entries(value as Record<string, unknown>)) {
    if (!entries || typeof entries !== "object" || Array.isArray(entries)) continue;
    const clean: Record<string,string> = {};
    for (const [source,replacement] of Object.entries(entries as Record<string,unknown>)) {
      if (typeof source !== "string" || typeof replacement !== "string" || !source.trim()) continue;
      clean[source]=replacement;
    }
    if(Object.keys(clean).length) result[scene]=clean;
  }
  return result;
}
