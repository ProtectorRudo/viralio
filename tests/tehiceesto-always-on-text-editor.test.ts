import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,it,expect} from "vitest";

const read=(path:string)=>readFileSync(join(process.cwd(),"src/app/tehiceesto",path),"utf8");

describe("Always-on visual editing across all customer gift versions",()=>{
  it("keeps text editing active after saving, restoring and changing a scene",()=>{
    const text=read("editar/StudioVisualTextEditor.tsx");
    expect(text).not.toContain("setEnabled(");
    expect(text).not.toContain("const [enabled,setEnabled]");
    expect(text).not.toContain("if(!enabled)return");
    expect(text).toContain('document.addEventListener("click",onClick,true)');
    expect(text).toContain('EDICIÓN DE TEXTOS SIEMPRE ACTIVA');
    expect(text).toContain('setSelection(null);setMessage("Guardado');
    expect(text).toContain('setSelection(null);setMessage("Restaurado');
    expect(text).toContain('target.closest("button,a,[role=button],input');
  });
  it("allows the photo chooser to stay enabled at the same time",()=>{
    const photo=read("editar/StudioPhotoEditor.tsx");
    const studio=read("editar/CustomerStudio.tsx");
    expect(photo).not.toContain('classList.contains("studio-copy-editing")');
    expect(studio).toContain("useState(true)");
    expect(studio).toContain("<StudioVisualTextEditor");
    expect(studio).toContain("<StudioPhotoEditor");
  });
  it("marks the text tool as active without making its banner a toggle",()=>{
    const text=read("editar/StudioVisualTextEditor.tsx");
    expect(text).toContain('<div className="studio-copy-toggle active studio-copy-always-active" role="status"');
    expect(text).not.toContain("studio-copy-done");
    const style=read("tehiceesto-studio.css");
    expect(style).toContain(".studio-copy-tools .studio-copy-always-active");
    expect(style).toContain("cursor:default");
  });
});
