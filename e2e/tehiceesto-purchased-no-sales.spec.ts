import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "playwright/test";

const read=(file:string)=>readFileSync(resolve(process.cwd(),"src/app/tehiceesto",file),"utf8");

test("all purchased versions disable final purchase link and mark gift pages as private",()=>{
  const privatePage=read("r/[code]/page.tsx");
  const privateCss=read("r/[code]/purchased-experience.css");
  const privateLayout=read("r/[code]/layout.tsx");
  const floating=read("FloatingWhatsApp.tsx");

  // All orders, regardless of which experience they purchased, are routed to
  // one of the live / frozen engines with customerGift turned on.
  expect(privatePage).toContain('const Engine=frozenV1?PremiumV1Engine:frozenV2?PremiumV2Engine:ExperienceEngine;');
  expect(privatePage).toContain('<Engine customerGift experience={experience}');
  expect(privatePage).toContain('data-purchased-gift="true"');
  expect(privateLayout).toContain('import "./purchased-experience.css";');
  expect(privateCss).toContain('[data-purchased-gift="true"] .thi-pair-finale-create');
  expect(privateCss).toContain('[data-purchased-gift="true"] [data-action="create-story"]');
  expect(privateCss).toContain('body:has([data-purchased-gift="true"]) .floating-create-cta');
  expect(privateCss).toContain('[data-purchased-gift="true"] a[href*="/crear"]');

  // The global floating CTA must never mount inside /r/[code] routes.
  expect(floating).toContain('pathname.includes("/r/")');
  const enginePaths=[
    "ExperienceEngine.tsx",
    "template-v1/ExperienceEngine.tsx",
    "template-v2/ExperienceEngine.tsx",
  ];
  for(const file of enginePaths){
    const engine=read(file);
    expect(engine).toContain('customerGift?:boolean');
    expect(engine).toMatch(/!customerGift&&<Link data-action="create-story"/);
  }
});

test("public demos retain their purchase CTAs",()=>{
  const publicDemo=read("experiencias/[slug]/page.tsx");
  const floating=read("FloatingWhatsApp.tsx");
  const privateCss=read("r/[code]/purchased-experience.css");
  expect(publicDemo).toContain('<ExperienceEngine experience={experience}/>');
  expect(publicDemo).toContain('thi-demo-page');
  expect(floating).toContain('pathname.includes("/experiencias/")');
  expect(privateCss).not.toContain(".thi-demo-page .thi-pair-finale-create");
});
