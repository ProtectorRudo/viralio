"use client";
import React from "react";
import {createRoot} from "react-dom/client";
import ExperienceEngine from "./ExperienceEngine";
import {getExperience} from "./data";
const model=getExperience("hijos");
if(!model)throw new Error("Hijos demo is unavailable");
const createHref="/crear?experiencia=hijos";
const root=document.getElementById("hijos-root");
if(!root)throw new Error("Missing Hijos root");
createRoot(root).render(
  <div className="thi-root">
    <div className="thi-demo-page thi-demo-page-hijos">
      <div className="thi-demo-ribbon">
        <span>EJEMPLO · {model.title}</span>
        <a href={createHref}>Quiero esta →</a>
      </div>
      <ExperienceEngine experience={model}/>
    </div>
    <a className="floating-whatsapp floating-create-cta floating-whatsapp--experience"
       href={createHref} aria-label="Elegir esta experiencia de Te Hice Esto">
       <span className="floating-whatsapp-icon" aria-hidden="true">♥</span>
       <span className="floating-whatsapp-copy"><small>Esta experiencia</small><strong>Quiero el mío</strong></span>
       <span className="floating-whatsapp-arrow" aria-hidden="true">→</span>
    </a>
  </div>
);
