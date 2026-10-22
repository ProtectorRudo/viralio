# CIERRE — QA integrado y laboratorio PDF (22/10/2026)

## Producto: dos reglas innegociables

1. El dueño configura solamente **24/36/48/72 horas**, alcance (todos, agendados, sin agendar) y texto. Existe **Pausar CIERRE** como protección de emergencia. Los vendedores no deben hacer trabajo extra.
2. Nunca sugerir un contacto si falta confirmar PDF, conversación o cobertura. Los envíos siguen **apagados** mientras se valida Meta y la autorización legal/comercial.

## Implementado en este avance

- Receptor Meta `cierre-whatsapp-webhook` (Supabase Edge Function **v4 ACTIVE**). Verifica firma HMAC Meta y asocia mensajes al negocio; detecta documentos, bajas, pagos y seguimientos humanos.
- Clasificación de **mensajes entrantes ambiguos** con OpenAI en segundo plano, `store:false`, máximo 3 por lote para limitar costos. La IA solo puede bloquear, pedir revisión o marcar duda; jamás habilitar envíos. El texto original no se guarda en `cierre_webhook_events`. Fallos dejan la oportunidad en revisión.
- Función interna `cierre_apply_ai_signal` solo ejecutable por `service_role` y solo sobre un evento entrante perteneciente al negocio correcto. Rechaza clasificaciones duplicadas.
- Procesador `cierre-pdf-worker` (v1 ACTIVE) y alta `cierre-meta-connect` (v1 ACTIVE) siguen en modo sombra.
- Nuevo **laboratorio PDF** `cierre-pdf-preview` (v2 ACTIVE), autenticado por usuario+negocio. Desde el apartado **WhatsApp** del portal alternativo se puede seleccionar un PDF local de prueba (máximo 5 MB). El archivo se envía a OpenAI con `store:false` para diagnóstico, no se guarda en base y no crea oportunidades ni envíos. No aparece habilitado hasta configurar `CIERRE_OPENAI_API_KEY`.
- Portal `ProtectorRudo.github.io/cierre/` actualizado; tres opciones de configuración sin cambios.
- Evaluador de oportunidades con `pg_cron` cada **5 minutos**, sin enviar WhatsApps.

## Pruebas transaccionales ejecutadas en la base real

Se ejecutaron dos casos sintéticos dentro de `BEGIN ... ROLLBACK`, sin dejar usuarios, presupuestos ni contactos ficticios:

**QA 1 — plazos y bloqueos**
- Con conexión y PDF verificados, presupuesto 40 h anterior y configuración de 36 h → `shadow_due`.
- Mensaje de compra posterior → oportunidad `blocked`, y evaluador también `blocked`.
- Reintento del mismo Message ID → deduplicado.
- Pausa del comercio → resultado bloqueado.

**QA 2 — ingreso PDF → extracción simulada → IA**
- Evento `smb_message_echoes` sintético con documento → nueva oportunidad + trabajo de cola.
- Se simuló **solo la respuesta estructurada del lector** (NO se invocó OpenAI real) mediante `cierre_finish_pdf_job`: monto, número y moneda correctos → candidato.
- Evaluador → `shadow_due`.
- Mensaje desconocido → revisión.
- Clasificación simulada `purchase/high` mediante `cierre_apply_ai_signal` → bloqueado.
- Clasificación duplicada → rechazada.
- Reevaluación del cron → sigue bloqueado.

Ambas transacciones concluyeron sin excepciones. Después se verificaron **0 usuarios, 0 negocios, 0 presupuestos y 0 trabajos PDF** existentes en la base CIERRE; los datos de QA fueron revertidos.

## Validaciones de seguridad

- `public.cierre_apply_ai_signal`: `anon=false`, `authenticated=false`, `service_role=true`.
- Las cuatro funciones Edge de CIERRE están `ACTIVE`, pero **ACTIVE no demuestra** que Meta/OpenAI real esté funcionando.
- El panel utiliza clave publicable y JWT del dueño; la extracción de prueba valida la titularidad del negocio en Supabase.
- Ninguna función publicada envía WhatsApps.
- El documento PDF de prueba no se guarda como presupuesto ni se almacena en Storage; se envía transitoriamente a OpenAI para extracción bajo sus políticas de retención.

## Lo que falta antes de declarar CIERRE operacional

1. Cargar las credenciales y permisos oficiales de Meta y realizar Embedded Signup de un número autorizado del corralón; confirmar ecos de WhatsApp Business app, Web y/o Windows según el dispositivo.
2. Configurar `CIERRE_OPENAI_API_KEY` de forma segura en Supabase Secrets; probar 20 PDFs autorizados de la herramienta que realmente utiliza el corralón, incluidos facturas, remitos y PDFs ilegibles.
3. Validar sincronización de agenda **completa** para filtros agendados/no agendados. No tratar contactos desconocidos como no agendados.
4. Resolver ventas realizadas en mostrador (fuera del chat) mediante integración con el software de facturación o una señal comercial verificable.
5. Implementar un trabajador programado con clave secreta para reintentos de PDF que fallen cuando no haya mensajes nuevos. Los trabajos existen y se reintentan en próximos ciclos, pero **no hay aún una recurrencia configurada del lector PDF**.
6. Consentimiento, plantillas Meta aprobadas, anti-duplicados transaccional de envíos y pruebas con números voluntarios. La integración real de envío **todavía no existe**.

El código de las funciones está versionado en `ProtectorRudo/viralio/supabase/functions/`. El frontend está en `ProtectorRudo/ProtectorRudo.github.io/cierre/index.html`.
