import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import ExperienceEngine from "../../ExperienceEngine";
import PremiumV5Engine from "../../template-v5/ExperienceEngine";
import { getExperience as getPremiumV5Experience } from "../../template-v5/data";
import { getExperience } from "../../data";
import { isComingSoon } from "../../availability";

// Never cache an older demo: each model must match the currently sold snapshot.
export const dynamic="force-dynamic";

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
        <h1>{experience.slug==="abuelos"?"Abuelos":experience.slug==="aniversario"?"Aniversario":"Propuesta"}</h1>
        <span className="thi-coming-tag">Próximamente</span>
        <p>Estamos preparando cada detalle para que esta experiencia esté a la altura de lo que querés regalar. Todavía no está disponible para ver ni comprar.</p>
        <Link className="thi-coming-back" href="/">Ver experiencias disponibles <span aria-hidden="true">→</span></Link>
      </div>
    </main>;
  }
  const host=(await headers()).get("host")?.split(":")[0].toLowerCase()||"";
  const dedicated=host==="tehiceesto.com"||host==="www.tehiceesto.com";
  const createHref=`${dedicated?"":"/tehiceesto"}/crear?experiencia=${experience.slug}`;

  // Mamá is sold as the same immutable premium-v5 experience shown in this demo.
  const mamaV5=experience.slug==="mama"?getPremiumV5Experience("mama"):undefined;
  const friendshipV5=experience.slug==="amistad"?getPremiumV5Experience("amistad"):undefined;
  return <div className={`thi-demo-page thi-demo-page-${experience.slug}`}>
    <div className="thi-demo-ribbon"><span>EJEMPLO · {experience.title}</span><Link href={createHref}>Quiero esta →</Link></div>
    {mamaV5?<PremiumV5Engine experience={mamaV5}/>:friendshipV5?<PremiumV5Engine experience={friendshipV5}/>:<ExperienceEngine experience={experience}/>}
  </div>;
}
