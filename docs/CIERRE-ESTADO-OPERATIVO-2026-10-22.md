# CIERRE: estado operativo y barreras externas — 22/10/2026

Estado: motor de modo sombra construido y desplegado en Supabase. NO listo para enviar WhatsApps reales; requiere autorización de Meta, credenciales OpenAI y prueba de ventas externas.

## Interfaz
El corralón configura: (1) 24/36/48/72 horas, (2) todos/agendados/sin agendar, (3) texto editable. Control adicional: Pausar. Panel alternativo en https://protectorrudo.github.io/cierre/ (código verificado en GitHub; HTTP público y login real no verificados).

## Funciones Supabase Edge desplegadas
- cierre-whatsapp-webhook v6: firma Meta, eventos, HMAC de contacto y teléfono cifrado, deduplicación, cola PDF.
- cierre-pdf-worker v3: recupera PDF desde Meta, analiza con Responses API y verifica token privado del cron.
- cierre-meta-connect v1: alta oficial Meta Embedded Signup con verificación de dueño y WABA.
- cierre-pdf-preview v3: laboratorio opcional para analizar PDFs sin guardar documentos.
- cierre-send-worker v2: trabajador de envío de plantilla PREPARADO Y DESHABILITADO. Exige CIERRE_SEND_ENABLED=true, credencial Vault, permisos del negocio, consentimiento, plantilla aprobada, venta externa comprobada, PDF correcto y validación de último momento. NO tiene cron de envío programado.

## Cron y persistencia
Trabajos cada cinco minutos: cierre_shadow_review_hourly (modo sombra), cierre_pdf_worker_retry_5m (solo llama al servidor si hay PDF pendiente), cierre_safe_outbox_staging_5m (registra intención segura), cierre_send_uncertain_timeout_5m (marcar resultado incierto sin reenviar). Retención diaria: cierre_pilot_retention. Dos secretos operativos guardados en Supabase Vault, nunca en repositorios.
16 tablas propias cierre_* protegidas con RLS. Funciones privilegiadas de envío y recepción no son ejecutables por anon ni por authenticated. Hay cero comercios, cero PDFs, cero oportunidades y cero seguimientos reales.

## Qué protege al cliente
- Mensajes de venta, baja, rechazo, consultas y seguimientos humanos bloquean o requieren revisión.
- El destinatario se guarda con AES-256-GCM y AAD específica del comercio. No guardamos el texto íntegro de los mensajes de clientes en eventos.
- Para enviar: presupuesto y monto verificados, conexión estable, consentimiento verificable, comprobación de no compra externa reciente, plantilla Meta aprobada que coincide con el texto, deduplicación por oportunidad y control de frecuencia por contacto.
- Si un envío a Meta resulta ambiguo, el estado queda uncertain y no se reintenta automáticamente.
- No se puede garantizar absoluta certeza si una compra externa sucede justo después de la última consulta al sistema de ventas.

## Pruebas con rollback completadas
- Presupuesto validado -> seguimiento simulado; compra o rechazo -> bloqueo; mismo evento -> deduplicación.
- PDF -> cola -> campos extraídos simulados -> candidato; mensaje ambiguo -> revisión; IA detecta compra -> bloqueo.
- Intención de envío solo una vez; última verificación segura; un envío incierto no vuelve a enviarse.
- Falta de consentimiento, versión de presupuesto antigua, agenda incompleta, pausa, texto de plantilla modificado y venta externa bloquean la intención.
- Cron PDF no llama al worker cuando no hay trabajos pendientes.
- Archivos de prueba: tests/cierre-outbox-rollback.sql y tests/cierre-hard-safety-gates-rollback.sql.

## Bloqueos EXTERNOS para el piloto real
1. Cuenta/aplicación de Meta Business aprobada con Embedded Signup y permisos/subscripciones messages, smb_message_echoes, smb_app_state_sync. Verificar dispositivo real (Web, móvil y/o Windows). Un número escrito no entrega permisos.
2. Variables secretas en Supabase Edge Functions: CIERRE_META_APP_ID, CIERRE_META_CONFIG_ID, CIERRE_META_APP_SECRET, CIERRE_META_VERIFY_TOKEN, CIERRE_CONTACT_HASH_KEY, CIERRE_TOKEN_ENCRYPTION_KEY y CIERRE_OPENAI_API_KEY. No pegarlas en el chat ni repositorio.
3. Conectar el ERP del corralón para comprobar ventas presenciales. Actualmente nada alimenta cierre_sale_verifications.
4. Aprobación de plantilla Meta y consentimiento por cliente. Editar el mensaje requiere aprobación acorde; no implica libertad de texto fuera de ventana de 24 horas.
5. Pruebas reales con PDFs autorizados y números de prueba: recepción del mensaje saliente y media ID, lectura de PDF, coberturas de dispositivos y agenda, bloqueo de venta y un envío único controlado.

No activar CIERRE_SEND_ENABLED ni habilitar aprobación de envíos por negocio hasta pasar las verificaciones anteriores. El worker está deployado pero NO envía porque falta esa activación explícita.

Los últimos cambios de Next.js en Vercel pueden seguir pendientes por límite de builds; la lógica central vive en Supabase Edge y la UI alternativa en GitHub Pages.