import Link from "next/link";
import CreatorWizard from "../CreatorWizard";

export default function CreatePage(){
  return <main className="thi-create-page"><Link href="/tehiceesto" className="thi-create-back">← Te Hice Esto</Link><CreatorWizard/></main>;
}
