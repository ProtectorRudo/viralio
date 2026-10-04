"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import ExperienceEngine from "./ExperienceEngine";
import { experiences, getExperience } from "./data";
import { creatorCall, uploadCreatorFile } from "./creatorApi";

type Draft = {
  experience: string;
  giverName: string;
  recipient: string;
  feeling: string;
  relationship: string;
  keyDate: string;
  anecdote: string;
  opening: string;
  letter: string;
  closing: string;
  musicUrl: string;
};

const STORAGE_KEY = "tehiceesto:draft:v1";
const SUBMISSION_KEY = "tehiceesto:submission:v1";
const feelings = ["Emoción", "Amor", "Sorpresa", "Diversión", "Nostalgia"];
type SubmitState = "idle" | "saving" | "uploading" | "ready" | "error";


const creatorPrompts: Record<string, {
  relationshipLabel: string;
  relationshipPlaceholder: string;
  dateLabel: string;
  anecdoteLabel: string;
  anecdotePlaceholder: string;
  photoHeading: string;
  wordsHeading: string;
  letterPlaceholder: string;
}> = {
  pareja: {
    relationshipLabel: "Contame cómo empezó lo de ustedes",
    relationshipPlaceholder: "Cómo se conocieron, qué cambió con el tiempo y qué hace que esta relación sea sólo de ustedes...",
    dateLabel: "Una fecha que les importe",
    anecdoteLabel: "Una escena que sólo ustedes entiendan",
    anecdotePlaceholder: "Ese viaje, esa frase, ese papelón o ese día que siempre vuelve...",
    photoHeading: "Elegí las fotos que cuentan su historia sin necesidad de explicar demasiado.",
    wordsHeading: "Ahora aparece lo que sólo vos podés decirle.",
    letterPlaceholder: "Escribí como hablás. Pensá qué te gustaría que recuerde después de cerrar la pantalla.",
  },
  cumpleanos: {
    relationshipLabel: "¿Quién es esta persona para vos?",
    relationshipPlaceholder: "Qué lugar ocupa en tu vida, cómo es, qué hace especial estar cerca suyo...",
    dateLabel: "Una fecha o etapa que quieras recordar",
    anecdoteLabel: "Una historia que siempre los haga reír",
    anecdotePlaceholder: "Un papelón, una noche, una frase o algo que todavía cuentan...",
    photoHeading: "Elegí fotos que hagan sentir que su vida está llena de gente y momentos que valen.",
    wordsHeading: "Decile algo que no entre en un simple “feliz cumple”.",
    letterPlaceholder: "Qué admirás, qué deseás para este año y qué querés que sepa de verdad...",
  },
  hijos: {
    relationshipLabel: "Contame quién es para vos",
    relationshipPlaceholder: "Qué cambió desde que llegó, qué cosas pequeñas querés guardar y qué te emociona de verlo crecer...",
    dateLabel: "Una fecha que marque el comienzo de algo",
    anecdoteLabel: "Un recuerdo que quizá todavía no pueda recordar",
    anecdotePlaceholder: "Una primera vez, una costumbre, una frase, una madrugada o un gesto...",
    photoHeading: "Elegí imágenes que algún día le permitan volver a una etapa que quizá no recuerde completa.",
    wordsHeading: "Escribí algo que pueda leer hoy o dentro de muchos años.",
    letterPlaceholder: "Contale qué sentías en esta etapa, qué querés que nunca dude y qué esperás que conserve de sí...",
  },
  abuelos: {
    relationshipLabel: "Contame qué parte de su historia vive en ustedes",
    relationshipPlaceholder: "Costumbres, recetas, frases, lugares, domingos, historias familiares...",
    dateLabel: "Una fecha o época importante",
    anecdoteLabel: "Una historia familiar que no debería perderse",
    anecdotePlaceholder: "Algo que siempre cuenta, una tradición, una escena de la casa o un recuerdo de otra época...",
    photoHeading: "Elegí fotos que parezcan piezas de un archivo familiar que merece quedar.",
    wordsHeading: "Poné por escrito las gracias que suelen quedar implícitas.",
    letterPlaceholder: "Agradecé lo que hizo, lo que enseñó y todo lo que sigue viviendo en la familia gracias a esa persona...",
  },
  aniversario: {
    relationshipLabel: "¿Qué construyeron juntos?",
    relationshipPlaceholder: "Cómo fueron cambiando, qué rutinas son de ustedes, qué atravesaron y qué siguen eligiendo...",
    dateLabel: "Una fecha que divida la historia en antes y después",
    anecdoteLabel: "Una pequeña cosa que sea muy de ustedes",
    anecdotePlaceholder: "Un ritual, una frase, una comida, una costumbre o algo absurdo que ya sea parte de la relación...",
    photoHeading: "Elegí fotos de los grandes momentos y también de todos los días del medio.",
    wordsHeading: "No escribas sobre el principio: escribí sobre todo lo que vino después.",
    letterPlaceholder: "Qué aprendieron, qué sostuvieron, qué cambió y por qué seguís eligiendo construir con esa persona...",
  },
  propuesta: {
    relationshipLabel: "¿Por qué llegaste a esta decisión?",
    relationshipPlaceholder: "Qué te da certeza, qué cambió en vos y cuándo empezaste a imaginar una vida completa a su lado...",
    dateLabel: "Una fecha que haya marcado la relación",
    anecdoteLabel: "Un momento en el que pensaste “es acá”",
    anecdotePlaceholder: "Puede ser enorme o completamente cotidiano. Lo importante es por qué te confirmó algo...",
    photoHeading: "Elegí pocas fotos que funcionen como pruebas de cómo llegaste hasta esta pregunta.",
    wordsHeading: "Antes de preguntar, dejá clara la certeza que hay detrás.",
    letterPlaceholder: "No prometas una vida perfecta. Contale por qué querés construir la vida real con esa persona...",
  },
  mama: {
    relationshipLabel: "Contame qué cosas entendiste de tu mamá al crecer",
    relationshipPlaceholder: "Cuidados que parecían normales, sacrificios que no veías, gestos que hoy valorás distinto...",
    dateLabel: "Una fecha o etapa de la infancia",
    anecdoteLabel: "Un recuerdo en el que hoy ves algo que antes no veías",
    anecdotePlaceholder: "Una comida, una espera, un cumpleaños, una preocupación, una frase o una escena de casa...",
    photoHeading: "Elegí fotos que hoy puedas mirar con otros ojos y encontrarla también en los bordes.",
    wordsHeading: "Agradecé también lo que de chico no sabías que había que agradecer.",
    letterPlaceholder: "Qué hizo sin pedir aplausos, qué entendiste recién de grande y qué parte de ella sigue siendo hogar...",
  },
  papa: {
    relationshipLabel: "Contame qué cosas de tu papá quedaron en vos",
    relationshipPlaceholder: "Lecciones, gestos, formas de resolver, silencios, códigos y cosas que hoy hacés parecido...",
    dateLabel: "Una fecha o etapa que recuerdes juntos",
    anecdoteLabel: "Una escena que hoy interpretás distinto",
    anecdotePlaceholder: "Algo que te enseñó, una espera, una salida, un consejo o una forma de estar sin hablar...",
    photoHeading: "Elegí fotos donde hoy puedas reconocer presencia, ejemplo y pequeñas herencias.",
    wordsHeading: "Decile lo que aprendiste incluso cuando él no estaba intentando enseñarte.",
    letterPlaceholder: "Qué comprendiste de grande, qué admirás hoy y qué cosas suyas descubrís viviendo en vos...",
  },
  amistad: {
    relationshipLabel: "¿Cómo llegó esta amistad a convertirse en esto?",
    relationshipPlaceholder: "Cómo se conocieron, qué códigos nacieron, qué atravesaron y por qué esa persona ya es parte de tu vida...",
    dateLabel: "Una fecha o época que tenga historia",
    anecdoteLabel: "Un incidente que merezca quedar oficialmente registrado",
    anecdotePlaceholder: "La salida que iba a ser tranqui, el mensaje que no había que mandar, el viaje improvisado...",
    photoHeading: "Elegí evidencia: fotos que den risa primero y nostalgia dos segundos después.",
    wordsHeading: "Después de todos los chistes, decile por qué esta amistad importa de verdad.",
    letterPlaceholder: "Qué versiones tuyas conoció, cuándo estuvo, qué verdad te dijo y por qué la sentís familia elegida...",
  },
};

const emptyDraft: Draft = {
  experience: "pareja",
  giverName: "",
  recipient: "",
  feeling: "Emoción",
  relationship: "",
  keyDate: "",
  anecdote: "",
  opening: "",
  letter: "",
  closing: "",
  musicUrl: "",
};

export default function CreatorWizard() {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [photoNames, setPhotoNames] = useState<string[]>([]);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photosDirty, setPhotosDirty] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [submittedCode, setSubmittedCode] = useState("");
  const [uploadDone, setUploadDone] = useState(0);
  const [submitError, setSubmitError] = useState("");
  const [photoNotice, setPhotoNotice] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved) setDraft({ ...emptyDraft, ...(JSON.parse(saved) as Draft) });
        const savedSubmission = window.localStorage.getItem(SUBMISSION_KEY) || "";
        if (/^[a-f0-9]{18}$/.test(savedSubmission)) setSubmittedCode(savedSubmission);
      } catch {
        // A broken local draft should never block creation.
      } finally {
        setHydrated(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [draft, hydrated]);

  useEffect(() => {
    return () => photoUrls.forEach((url) => URL.revokeObjectURL(url));
  }, [photoUrls]);

  const baseExperience = getExperience(draft.experience) || experiences[0];
  const prompts = creatorPrompts[baseExperience.slug] || creatorPrompts.pareja;

  const personalizedExperience = useMemo(
    () => ({
      ...baseExperience,
      demoGiver: draft.giverName || "Alguien que te quiere",
      demoRecipient: draft.recipient || "Vos",
      opening: draft.opening.trim() || baseExperience.opening,
      closing: draft.closing.trim() || baseExperience.closing,
    }),
    [baseExperience, draft],
  );


  const whatsappHrefFor = (code = "") => {
    const clip = (value: string, max: number) => {
      const clean = value.trim().replace(/\s+/g, " ");
      return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
    };

    const lines = [
      code
        ? "Hola! Acabo de enviar mi borrador desde Te Hice Esto y quiero avanzar."
        : "Hola! Armé un borrador en Te Hice Esto y quiero hacerlo real.",
      code ? `Código del borrador: ${code.toUpperCase()}` : "",
      "",
      `Experiencia: ${baseExperience.title}`,
      `De: ${draft.giverName || "—"}`,
      `Para: ${draft.recipient || "—"}`,
      `Quiero que sienta: ${draft.feeling}`,
      draft.keyDate ? `Fecha importante: ${draft.keyDate}` : "",
      draft.relationship ? `Historia: ${clip(draft.relationship, 240)}` : "",
      draft.anecdote ? `Anécdota: ${clip(draft.anecdote, 190)}` : "",
      `${code ? "Fotos cargadas" : "Fotos seleccionadas"}: ${photoFiles.length}`,
      draft.musicUrl ? `Canción elegida: ${clip(draft.musicUrl, 160)}` : "",
      `Carta escrita: ${draft.letter.trim() ? "sí" : "todavía no"}`,
      "",
      code
        ? "El borrador ya quedó guardado de forma privada. Quiero terminar los detalles."
        : "Quiero avanzar con la creación. ¿Cómo seguimos?",
    ].filter(Boolean);

    return `https://wa.me/5492215653163?text=${encodeURIComponent(lines.join("\n"))}`;
  };

  const creatorWhatsAppHref = whatsappHrefFor(submittedCode);

  const submitDraft = async () => {
    if (submitState === "saving" || submitState === "uploading") return null;
    setSubmitError("");
    setUploadDone(0);
    setSubmitState("saving");

    try {
      const result = await creatorCall<{ code: string }>("submitDraft", {
        code: submittedCode || undefined,
        website: "",
        experienceSlug: baseExperience.slug,
        giverName: draft.giverName,
        recipientName: draft.recipient,
        feeling: draft.feeling,
        relationship: draft.relationship,
        keyDate: draft.keyDate,
        anecdote: draft.anecdote,
        openingText: draft.opening,
        letterText: draft.letter,
        closingText: draft.closing,
        musicUrl: draft.musicUrl,
      });

      const code = result.code;
      setSubmittedCode(code);
      window.localStorage.setItem(SUBMISSION_KEY, code);

      if (photosDirty) {
        await creatorCall("resetCreatorMedia", { code });
      }

      if (photoFiles.length > 0 && photosDirty) {
        setSubmitState("uploading");

        for (let index = 0; index < photoFiles.length; index += 1) {
          const file = photoFiles[index];
          const prepared = await creatorCall<{ path: string; token: string }>("prepareUpload", {
            code,
            fileName: file.name,
            mimeType: file.type,
            size: file.size,
          });

          await uploadCreatorFile(prepared.path, prepared.token, file);
          await creatorCall("registerMedia", {
            code,
            storagePath: prepared.path,
            originalName: file.name,
            mimeType: file.type,
            size: file.size,
            caption: index === 0 ? draft.anecdote : "",
          });
          setUploadDone(index + 1);
        }
      }

      setPhotosDirty(false);
      setSubmitState("ready");
      return code;
    } catch (error) {
      const message = error instanceof Error ? error.message : "creator_request_failed";
      setSubmitError(message);
      setSubmitState("error");
      return null;
    }
  };

  const handoffToWhatsApp = async () => {
    const code = submitState === "ready" && submittedCode ? submittedCode : await submitDraft();
    if (!code) return;
    window.location.href = whatsappHrefFor(code);
  };

  const clearDraft = () => {
    if (!window.confirm("¿Borrar este borrador de este dispositivo?")) return;
    photoUrls.forEach((url) => URL.revokeObjectURL(url));
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(SUBMISSION_KEY);
    setDraft(emptyDraft);
    setPhotoUrls([]);
    setPhotoNames([]);
    setPhotoFiles([]);
    setPhotosDirty(false);
    setSubmittedCode("");
    setSubmitState("idle");
    setSubmitError("");
    setPhotoNotice("");
    setUploadDone(0);
    setStep(0);
  };

  const update = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    if (submitState === "ready") setSubmitState("idle");
    setSubmitError("");
  };

  const selectPhotos = (files: FileList | null) => {
    if (!files) return;

    photoUrls.forEach((url) => URL.revokeObjectURL(url));
    const incoming = Array.from(files);
    const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);
    const valid = incoming.filter((file) => allowedTypes.has(file.type.toLowerCase()) && file.size > 0 && file.size <= 15 * 1024 * 1024);
    const selected = valid.slice(0, 10);
    const rejected = incoming.length - valid.length;
    const extra = Math.max(0, valid.length - 10);

    setPhotoNotice(
      rejected > 0 || extra > 0
        ? [rejected > 0 ? `${rejected} archivo${rejected === 1 ? "" : "s"} no se pudo usar` : "", extra > 0 ? "Sólo se guardan las primeras 10 fotos" : ""].filter(Boolean).join(" · ")
        : "",
    );
    setPhotoFiles(selected);
    setPhotosDirty(true);
    setPhotoNames(selected.map((file) => file.name));
    setPhotoUrls(selected.map((file) => URL.createObjectURL(file)));
    if (submitState === "ready") setSubmitState("idle");
    setSubmitError("");
  };

  const removePhoto = (index: number) => {
    const url = photoUrls[index];
    if (url) URL.revokeObjectURL(url);
    setPhotoUrls((items) => items.filter((_, itemIndex) => itemIndex !== index));
    setPhotoNames((items) => items.filter((_, itemIndex) => itemIndex !== index));
    setPhotoFiles((items) => items.filter((_, itemIndex) => itemIndex !== index));
    setPhotosDirty(true);
    if (submitState === "ready") setSubmitState("idle");
    setSubmitError("");
  };

  if (previewMode) {
    return (
      <div className="creator-preview-overlay">
        <div className="creator-preview-toolbar">
          <button className="preview-close" onClick={() => setPreviewMode(false)}>
            ← Volver a editar
          </button>
          <button
            className="preview-whatsapp"
            type="button"
            onClick={handoffToWhatsApp}
            disabled={submitState === "saving" || submitState === "uploading"}
          >
            <span>{submitState === "uploading" ? `Subiendo ${uploadDone}/${photoFiles.length}` : "Quiero hacerlo real"}</span>
            <strong>{submitState === "saving" ? "Guardando…" : submitState === "uploading" ? "Preparando…" : "WhatsApp ↗"}</strong>
          </button>
        </div>
        <ExperienceEngine
          experience={personalizedExperience}
          letterText={draft.letter || undefined}
          photoMedia={photoUrls.map((url, index) => ({
            url,
            caption: index === 0 && draft.anecdote.trim() ? draft.anecdote.trim() : undefined,
          }))}
          storyContext={{ keyDate: draft.keyDate, anecdote: draft.anecdote }}
        />
      </div>
    );
  }

  const progress = ((step + 1) / 6) * 100;
  const stepLabels = ["Momento", "Personas", "Historia", "Recuerdos", "Palabras", "Preview"];

  return (
    <div className="creator-workspace">
      <aside className="creator-rail">
        <div className="creator-rail-brand">
          <small>TE HICE ESTO · TALLER</small>
          <strong>{baseExperience.icon} {baseExperience.title}</strong>
          <p>{baseExperience.short}</p>
        </div>
        <div className="creator-step-index">
          {stepLabels.map((label, index) => (
            <button
              key={label}
              className={index === step ? "active" : index < step ? "done" : ""}
              onClick={() => index <= step && setStep(index)}
              disabled={index > step}
              type="button"
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{label}</strong>
              <i />
            </button>
          ))}
        </div>
        <div className="creator-rail-foot">
          <div>
            <span>PROGRESO</span>
            <strong>{Math.round(progress)}%</strong>
          </div>
          <button type="button" onClick={clearDraft}>Borrar borrador</button>
        </div>
      </aside>

      <div className="creator-card creator-card-wide">
      <div className="creator-progress">
        <span style={{ width: `${progress}%` }} />
      </div>

      {step === 0 && (
        <div className="creator-step">
          <span className="eyebrow">01 · Elegí el momento</span>
          <h1>¿Qué querés convertir en algo inolvidable?</h1>
          <div className="choice-grid">
            {experiences.map((item) => (
              <button
                key={item.slug}
                onClick={() => update("experience", item.slug)}
                className={draft.experience === item.slug ? "selected" : ""}
                style={{ "--choice-accent": item.accent } as React.CSSProperties}
              >
                <span>{item.icon}</span>
                <div>
                  <strong>{item.title}</strong>
                  <small>{item.eyebrow}</small>
                </div>
              </button>
            ))}
          </div>
          <button className="primary-action" onClick={() => setStep(1)}>
            Continuar
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="creator-step">
          <span className="eyebrow">02 · Ustedes</span>
          <h1>¿Quién hace esto y para quién?</h1>

          <div className="two-inputs">
            <label className="big-input">
              <span>Tu nombre</span>
              <input
                value={draft.giverName}
                onChange={(event) => update("giverName", event.target.value)}
                placeholder="Ej. Mauro"
              />
            </label>

            <label className="big-input">
              <span>Nombre de quien lo recibe</span>
              <input
                value={draft.recipient}
                onChange={(event) => update("recipient", event.target.value)}
                placeholder="Ej. Ailín"
              />
            </label>
          </div>

          <span className="field-title">¿Qué querés que sienta?</span>
          <div className="feeling-row">
            {feelings.map((item) => (
              <button
                key={item}
                onClick={() => update("feeling", item)}
                className={draft.feeling === item ? "selected" : ""}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="wizard-navigation">
            <button className="ghost-action" onClick={() => setStep(0)}>Atrás</button>
            <button
              className="primary-action"
              disabled={!draft.giverName.trim() || !draft.recipient.trim()}
              onClick={() => setStep(2)}
            >
              Seguir
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="creator-step">
          <span className="eyebrow">03 · La historia</span>
          <h1>Ahora contame lo que una plantilla nunca podría saber.</h1>

          <label className="story-field">
            <span>{prompts.relationshipLabel}</span>
            <textarea
              value={draft.relationship}
              onChange={(event) => update("relationship", event.target.value)}
              placeholder={prompts.relationshipPlaceholder}
              rows={4}
            />
          </label>

          <label className="story-field">
            <span>{prompts.dateLabel}</span>
            <input
              type="date"
              value={draft.keyDate}
              onChange={(event) => update("keyDate", event.target.value)}
            />
          </label>

          <label className="story-field">
            <span>{prompts.anecdoteLabel}</span>
            <textarea
              value={draft.anecdote}
              onChange={(event) => update("anecdote", event.target.value)}
              placeholder={prompts.anecdotePlaceholder}
              rows={4}
            />
          </label>

          <div className="wizard-navigation">
            <button className="ghost-action" onClick={() => setStep(1)}>Atrás</button>
            <button className="primary-action" onClick={() => setStep(3)}>Agregar recuerdos</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="creator-step">
          <span className="eyebrow">04 · Los recuerdos</span>
          <h1>{prompts.photoHeading}</h1>

          <label className="upload-zone">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic"
              multiple
              onChange={(event) => selectPhotos(event.target.files)}
            />
            <span className="upload-icon">＋</span>
            <strong>Subir hasta 10 fotos</strong>
            <small>JPG, PNG, WEBP o HEIC · hasta 15 MB por foto · máximo 10</small>
          </label>

          {photoNotice && <p className="upload-photo-notice">{photoNotice}</p>}

          {photoUrls.length > 0 && (
            <div className="photo-preview-grid">
              {photoUrls.map((url, index) => (
                <figure key={url}>
                  <Image src={url} alt={photoNames[index] || "Recuerdo"} width={240} height={240} unoptimized />
                  <figcaption>0{index + 1}</figcaption>
                  <button type="button" className="photo-remove" onClick={() => removePhoto(index)} aria-label={`Quitar ${photoNames[index] || `foto ${index + 1}`}`}>×</button>
                </figure>
              ))}
            </div>
          )}

          <label className="story-field">
            <span>Canción especial · opcional · referencia</span>
            <input
              value={draft.musicUrl}
              onChange={(event) => update("musicUrl", event.target.value)}
              placeholder="Pegá un link de Spotify, YouTube o escribí el nombre"
            />
          </label>

          <div className="wizard-navigation">
            <button className="ghost-action" onClick={() => setStep(2)}>Atrás</button>
            <button className="primary-action" onClick={() => setStep(4)}>Escribir la parte importante</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="creator-step">
          <span className="eyebrow">05 · Tus palabras</span>
          <h1>{prompts.wordsHeading}</h1>

          <label className="story-field">
            <span>Primera frase · opcional</span>
            <textarea
              value={draft.opening}
              onChange={(event) => update("opening", event.target.value)}
              placeholder={baseExperience.opening}
              rows={3}
            />
          </label>

          <label className="story-field story-field-important">
            <span>La carta</span>
            <textarea
              value={draft.letter}
              onChange={(event) => update("letter", event.target.value)}
              placeholder={prompts.letterPlaceholder}
              rows={8}
            />
          </label>

          <label className="story-field">
            <span>La última frase · opcional</span>
            <textarea
              value={draft.closing}
              onChange={(event) => update("closing", event.target.value)}
              placeholder={baseExperience.closing}
              rows={3}
            />
          </label>

          <div className="wizard-navigation">
            <button className="ghost-action" onClick={() => setStep(3)}>Atrás</button>
            <button className="primary-action" onClick={() => setStep(5)}>Ver lo que creamos</button>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="creator-step creator-review">
          <span className="eyebrow">06 · Ya existe una primera versión</span>
          <h1>Esto ya empieza a parecerse a {draft.recipient}.</h1>

          <div className="review-card">
            <div className="review-icon">{baseExperience.icon}</div>
            <div>
              <span>{baseExperience.eyebrow}</span>
              <h2>{baseExperience.title}</h2>
              <p>
                De <strong>{draft.giverName}</strong> para <strong>{draft.recipient}</strong> · {draft.feeling.toLowerCase()} · {photoUrls.length} fotos seleccionadas
              </p>
            </div>
          </div>

          <div className="privacy-note">
            <span>◉</span>
            <div>
              <strong>{submittedCode ? "Tu borrador ya quedó guardado de forma privada." : "Tu borrador todavía vive sólo en este dispositivo."}</strong>
              <p>{submittedCode
                ? `Código ${submittedCode.toUpperCase()}. Tus textos quedaron guardados y las fotos se suben únicamente cuando tocás “Quiero crear el mío”.`
                : "La historia permanece privada mientras editás. Las fotos de esta vista previa no quedan guardadas si cerrás o recargás la pestaña."}</p>
            </div>
          </div>

          <div className="creator-actions creator-actions-review">
            <button className="primary-action" onClick={() => setPreviewMode(true)}>
              Vivir mi preview
            </button>
            <button className="ghost-action" onClick={() => setStep(4)}>
              Seguir editando
            </button>
          </div>

          <section className="creator-conversion">
            <div className="creator-conversion-copy">
              <span className="eyebrow">Hacerlo real</span>
              <h2>{submittedCode ? "Ya recibí tu historia. Ahora sólo falta convertirla en la versión final." : "Ya hiciste la parte más difícil: contar por qué esa persona importa."}</h2>
              <p>{submittedCode
                ? `El borrador ${submittedCode.toUpperCase()} quedó guardado de forma privada. Podés abrir WhatsApp sin volver a explicar nada.`
                : "Al continuar guardo de forma privada la experiencia, tus textos y las fotos seleccionadas. Después abrimos WhatsApp con un código único para seguir desde exactamente acá."}</p>
            </div>

            {submitState === "ready" && submittedCode ? (
              <a
                className="creator-whatsapp-primary is-ready"
                href={creatorWhatsAppHref}
                target="_blank"
                rel="noreferrer noopener"
              >
                <span className="creator-wa-mark">✓</span>
                <div>
                  <small>BORRADOR {submittedCode.toUpperCase()} · GUARDADO</small>
                  <strong>Abrir WhatsApp y terminarlo</strong>
                </div>
                <b>↗</b>
              </a>
            ) : (
              <button
                className="creator-whatsapp-primary"
                type="button"
                onClick={handoffToWhatsApp}
                disabled={submitState === "saving" || submitState === "uploading"}
              >
                <span className="creator-wa-mark">{submitState === "saving" || submitState === "uploading" ? "·" : "◉"}</span>
                <div>
                  <small>{submitState === "saving"
                    ? "GUARDANDO TU HISTORIA"
                    : submitState === "uploading"
                      ? `SUBIENDO ${uploadDone} DE ${photoFiles.length} FOTOS`
                      : "GUARDAR Y CONTINUAR POR WHATSAPP"}</small>
                  <strong>{submitState === "saving"
                    ? "Preparando tu borrador…"
                    : submitState === "uploading"
                      ? "Guardando tus recuerdos…"
                      : "Quiero crear el mío"}</strong>
                </div>
                <b>{submitState === "saving" || submitState === "uploading" ? "…" : "↗"}</b>
              </button>
            )}

            {submitState === "error" && (
              <div className="creator-submit-error">
                <strong>No perdimos tu borrador.</strong>
                <p>No pude guardarlo automáticamente. Podés intentar otra vez o seguir por WhatsApp igualmente.</p>
                <button type="button" onClick={handoffToWhatsApp}>Reintentar guardado</button>
                <a href={whatsappHrefFor()} target="_blank" rel="noreferrer noopener">Seguir sin guardar ↗</a>
                <small>{submitError}</small>
              </div>
            )}

            <div className="creator-next-steps">
              <article>
                <span>01</span>
                <div><strong>Tu borrador queda identificado</strong><p>Recibo un código único con la experiencia, los nombres, tus textos y los recuerdos que subiste.</p></div>
              </article>
              <article>
                <span>02</span>
                <div><strong>Terminamos los detalles juntos</strong><p>Desde WhatsApp sumamos audios, afinamos textos y hago los ajustes finos para que no se sienta genérico.</p></div>
              </article>
              <article>
                <span>03</span>
                <div><strong>Recibís el link privado final</strong><p>Lo revisás antes de entregarlo. Recién cuando está perfecto queda listo para esa persona.</p></div>
              </article>
            </div>
          </section>

          <p className="publish-coming">
            Tu borrador sigue siendo privado. Nada se publica sin que vos lo decidas.
          </p>
        </div>
      )}
      </div>
    </div>
  );
}
