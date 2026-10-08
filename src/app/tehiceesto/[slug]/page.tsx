import { notFound } from "next/navigation";
import type { Metadata } from "next";
import AffiliateRedirect from "../r/[code]/AffiliateRedirect";

export const metadata:Metadata={
  title:"Te Hice Esto · Un regalo que se vive",
  robots:{index:false,follow:false},
};

export default async function PersonalInvitation({params,searchParams}:{
  params:Promise<{slug:string}>;
  searchParams:Promise<{src?:string|string[]}>;
}){
  const {slug}=await params;
  if(!/^[a-z0-9][a-z0-9-]{2,49}$/.test(slug))notFound();
  const query=await searchParams;
  const source=Array.isArray(query.src)?query.src[0]||"":query.src||"";
  return <AffiliateRedirect code={slug} source={source.slice(0,60).toLowerCase()}/>;
}
