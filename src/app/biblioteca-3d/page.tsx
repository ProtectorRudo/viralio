"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AmbientLight, Box3, Color, DirectionalLight,
  HemisphereLight, PerspectiveCamera, Scene, Vector3, WebGLRenderer
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { getViralio3DIndex, loadViralio3DAsset } from "@/lib/viralio-3d";
import type { Viralio3DItem } from "@/lib/viralio-3d";

function Preview({ id }: {id:string}) {
  const root=useRef<HTMLDivElement>(null);
  const [error,setError]=useState("");
  useEffect(()=>{
    const host=root.current;
    if(!host || !id)return;
    let alive=true,raf=0;
    queueMicrotask(()=>{if(alive)setError("");});
    let renderer:WebGLRenderer|null=null;
    let controls:OrbitControls|null=null;
    let observer:ResizeObserver|null=null;
    try{
      renderer=new WebGLRenderer({antialias:true,alpha:false,powerPreference:"high-performance"});
      renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.7));
      renderer.setClearColor(new Color("#10171f"));
      renderer.domElement.style.width="100%";
      renderer.domElement.style.height="100%";
      renderer.domElement.style.touchAction="none";
      host.appendChild(renderer.domElement);
      const scene=new Scene();
      scene.background=new Color("#10171f");
      const camera=new PerspectiveCamera(42,1,.03,250);
      scene.add(new HemisphereLight(0xe6f2ff,0x2b2933,2.1));
      scene.add(new AmbientLight(0xffffff,.4));
      const key=new DirectionalLight(0xffe2c5,3.5);key.position.set(4,8,6);scene.add(key);
      const rim=new DirectionalLight(0x83b5ff,2);rim.position.set(-5,2,-5);scene.add(rim);
      controls=new OrbitControls(camera,renderer.domElement);
      controls.enableDamping=true;
      controls.dampingFactor=.06;
      controls.autoRotate=true;
      controls.autoRotateSpeed=.6;
      const rendererRef=renderer;
      const controlsRef=controls;
      const resize=()=>{
        const w=host.clientWidth||400,h=host.clientHeight||350;
        rendererRef.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
      };
      observer=new ResizeObserver(resize);observer.observe(host);resize();
      loadViralio3DAsset(id).then(({scene:object})=>{
        if(!alive)return;
        const bounds=new Box3().setFromObject(object);
        const size=new Vector3(),center=new Vector3();
        bounds.getSize(size);bounds.getCenter(center);
        if(!Number.isFinite(size.length())||size.length()<.0001)throw Error("Modelo sin volumen visible");
        object.position.sub(center);
        object.position.y+=size.y/2;
        scene.add(object);
        const span=Math.max(size.x,size.y,size.z,.5);
        camera.position.set(span*1.65,span*1.0,span*1.7);
        camera.near=Math.max(.005,span/1000);camera.far=span*100;camera.updateProjectionMatrix();
        controlsRef.target.set(0,size.y*.5,0);controlsRef.update();
      }).catch(e=>{if(alive)setError(String(e.message||e));});
      const frame=()=>{
        if(!alive)return;
        controlsRef.update();
        rendererRef.render(scene,camera);
        raf=requestAnimationFrame(frame);
      };
      frame();
    }catch(e){queueMicrotask(()=>{if(alive)setError(String(e));});}
    return ()=>{
      alive=false;cancelAnimationFrame(raf);observer?.disconnect();controls?.dispose();
      if(renderer){
        renderer.dispose();
        renderer.domElement.remove();
      }
    };
  },[id]);
  return <div ref={root} style={{position:"relative",height:"100%",minHeight:360}}>
    {error&&<div role="alert" style={{position:"absolute",zIndex:4,top:14,left:14,right:14,background:"#4a2126",padding:14,borderRadius:10,color:"#fff"}}>{error}</div>}
    <div style={{position:"absolute",pointerEvents:"none",bottom:16,left:16,color:"#a8b7c7",fontSize:12,zIndex:2}}>Arrastrá para girar · Rueda o pellizco para zoom</div>
  </div>;
}

export default function Biblioteca3D(){
  const [items,setItems]=useState<Viralio3DItem[]>([]);
  const [selected,setSelected]=useState("");
  const [query,setQuery]=useState("");
  const [category,setCategory]=useState("todos");
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  useEffect(()=>{
    getViralio3DIndex().then(data=>{setItems(data.items);setSelected(data.items[0]?.id||"");})
      .catch(e=>setError(String(e.message||e))).finally(()=>setLoading(false));
  },[]);
  const categories=useMemo(()=>["todos",...new Set(items.map(i=>i.category))], [items]);
  const filtered=useMemo(()=>items.filter(i=>(category==="todos"||i.category===category)&&
    (i.title+" "+i.id+" "+i.category).toLowerCase().includes(query.toLowerCase())),[items,category,query]);
  const active=items.find(i=>i.id===selected);
  return <main style={{background:"#081016",color:"#e9f1f7",minHeight:"100vh",fontFamily:"Arial, sans-serif",padding:"36px max(20px,5vw) 70px"}}>
    <div style={{maxWidth:1450,margin:"auto"}}>
      <p style={{letterSpacing:4,fontSize:11,color:"#78b1bd",fontWeight:700}}>VIRALIO ESCAPE / PRODUCTION TOOLS</p>
      <h1 style={{fontSize:"clamp(32px,5vw,62px)",lineHeight:1.05,margin:"10px 0 12px",letterSpacing:"-.045em"}}>Biblioteca 3D</h1>
      <p style={{maxWidth:760,color:"#9eb1be",lineHeight:1.6}}>Modelos GLB CC0 clasificados para nuestros escapes. Inspección 3D en tiempo real, descargas bajo demanda y reutilización entre juegos. No se cargan todos los modelos al abrir esta página.</p>
      <p style={{color:"#b4d9d2",marginBottom:25}}>{loading?"Cargando inventario…":String(items.length)+" modelos disponibles · 0 USD en licencias"}</p>
      {error?<div role="alert" style={{padding:18,border:"1px solid #715454",borderRadius:12,color:"#ffc8c8"}}>{error}. La preparación de los GLB podría seguir pendiente.</div>:null}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,410px),1fr))",gap:24,alignItems:"start"}}>
        <section style={{background:"#121e28",border:"1px solid #293d47",borderRadius:20,overflow:"hidden",minHeight:470}}>
          <div style={{padding:20,borderBottom:"1px solid #283c47",display:"flex",gap:8,flexWrap:"wrap"}}>
            <input aria-label="Buscar modelo" placeholder="Buscar puerta, cámara, armario, lámpara…" value={query} onChange={e=>setQuery(e.target.value)}
              style={{flex:"2 1 240px",background:"#0a151d",color:"white",border:"1px solid #3a4c56",borderRadius:10,padding:"12px"}}/>
            <select aria-label="Categoría" value={category} onChange={e=>setCategory(e.target.value)}
              style={{flex:"1 1 150px",background:"#0a151d",color:"white",border:"1px solid #3a4c56",borderRadius:10,padding:"12px"}}>
              {categories.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{maxHeight:615,overflowY:"auto",padding:10}}>
            {filtered.map(i=><button key={i.id} onClick={()=>setSelected(i.id)}
              style={{width:"100%",textAlign:"left",display:"flex",justifyContent:"space-between",gap:12,
                alignItems:"center",background:selected===i.id?"#223a47":"transparent",color:"#edf3f7",
                border:selected===i.id?"1px solid #659ba9":"1px solid transparent",
                borderRadius:12,padding:14,cursor:"pointer",marginBottom:4}}>
              <span><strong style={{display:"block",fontSize:14}}>{i.title}</strong>
                <span style={{display:"block",color:"#9dafbc",fontSize:11,marginTop:5}}>{i.category} · {i.quality}</span>
              </span><small style={{whiteSpace:"nowrap",color:"#93d0c0"}}>{(i.byteSize/1024/1024).toFixed(1)} MB</small>
            </button>)}
            {!loading&&!filtered.length&&<p style={{padding:20,color:"#a9bfce"}}>No hay modelos con ese filtro.</p>}
          </div>
        </section>
        <section style={{background:"#121e28",border:"1px solid #293d47",borderRadius:20,overflow:"hidden"}}>
          <div style={{height:470,background:"#10171f"}}>{selected&&<Preview id={selected}/>}</div>
          <div style={{padding:24}}>
            <p style={{fontSize:10,color:"#7ac6b0",letterSpacing:3,margin:0}}>VISOR GLB / THREE.JS</p>
            <h2 style={{fontSize:24,margin:"8px 0"}}>{active?.title||"Seleccioná un modelo"}</h2>
            {active&&<><p style={{color:"#adc0cc",lineHeight:1.6,fontSize:14}}>
              Fuente: {active.author} · {active.license} · {active.meshes} mallas · {active.textures} texturas</p>
              <a href={active.sourcePage} target="_blank" rel="noopener noreferrer"
                style={{color:"#a6e7db",fontSize:14}}>Ver origen y licencia ↗</a>
            </>}
          </div>
        </section>
      </div>
      <p style={{marginTop:32,color:"#7d929f",fontSize:12}}>Uso interno de producción. Los modelos aislados no traen por sí solos acertijos, colisiones ni animaciones de puertas.</p>
    </div>
  </main>;
}
