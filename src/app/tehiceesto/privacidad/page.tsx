import Link from "next/link";
import type {Metadata} from "next";
export const metadata:Metadata={
  title:"Cómo cuidamos tus datos · Te Hice Esto",
  description:"Información sobre los datos necesarios para comprar y personalizar experiencias digitales en Te Hice Esto.",
};
export default function PrivacyNotice(){
 return <main className="thi-legal-page">
  <div className="thi-legal-shell">
    <nav className="thi-legal-nav"><Link href="/">← TE HICE ESTO</Link><span>PRIVACIDAD · INFORMACIÓN AL CLIENTE</span></nav>
    <div className="thi-legal-grid">
      <section className="thi-legal-intro">
        <span className="thi-legal-eyebrow">INFORMACIÓN SOBRE TUS DATOS</span>
        <h1>Tu historia merece <em>cuidado.</em></h1>
        <p>En Te Hice Esto trabajamos con contenidos personales para preparar regalos digitales. Acá explicamos qué datos necesitamos y cómo podés comunicarte para pedir información o ejercer tus derechos.</p>
        <p className="thi-legal-aside">Última actualización: octubre de 2026.</p>
        <p className="thi-legal-aside">Consultas sobre tus datos: <a href="https://wa.me/5492215653163?text=Hola%2C%20quiero%20hacer%20una%20consulta%20sobre%20mis%20datos%20en%20Te%20Hice%20Esto" target="_blank" rel="noopener noreferrer">contactar por WhatsApp ↗</a>.</p>
      </section>
      <section className="thi-legal-panel thi-privacy-terms">
        <h2>Qué información utilizamos</h2>
        <p>Para gestionar una compra podemos solicitar nombre, correo electrónico, WhatsApp y modelo elegido. Para personalizar un regalo podemos recibir nombres, fechas, mensajes, fotos, audios u otros contenidos que nos facilites.</p>
        <h2>Para qué se usa</h2>
        <p>Los datos se utilizan para procesar el pedido, gestionar pagos, preparar y entregar la experiencia, responder consultas y brindar acceso o seguimiento cuando corresponda.</p>
        <h2>Servicios tecnológicos</h2>
        <p>La plataforma utiliza servicios de alojamiento y almacenamiento digital, y Mercado Pago para la operación de cobro. En una compra, la información necesaria puede transmitirse a los proveedores que intervienen en esos servicios.</p>
        <h2>Consultas, correcciones y eliminación</h2>
        <p>Podés pedir información sobre tus datos, solicitar correcciones o consultar la eliminación del contenido personalizado. Podremos pedirte una verificación razonable de identidad para proteger regalos y pedidos ajenos. Los registros cuya conservación sea legalmente necesaria pueden requerir un tratamiento distinto.</p>
        <h2>Enlaces a otras páginas</h2>
        <p>Algunas experiencias interactivas se ejecutan desde páginas independientes del mismo proyecto. El pago se realiza en Mercado Pago; esta web no solicita ni almacena el número de tu tarjeta.</p>
        <p>Si tu consulta es sobre una compra, también podés utilizar el <Link href="/arrepentimiento">Botón de arrepentimiento ↗</Link> sin registrarte.</p>
      </section>
    </div>
  </div>
 </main>
}
