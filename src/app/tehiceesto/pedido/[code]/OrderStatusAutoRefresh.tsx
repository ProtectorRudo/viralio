"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OrderStatusAutoRefresh({active=true}:{active?:boolean}){
  const router=useRouter();

  useEffect(()=>{
    if(!active) return;
    const timer=window.setInterval(()=>{
      if(document.visibilityState==="visible") router.refresh();
    },30_000);
    return ()=>window.clearInterval(timer);
  },[active,router]);

  if(!active) return null;
  return <span className="order-status-autorefresh"><i/> Actualización automática</span>;
}
