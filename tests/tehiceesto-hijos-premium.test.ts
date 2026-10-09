import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { experiences, getExperience } from "../src/app/tehiceesto/data";
import { getExperienceCopy } from "../src/app/tehiceesto/experienceCopy";

const read = (name:string)=>readFileSync(resolve(process.cwd(),"src/app/tehiceesto",name),"utf8");
describe("Hijos · Desde que llegaste · release gate",()=>{
  const child=getExperience("hijos");
  if(!child)throw new Error("Missing Hijos model");
  const copy=getExperienceCopy(child);

  it("preserves all ten fixed model scenes in their intended order",()=>{
    expect(child.recipe).toEqual(["intro","timeline","memories","voices","light","stars","capsule","hold","letter","finale"]);
    expect(child.demo.timeline).toHaveLength(4);
    expect(child.demo.stars).toHaveLength(5);
    expect(child.demo.voices).toHaveLength(3);
    expect(experiences).toHaveLength(9);
  });
  it("keeps every emotional scene editable through the existing content schema",()=>{
    expect(copy.stars.items).toHaveLength(5);
    expect(copy.timeline.entries).toHaveLength(4);
    expect(copy.voices.entries).toHaveLength(3);
    expect(copy.capsule.year).toBe("✦");
    expect(copy.capsule.open).toMatch(/Podés empezar de nuevo/);
    expect(copy.letter.body).toContain("Queremos que seas vos");
    expect(copy.intro.lead).toContain("nuestro");
  });
  it("renders a genuine five-star heart that must be completed",()=>{
    const engine=read("ExperienceEngine.tsx");
    expect(engine).toContain('case"stars":return experience.slug==="hijos"');
    expect(engine).toContain("thi-child-heart-trace");
    expect(engine).toContain("thi-child-star-node");
    expect(engine).toContain('stars.length<starLines.length');
    expect(engine).toContain('experience.slug==="pareja"||experience.slug==="hijos"');
  });
  it("does not fake audio and keeps voice/light scenes for customer personalization",()=>{
    const engine=read("ExperienceEngine.tsx");
    expect(engine).toContain('experience.slug==="hijos"||(audioMedia||[])');
    expect(engine).toContain('experience.slug==="hijos"||(photoMedia||[])');
    expect(copy.voices.playLabel).toBe("Tocá para leer");
  });
  it("isolates styling to live experience, leaving sold versions unchanged",()=>{
    const css=read("tehiceesto-hijos-live.css");
    const layout=read("layout.tsx");
    expect(css).toContain(".thi-template-live.thi-theme-hijos");
    expect(css).toContain("@media(max-width:560px)");
    expect(css).toContain("prefers-reduced-motion");
    expect(css).toContain(".thi-envelope.open .paper");
    expect(layout).toContain('import "./tehiceesto-hijos-live.css";');
    expect(read("template-v1/data.ts")).not.toContain("La historia más linda que vimos crecer");
    expect(read("template-v2/data.ts")).not.toContain("La historia más linda que vimos crecer");
  });
});
