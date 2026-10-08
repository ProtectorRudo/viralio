import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import ExperienceEngine from "../../ExperienceEngine";
import { getExperience } from "../../data";

export default async function ExperiencePage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const experience=getExperience(slug);
  if(!experience) notFound();
  const host=(await headers()).get("host")?.split(":")[0].toLowerCase()||"";
  const dedicated=host==="tehiceesto.com"||host==="www.tehiceesto.com";
  const createHref=`${dedicated?"":"/tehiceesto"}/crear?experiencia=${experience.slug}`;
  const mamaVoiceUrl=`${dedicated?"":"/tehiceesto"}/demo-assets/mama-voice`;
  const demoAudio=experience.slug==="mama"
    ?[{url:mamaVoiceUrl,caption:"Tu hijo mayor",scene:"voices" as const}]
    :undefined;

  return <div className={`thi-demo-page thi-demo-page-${experience.slug}`}>
    <div className="thi-demo-ribbon"><span>EJEMPLO · {experience.title}</span><Link href={createHref}>Quiero esta →</Link></div>
    <ExperienceEngine experience={experience} audioMedia={demoAudio}/>
  </div>;
}
