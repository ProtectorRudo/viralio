import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import ExperienceEngine from "../../ExperienceEngine";
import { getExperience } from "../../data";
import { isComingSoon } from "../../availability";

export default async function ExperiencePage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const experience=getExperience(slug);
  if(!experience) notFound();
  if(isComingSoon(experience.slug)){
    return <main className="thi-coming-page">
      <div className="thi-coming-aura" aria-hidden="true">✧</div>
      <div className="thi-coming-panel">
        <p className="thi-coming-eyebrow">UNA HISTORIA POR ESTRENAR · TE HICE ESTO</p>
        <span className="thi-coming-symbol" aria-hidden="true">✦</span>
        <h1>{experience.recipient}</h1>
        <span className="thi-coming-tag">Próximamente</span>
        <p>Estamos preparando cada detalle para que esta experiencia esté a la altura de lo que querés regalar. Todavía no está disponible para ver ni comprar.</p>
        <Link className="thi-coming-back" href="/tehiceesto">Ver experiencias disponibles <span aria-hidden="true">→</span></Link>
      </div>
    </main>;
  }
  const host=(await headers()).get("host")?.split(":")[0].toLowerCase()||"";
  const dedicated=host==="tehiceesto.com"||host==="www.tehiceesto.com";
  const createHref=`${dedicated?"":"/tehiceesto"}/crear?experiencia=${experience.slug}`;

  return <div className={`thi-demo-page thi-demo-page-${experience.slug}`}>
    <div className="thi-demo-ribbon"><span>EJEMPLO · {experience.title}</span><Link href={createHref}>Quiero esta →</Link></div>
    <ExperienceEngine experience={experience}/>
  </div>;
}
