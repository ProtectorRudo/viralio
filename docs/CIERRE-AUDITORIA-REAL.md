# CIERRE — Auditoría comercial y técnica de punta a punta

**Fecha:** 22 de octubre de 2026. **Estado:** MVP multi-comercio implementado en código, con modo sombra. **NO apto todavía para habilitar seguimientos reales.**

## 1. Experiencia comercial deseada

El titular de un corralón entra a /cierre, crea usuario y contraseña, registra su negocio y conecta el número de WhatsApp Business desde un flujo oficial de Meta Embedded Signup V4. Según el tipo de cuenta el alta puede mostrar un QR dentro del flujo de Meta. Luego elige una espera de 24/36/48/72 h, el alcance (todos, solo agendados o solo no agendados) y el texto aprobado. El personal no debe copiar chats ni activar CIERRE manualmente.

**Limitación innegociable:** escribir un teléfono en un formulario NO otorga acceso a WhatsApp; el dueño debe autorizar la cuenta a través de Meta. WhatsApp Business para Windows puede no producir los eventos de salida requeridos; la prueba deberá abarcar los dispositivos realmente utilizados.

## 2. Componentes implementados

- Panel /cierre con registro, sesión, recuperación de contraseña, negocios separados y configuración simple.
- Nueve tablas propias en Supabase, cada una con RLS. Ninguna contraseña se guarda en esas tablas; Supabase Auth gestiona identidades.
- Backend /api/cierre/meta/webhook que exige el HMAC SHA-256 de Meta y descarta eventos repetidos.
- Proceso de alta Meta: /api/cierre/meta/config y /api/cierre/meta/complete; verifica usuario dueño, WABA y número mediante Graph API, registra la suscripción a webhooks y cifra el token por negocio.
- Lectura de PDFs: Meta Media ID → URL autorizada → descarga temporal HTTPS de hasta 8 MiB → validación de cabecera PDF → Responses API con entrada input_file y salida JSON de tipo estricto para número, total, moneda y confianza. No se almacena el PDF original.
- Cola duradera en PostgreSQL y reintentos, además del endpoint seguro /api/cierre/jobs protegido por un secreto propio. El callback ejecuta un primer ciclo en after().
- Clasificador de mensajes: señales conservadoras locales; la IA evalúa únicamente mensajes ambiguos o desconocidos ligados a una oportunidad activa, para limitar costos.
- Sincronización de agenda mediante eventos smb_app_state_sync, guardando identificadores HMAC, pero sin afirmar que una carga parcial equivale a la agenda completa.
- Política pura de seguridad y pruebas: jamás contactar si hay compra, rechazo, opt-out, intervención del vendedor, documento sin verificar, IA insuficiente, agenda incierta, falta de opt-in, plantilla sin aprobar o venta externa no verificada.
- Meta, OPENAI y tokens se configuran exclusivamente como secretos del servidor, nunca en archivos del repositorio ni en el navegador.

## 3. Estado comercial del circuito

| Requisito | Estado | Bloqueo |
| --- | --- | --- |
| Cuenta privada por corralón | Implementada | Validar registro e inicio en producción |
| Elegir 24/36/48/72 | Implementado | Sin envío real todavía |
| Todos / guardados / no guardados | Implementado | Agendados/no agendados no se pueden activar hasta confirmar la sincronización completa |
| Meta Embedded Signup V4 | Código listo | Faltan App ID, Config ID, App Secret, permisos/Review y prueba real |
| Detección del PDF de WhatsApp | Backend listo | Falta confirmar que smb_message_echoes entrega Media ID desde los dispositivos reales |
| Número / monto con IA | Código listo | Falta clave OpenAI y prueba real con documentos autorizados |
| Interacciones del cliente | Reglas y clasificación IA preparadas | Necesita calibración y evaluación con un lote anonimizado |
| Compras en mostrador | No resuelto | Una compra que no ocurre en WhatsApp no puede detectarse sin otra señal de venta |
| Seguimiento por WhatsApp | **No habilitado** | Opt-in, plantilla aprobada, salud del número, historial completo y validez legal/comercial |
| Publicación de los cambios recientes | En GitHub | Vercel devuelve build-rate-limit: no afirmar que la última versión esté desplegada |

## 4. Prueba de aceptación antes de habilitar un solo seguimiento

1. Autorizar formalmente el piloto en un comercio y usar un número de prueba.
2. Confirmar el alta con Meta; capturar Phone Number ID, WABA y los eventos de WhatsApp Business.
3. Enviar PDFs de al menos 3 formatos del programa actual: confirmar número, importe y moneda sin errores silenciosos. Registrar tasa de documentos ilegibles.
4. Enviar PDF desde móvil y WhatsApp Web; medir recepción de smb_message_echoes. Si el comercio utiliza WhatsApp Desktop para Windows, probarlo específicamente y cambiar a navegador si no hay ecos.
5. Comprobar que un agradecimiento no habilita indebidamente una oportunidad rechazada; incluir preguntas atendidas y sin atender, modificaciones de presupuesto, pagos, baja y contactos repetidos.
6. Probar duplicación y desorden de eventos, reinicios de aplicación, cortes de webhooks y fallos de PDF/IA. La ausencia de eventos debe bloquear seguimiento.
7. Comprobar, en el negocio, cómo se registran ventas fuera del chat. Hasta disponer de una señal automática fiable de factura, remito o ERP, **no prometer que el sistema no contactará a compradores presenciales**.
8. Verificar consentimiento y categoría de plantilla Meta aprobada antes de pensar en envíos fuera de 24 h.
9. Probar con destinatarios voluntarios/propios el envío de **exactamente un** mensaje, sin responder automáticamente a las respuestas posteriores, mediante una versión posterior con deduplicación transaccional.
10. Medir falsos seguimientos, cantidad de presupuestos detectados, ventas atribuibles y costo por PDF/plantilla.

## 5. Costos

- Supabase PostgreSQL: reutiliza una base activa para el piloto; sujeto a límites de almacenamiento, computación y usuarios del plan actual.
- Vercel: el proyecto actual está en un equipo cuyo token/permiso de administración no está disponible para este chat y existe un límite de builds alcanzado.
- OpenAI: costo variable por PDF (texto e imágenes) y excepcionalmente por mensaje ambiguo. Los PDFs en baja calidad de imagen ayudan a moderar consumo, pero requieren medir extracción real.
- Meta: envío de plantillas con tarifas variables por categoría/país; puede exigir cuenta/partner aprobado.
- CIERRE no requiere alojar contenido original de PDF ni replicar los chats completos.

## 6. Secretos que debe completar el operador EN EL DASHBOARD DE VERCEL

Para el pilotaje en Meta no subir ni compartir ninguno:
- CIERRE_META_APP_ID (público en el SDK pero administrado como variable).
- CIERRE_META_CONFIG_ID (v4).
- CIERRE_META_APP_SECRET.
- CIERRE_META_VERIFY_TOKEN.
- CIERRE_CONTACT_HASH_KEY (cadena privada larga).
- CIERRE_TOKEN_ENCRYPTION_KEY (32 bytes aleatorios en base64; guardar copia segura y plan de rotación).
- CIERRE_OPENAI_API_KEY.
- CIERRE_JOB_SECRET (secreto del endpoint de procesador).
- DATABASE_URL ya utilizada por Viralio, o CIERRE_DATABASE_URL con acceso a la misma base y permisos apropiados.

Verificar webhook callback: https://viralio.net/api/cierre/meta/webhook
Verificar modo: https://viralio.net/api/cierre/status

Los valores de secretos se cargan en Vercel > Settings > Environment Variables. También hay que registrar el dominio viralio.net y el callback en Meta, y habilitar las suscripciones **messages**, **smb_message_echoes** y **smb_app_state_sync**.

**Política operativa:** no habilitar envíos ni prometer seguimiento automático al comercio hasta completar la prueba de aceptación de los puntos 1–10.
