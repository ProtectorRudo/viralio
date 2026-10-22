# CIERRE v0.9 — Manual de activación del piloto (22/10/2026)

## Objetivo del producto

**Tres opciones visibles para el comercio, todas en una sola pantalla:**
1. Cuándo evaluar el seguimiento: 24, 36, 48 o 72 horas después de la última interacción.
2. Alcance: todos, solo agendados o solo no agendados.
3. Un mensaje fijo editable; no un chatbot ni una respuesta a cada mensaje.

**Un único control extra vital:** Pausar/Reanudar CIERRE, fuera de las tres opciones.

La complejidad de permisos, Meta, IA, PDF, deduplicación, consentimiento y cobros queda exclusivamente en el backend. Los vendedores conservan WhatsApp Business.

## Ya está desplegado / guardado

- Frontend alternativo: https://protectorrudo.github.io/cierre/ , conectado a las tablas propias \`cierre_*\` en Supabase. Código en repositorio \`ProtectorRudo.github.io/cierre/\`. Confirmado en GitHub; publicación HTTP pendiente de verificar en un navegador de usuario.
- Meta webhooks: \`https://bwsgxpttnrctklrcjmjs.supabase.co/functions/v1/cierre-whatsapp-webhook\`, versión 3 ACTIVE, sin necesidad de Vercel.
- Lector PDF con IA: \`https://bwsgxpttnrctklrcjmjs.supabase.co/functions/v1/cierre-pdf-worker\`, versión 1 ACTIVE.
- Conector oficial de Meta: \`https://bwsgxpttnrctklrcjmjs.supabase.co/functions/v1/cierre-meta-connect\`, versión 1 ACTIVE.
- Evaluador horario: \`cron.job.cierre_shadow_review_hourly\`, cada hora al minuto 08. Registra decisiones en \`cierre_shadow_reviews\`. Nunca envía mensajes.
- Backend DDL/seguridad: RPC de ingestión firmado, contactos, conexión, cola, extracción, seguridad. Todas las tablas propias tienen RLS.
- Código versionado en \`ProtectorRudo/viralio/supabase/functions/\`.

### Seguridad técnica

- Webhook público, pero exige HMAC SHA-256 \`X-Hub-Signature-256\` de Meta sobre el cuerpo ORIGINAL. Firma inválida → 401.
- Solo \`service_role\` puede ejecutar la función de ingestión y registrar oportunidades; \`anon\` y \`authenticated\` no pueden.
- Cada evento y contacto está asociado a un comercio; el teléfono del cliente se transforma en HMAC y no se almacena en claro.
- Idempotencia por (comercio, message ID), bloqueo ante bajas y compras, PDF todavía no verificado queda en revisión.
- Recuperación del archivo PDF mediante Media ID/Graph API con token del comercio, descarga de hasta 8 MB **solo en memoria**, validación de cabecera y salida JSON de IA con número, monto, moneda y confianza.
- El fichero PDF **no se guarda**; sí se guardan sus datos verificados, motivo de decisión y metadatos del trabajo.
- Aunque la IA reconozca datos, cualquier cierre anterior permanece bloqueado.
- Agenda parcial: \`contact_sync_state=partial\`, **nunca se interpreta como completa**; los filtros de agendados/no agendados no se aplican hasta verificar cobertura.
- Las funciones no disponen de ninguna llamada de envío de WhatsApp. Cron solo produce \`shadow_due\`, no mensajes.

## Configuración necesaria del proveedor (una vez, no para cada vendedor)

En Supabase → Edge Functions → Secrets, cargar con gestión segura del responsable de la plataforma:

- \`CIERRE_META_APP_ID\`: de la app de Meta autorizada.
- \`CIERRE_META_CONFIG_ID\`: ID de la configuración de Embedded Signup compatible con Coexistencia.
- \`CIERRE_META_APP_SECRET\`: secreto privado para verificar firmas y completar OAuth.
- \`CIERRE_META_VERIFY_TOKEN\`: token fuerte elegido por el operador, repetido en la configuración del webhook de Meta.
- \`CIERRE_CONTACT_HASH_KEY\`: secreto HMAC independiente; conservarlo estable para asociar contactos.
- \`CIERRE_TOKEN_ENCRYPTION_KEY\`: 32 bytes aleatorios codificados en Base64, para cifrar tokens por comercio.
- \`CIERRE_OPENAI_API_KEY\`: clave de OpenAI para extraer datos de PDF.
- \`CIERRE_JOB_SECRET\`: contraseña fuerte de servicio a servicio para ejecutar el lector PDF.
- Opcional \`CIERRE_AI_MODEL\`: por defecto \`gpt-4.1-mini\`; comprobar disponibilidad y costos.

Las funciones reciben automáticamente URL y claves administrativas de Supabase mediante sus variables de entorno inyectadas. Nunca pegar secretos en ChatGPT, GitHub ni en el frontend público.

Los permisos y la aprobación Meta, incluyendo habilitar \`smb_message_echoes\`, \`messages\` y \`smb_app_state_sync\`, tienen que tramitarse desde la cuenta oficial del proveedor y del negocio.

## Flujo real una vez configurado Meta

1. El titular abre CIERRE → WhatsApp → Conectar con Meta.
2. Se abre Embedded Signup oficial; si aparece un QR, se confirma desde WhatsApp Business. No se usa WhatsApp Web ni un QR generado por CIERRE.
3. El servidor verifica sesión de Supabase, titularidad del negocio, WABA y Phone Number ID en Graph API, suscribe webhooks y cifra el token por comercio.
4. El vendedor envía el PDF normalmente. Si su dispositivo es compatible, llega un \`smb_message_echoes\` firmado.
5. La función Edge registra el documento y lo coloca en cola sin asumir que sea un presupuesto.
6. Si hay claves configuradas, el webhook invoca en segundo plano al lector PDF. Se consultan Media ID, contenido del PDF y extracción estructurada. Los fallos quedan reintentables en Postgres.
7. Las respuestas del cliente y las intervenciones humanas se guardan como señales sin texto en claro. Rechazos, baja y pagos bloquean seguimiento.
8. Cada hora, la base compara última interacción + horas elegidas y registra estado de revisión, espera, bloqueo o \`shadow_due\`.
9. El panel muestra el resultado de prueba y permite pausar o marcar una venta manualmente.

## Importante: todavía NO funcional al 100% con clientes reales

**Sin verificar**:
- Permisos y credenciales comerciales reales de Meta/Embedded Signup, primera vinculación del número, ecos de PDF desde los dispositivos de ese corralón.
- Calidad de lectura del PDF de su software ERP en al menos 20 archivos autorizados de formatos diversos.
- Cobertura completa de la agenda y la diferencia real entre agendados/no agendados.
- Datos de compras en mostrador y facturación del ERP externo.
- Consentimiento, derechos de datos y plantilla aprobada de WhatsApp para contactos fuera de la ventana de 24 horas.
- Retries periódicos de PDFs fallidos: hay cola persistente y primera ejecución automática, pero no cron de reintentos con secreto en Vault. Se requiere configurar el invocador de la función \`cierre-pdf-worker\` con una credencial privada antes del uso real.
- Envío único transaccional con auditoría, opt-out, frecuencia máxima por contacto y confirmación de entrega. No implementado: **el sistema no envía WhatsApps**.
- Pruebas end-to-end en cuentas reales. Tener Edge Functions \`ACTIVE\` indica desplegadas, no probado su circuito contra Meta y OpenAI.
- Vercel sigue bloqueando compilaciones del frontend Next.js: se usa el portal alternativo en Pages para que el piloto de cuentas y preferencias no dependa de Vercel.

La aceptación de un piloto completo requiere pruebas con números voluntarios, cero duplicados, cero violaciones de baja, cobertura probada, y verificación externa de ventas. No prometer 100% de certeza ante mensajes faltantes o compras fuera de WhatsApp.

## Acceso seguro

Portal alternativo: https://protectorrudo.github.io/cierre/

Cuando la app Meta esté configurada, el botón de conectar se habilitará al consultar \`/functions/v1/cierre-meta-connect\`. Una cuenta común no puede registrar falsamente un número como conectado. El dueño solo ve sus tres opciones y el control de pausa.
