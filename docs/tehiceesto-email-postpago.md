# Te Hice Esto · Compra → agradecimiento → acceso privado

Fuente de verdad de las Edge Functions que están en producción de Supabase **Te Hice Esto**. No cambiar snapshots premium-v1/premium-v2.

## Circuito
1. `order-create` crea regalo y orden pendientes con email del comprador.
2. Mercado Pago Checkout v2 y webhook v2 verifican la acreditación en el proveedor.
3. `payment-bridge` recibe sincronización HMAC, valida monto y estado, y marca orden `approved`.
4. En una aprobación real, solicita `gift-account.requestLink` con email y código. La transacción continúa aunque el mail falle, y deja registrada una incidencia recuperable.
5. `gift-account` valida la compra aprobada. Si `RESEND_API_KEY` existe o el token restringido está en Supabase Vault (`tehiceesto_resend_sending_key` mediante RPC backend), genera link de autenticación de un solo uso con Supabase Auth y envía un email premium por Resend. Sin Resend, mantiene el flujo histórico Supabase OTP, que **NO es apto para compradores externos** hasta configurar SMTP.
6. Al abrir el correo, Supabase verifica la identidad; `/mis-regalos?regalo=<codigo>` canjea la sesión y pide un editor token para ese regalo. El cliente personaliza y publica mediante el flujo premium-v2 congelado.
7. `order-status` permite reintentar la entrega al reabrir el pedido, solo después de un enfriamiento de 20 minutos. El acceso se puede recuperar manualmente desde `/mis-regalos`.

## Variables de Supabase (proyecto Te Hice Esto)
- El token **Resend sending_access**, limitado al dominio de Te Hice Esto, está cifrado en `vault.secrets` bajo el nombre `tehiceesto_resend_sending_key`. No se guarda en el repositorio ni en variables públicas.
- La Edge Function llama `public.tehiceesto_private_resend_key()` únicamente desde el cliente backend `service_role`. Esta función **NO tiene EXECUTE para `anon` ni `authenticated`**. Se mantiene compatibilidad con `RESEND_API_KEY` si más adelante se configura por la vía tradicional.
- `TEHICEESTO_EMAIL_FROM` opcional; por defecto `Te Hice Esto <hola@tehiceesto.com>`; ese dominio y remitente deben estar verificados en Resend para que funcione.
- Nunca incorporar valores de claves API a Git, a logs ni al cliente.
- Plantilla Resend publicada con alias `tehiceesto-bienvenida-compra`, variables `CUSTOMER_NAME`, `EXPERIENCE_NAME`, `ACCESS_LINK`. Se envía como template de Resend, no HTML duplicado en el backend.
- Desactivar tracking de enlaces en Resend: los enlaces de Supabase Auth son temporales y de un solo uso.

## Retry automático y seguridad del checkout
- La sincronización de una orden ya aprobada utiliza `syncStatusOnly:true` en `checkout-v2 → payment-bridge`. El modo `create` sigue bloqueado en una compra pagada; no se genera un nuevo cobro.
- `retry_tehiceesto_purchase_emails()` se ejecuta por `pg_cron` cada 30 minutos, solo para pagos nuevos aprobados después del corte de despliegue que no tengan confirmación de envío. Reconsulta el estado real de Mercado Pago.
- Los usuarios anónimos y autenticados no pueden ejecutar la función de cron directamente.
- El buzón `hola@tehiceesto.com` no tiene registro MX en el dominio raíz; es un remitente saliente, no un inbox funcional. Hasta crear un buzón real debe usarse WhatsApp como soporte.

## Auditoría y recuperación
- `orders.access_email_sent_at`: proveedor aceptó el intento (no significa lectura ni llegada a bandeja).
- `orders.access_email_last_attempt_at`: intento más reciente; evita bucles/dobles envíos.
- `orders.access_email_error`: código seguro cuando falla.
- El mecanismo debe tolerar webhooks duplicados y no marcar como enviado ante HTTP no exitoso.
- No enviar enlaces de edición ni emitir sesión antes de verificar que el usuario controla el email.
- Revisar mensajes rechazados y buzón de spam con una compra controlada antes de activar publicidad.

## Estado de puesta en marcha (2026-10-08)
- Resend conectado; dominio `tehiceesto.com` creado en región São Paulo (`sa-east-1`). Se configuraron DKIM, SPF TXT, SPF MX y CNAME en Hostinger.
- Se solicitó verificación; DNS SPF/MX/CNAME figuran `verified` y DKIM **pending** en la última comprobación. No enviar comunicaciones reales hasta que el dominio quede completamente verificado.
- Se creó credencial Resend con permiso `sending_access` limitada a `tehiceesto.com`; almacenada cifrada en Supabase Vault.
- Se desplegó `gift-account` v5 con lectura del secreto por RPC y envío a través de la plantilla publicada.
- Pendiente: verificar DKIM y hacer una compra aprobada de prueba con correo real, revisar recepción, autenticación, edición, publicación y rebotes.
- Nunca confiar solamente en un HTTP 200 o un build READY para dar por completo el flujo.
