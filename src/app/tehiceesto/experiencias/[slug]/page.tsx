import Link from "next/link";
import { notFound } from "next/navigation";
import ExperienceEngine from "../../ExperienceEngine";
import { getExperience } from "../../data";

export default async function ExperiencePage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const experience=getExperience(slug);
  if(!experience) notFound();

  return <>
    <div className="thi-demo-ribbon"><span>DEMO · {experience.title}</span><Link href="/tehiceesto/crear">Crear la mía →</Link></div>
    <ExperienceEngine experience={experience}/>
  </>;
}
