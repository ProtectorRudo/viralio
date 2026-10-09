import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { experiences } from "../src/app/tehiceesto/data";

const root = resolve(process.cwd(), "src/app/tehiceesto");
const read = (name: string) => readFileSync(resolve(root, name), "utf8");
const recipes = [
  "invitation", "portal", "gallery", "timepiece", "recording",
  "clues", "confession", "passage", "reveal", "keepsake",
];

describe("Te guardé un secreto — launch quality and model parity", () => {
  const secret = experiences.find(x => x.slug === "secreto");
  it("adds one independent premium model without altering nine originals", () => {
    expect(experiences).toHaveLength(10);
    expect(secret?.recipe).toEqual(recipes);
    expect(secret?.closing).toContain("vas a ser abuela");
  });
  it("renders exactly the same cinematic engine for demo and customer", () => {
    const engine = read("ExperienceEngine.tsx");
    expect(engine).toContain('props.experience.slug==="secreto"');
    expect(engine).toContain("<SecretExperience {...props} />");
    expect(read("experiencias/[slug]/page.tsx")).toContain("<ExperienceEngine experience={experience}/>");
    expect(read("r/[code]/page.tsx")).toContain("ExperienceEngine");
  });
  it("never covers mobile navigation with a second floating purchase CTA", () => {
    const style = read("SecretExperience.css");
    expect(style).toContain(".floating-create-cta{display:none}");
    expect(style).toContain("env(safe-area-inset-bottom)");
    expect(style).toContain("overflow-y:visible");
  });
  it("supports both domain root and prefixed purchase paths", () => {
    const component = read("SecretExperience.tsx");
    expect(component).toContain('pathname.startsWith("/tehiceesto/")');
    expect(component).toContain('href={purchaseHref}');
    expect(component).toContain("customerGift ?");
    expect(component).not.toContain('href="/crear?experiencia=secreto"');
  });
  it("retains ten secret scenes in checkout and studio publication", () => {
    const order = readFileSync(resolve(process.cwd(),"supabase/functions/order-create/index.ts"),"utf8");
    const creator = readFileSync(resolve(process.cwd(),"supabase/functions/creator-api/index.ts"),"utf8");
    const definition = "secreto: "+JSON.stringify(recipes);
    expect(order).toContain(definition);
    expect(creator).toContain(definition);
    expect(order).toContain('"secret-v1"');
    expect(creator).toContain('gift.template_version==="secret-v1"');
  });
});
