import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {detectNewAffiliateSales} from "../src/app/tehiceesto/affiliateSaleAlerts";

const record=(id:string,status="pending",commissionAmountMinor=20000)=>
  ({id,status,commissionAmountMinor});

describe("avisos de venta confirmada para influencers",()=>{
  let store:Map<string,string>;

  beforeEach(()=>{
    store=new Map();
    vi.stubGlobal("window",{localStorage:{
      getItem:(key:string)=>store.get(key)??null,
      setItem:(key:string,value:string)=>{store.set(key,value);},
    }});
  });

  afterEach(()=>vi.unstubAllGlobals());

  it("no anuncia ventas antiguas en el primer ingreso ni repite la misma",()=>{
    const observed=new Map<string,Set<string>>();
    expect(detectNewAffiliateSales("ailin",[record("old")],observed)).toBeNull();
    expect(detectNewAffiliateSales("ailin",[record("old")],observed)).toBeNull();
    expect(detectNewAffiliateSales("ailin",[record("new"),record("old")],observed))
      .toEqual({count:1,commissionMinor:20000});
    expect(detectNewAffiliateSales("ailin",[record("new"),record("old")],observed)).toBeNull();
  });

  it("recuerda avisos después de recargar la pestaña",()=>{
    const first=new Map<string,Set<string>>();
    expect(detectNewAffiliateSales("ailin",[],first)).toBeNull();
    expect(detectNewAffiliateSales("ailin",[record("sale1")],first))
      .toEqual({count:1,commissionMinor:20000});
    const afterReload=new Map<string,Set<string>>();
    expect(detectNewAffiliateSales("ailin",[record("sale1")],afterReload)).toBeNull();
  });

  it("solo celebra comisiones confirmadas; ignora anulaciones y otras actividades",()=>{
    const observed=new Map<string,Set<string>>();
    expect(detectNewAffiliateSales("ailin",[],observed)).toBeNull();
    expect(detectNewAffiliateSales("ailin",[record("reversed","reversed")],observed)).toBeNull();
    expect(detectNewAffiliateSales("ailin",[record("notApproved","unpaid")],observed)).toBeNull();
    expect(detectNewAffiliateSales("ailin",[record("approved","paid")],observed))
      .toEqual({count:1,commissionMinor:20000});
  });

  it("acumula nuevas ventas con la comisión real de cada compra",()=>{
    const observed=new Map<string,Set<string>>();
    detectNewAffiliateSales("ailin",[],observed);
    expect(detectNewAffiliateSales("ailin",[
      record("a","pending",20000),record("b","paid",35000),
    ],observed)).toEqual({count:2,commissionMinor:55000});
  });

  it("separa cuentas y no comparte los avisos entre influencers",()=>{
    const observed=new Map<string,Set<string>>();
    detectNewAffiliateSales("ailin",[],observed);
    detectNewAffiliateSales("sofia",[],observed);
    expect(detectNewAffiliateSales("ailin",[record("x")],observed))
      .toEqual({count:1,commissionMinor:20000});
    expect(detectNewAffiliateSales("sofia",[],observed)).toBeNull();
    expect(detectNewAffiliateSales("sofia",[record("x")],observed))
      .toEqual({count:1,commissionMinor:20000});
  });
});
