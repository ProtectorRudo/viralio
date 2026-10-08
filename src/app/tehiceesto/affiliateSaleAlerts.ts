export type AffiliateSaleAlert={count:number;commissionMinor:number};
type SaleRecord={id:string;status:string;commissionAmountMinor:number};

export function detectNewAffiliateSales(
  slug:string,
  records:SaleRecord[],
  observed:Map<string,Set<string>>,
):AffiliateSaleAlert|null{
  if(!slug||!Array.isArray(records))return null;
  const storageKey=`thi_affiliate_seen_sales_v1:${slug}`;
  const sales=records.filter(item=>typeof item.id==="string"&&item.id.length>0);
  let known=observed.get(storageKey);
  if(!known){
    let saved:string[]|null=null;
    try{
      const raw=window.localStorage.getItem(storageKey);
      if(raw!==null){
        const parsed:unknown=JSON.parse(raw);
        if(Array.isArray(parsed)){
          saved=parsed.filter((id):id is string=>typeof id==="string"&&id.length>0).slice(-250);
        }
      }
    }catch{}
    // Iniciar con una base real, sin anunciar ventas anteriores al primer acceso.
    known=new Set(saved??sales.map(item=>item.id));
  }
  const newlyConfirmed=sales.filter(item=>
    (item.status==="pending"||item.status==="paid")&&!known!.has(item.id)
  );
  for(const item of sales)known.add(item.id);
  const nextKnown=Array.from(known).slice(-250);
  observed.set(storageKey,new Set(nextKnown));
  try{window.localStorage.setItem(storageKey,JSON.stringify(nextKnown));}catch{}
  if(newlyConfirmed.length===0)return null;
  return {
    count:newlyConfirmed.length,
    commissionMinor:newlyConfirmed.reduce(
      (sum,item)=>sum+Math.max(0,Number(item.commissionAmountMinor)||0),0,
    ),
  };
}
