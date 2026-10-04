import { ImageResponse } from "next/og";

export const alt="Te Hice Esto — Un regalo que se vive";
export const size={width:1200,height:630};
export const contentType="image/png";

export default function OpenGraphImage(){
  return new ImageResponse(
    <div style={{
      width:"100%",height:"100%",display:"flex",position:"relative",overflow:"hidden",
      background:"#080709",color:"#f1ece6",padding:"58px 66px",fontFamily:"Georgia, serif",
    }}>
      <div style={{
        position:"absolute",inset:0,display:"flex",
        background:"radial-gradient(circle at 72% 42%, rgba(226,182,160,.18), transparent 28%), radial-gradient(circle at 18% 12%, rgba(121,183,255,.08), transparent 24%)",
      }}/>
      <div style={{
        position:"absolute",width:520,height:520,borderRadius:999,
        border:"1px solid rgba(226,182,160,.13)",right:-80,top:55,display:"flex",
        boxShadow:"0 0 0 62px rgba(226,182,160,.025), 0 0 0 124px rgba(226,182,160,.012)",
      }}/>
      <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"space-between",position:"relative"}}>
        <div style={{display:"flex",justifyContent:"space-between",fontFamily:"Arial, sans-serif",fontSize:18,letterSpacing:"0.18em",color:"#817a82"}}>
          <span>TE HICE ESTO · EXPERIENCIAS PRIVADAS</span><span>ARGENTINA · 2026</span>
        </div>
        <div style={{display:"flex",flexDirection:"column",width:790}}>
          <div style={{display:"flex",fontFamily:"Arial, sans-serif",fontSize:18,letterSpacing:"0.11em",color:"#b59a8e",marginBottom:22}}>
            UN REGALO HECHO PARA UNA SOLA PERSONA
          </div>
          <div style={{display:"flex",fontSize:92,lineHeight:.9,letterSpacing:"-0.045em"}}>
            No le mandes<br/>otro mensaje.
          </div>
          <div style={{display:"flex",fontSize:92,lineHeight:.9,letterSpacing:"-0.045em",color:"#e1b49f",marginTop:7}}>
            Hacé que lo viva.
          </div>
        </div>
        <div style={{display:"flex",fontFamily:"Arial, sans-serif",fontSize:20,color:"#777078"}}>
          Fotos · voces · cartas · recuerdos · una experiencia que sólo puede ser suya
        </div>
      </div>
    </div>,
    size,
  );
}
