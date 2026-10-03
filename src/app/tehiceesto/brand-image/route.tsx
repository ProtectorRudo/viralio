import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div style={{
        width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",
        background:"radial-gradient(circle at 78% 25%, #30121c 0, #120b10 26%, #08070a 62%)",
        color:"#f8f0ea",fontFamily:"Georgia, serif",position:"relative",overflow:"hidden",
      }}>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(115deg, transparent 0 46%, rgba(255,255,255,.025) 49%, transparent 52%)"}}/>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:22}}>
          <div style={{display:"flex",alignItems:"center",gap:30}}>
            <div style={{display:"flex",alignItems:"baseline",fontSize:92,letterSpacing:"-5px"}}>
              <span>Te</span><span style={{fontStyle:"italic",color:"#e5889e",fontSize:108,margin:"0 10px"}}>Hice</span><span>Esto</span>
            </div>
            <div style={{
              width:116,height:116,borderRadius:"48% 52% 45% 55% / 55% 43% 57% 45%",
              display:"flex",alignItems:"center",justifyContent:"center",
              background:"linear-gradient(145deg,#d88191,#8f354a)",boxShadow:"0 18px 48px rgba(0,0,0,.4)",
              border:"4px solid rgba(255,220,220,.22)",fontSize:46,color:"#5e2031",
            }}>♥</div>
          </div>
          <div style={{fontFamily:"Arial, sans-serif",fontSize:19,letterSpacing:8,textTransform:"uppercase",color:"#caaab1"}}>
            REGALOS DIGITALES PARA EL ALMA
          </div>
          <div style={{width:620,height:1,background:"linear-gradient(90deg,transparent,#9c5869,transparent)",marginTop:10}}/>
          <div style={{fontSize:30,color:"#b9aeb6",fontStyle:"italic"}}>Un regalo que no se abre. Se vive.</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
