import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {join} from "node:path";

const root=process.cwd();
const engine=readFileSync(join(root,"src/app/tehiceesto/ExperienceEngine.tsx"),"utf8");
const legacy=readFileSync(join(root,"src/app/tehiceesto/template-v4/ExperienceEngine.tsx"),"utf8");
const proxy=readFileSync(join(root,"src/proxy.ts"),"utf8");

describe("Pareja demonstration recorded voice",()=>{
  it("plays a real recording instead of browser synthesized narration on the public demo",()=>{
    expect(engine).toContain('src="/tehiceesto-pareja-demo-v1.m4a"');
    expect(engine).toContain("parejaDemoAudioRef.current");
    expect(engine).not.toContain("toggleDemoVoice(token(voice.message))");
  });
  it("preserves the original purchased gift engine and real user audios",()=>{
    expect(legacy).not.toContain("tehiceesto-pareja-demo-v1.m4a");
    expect(engine).toContain('data-action="real-audio"');
    expect(proxy).toContain('pathname === "/tehiceesto-pareja-demo-v1.m4a"');
  });
  it("restores exact uploaded recording before publish",()=>{
    const base64=Array.from({length:10},(_,i)=>readFileSync(join(root,"assets/tehiceesto/pareja-demo-voice",`chunk-${String(i).padStart(2,"0")}.b64`),"utf8")).join("");
    const buffer=Buffer.from(base64,"base64");
    expect(buffer.length).toBe(36892);
    expect(createHash("sha256").update(buffer).digest("hex")).toBe("e78d66497a2b0c9eb6617a1e6106c2f27647b3562cf8b2abe7a52b442d49eb74");
  });
});
