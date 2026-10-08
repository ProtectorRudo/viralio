# Te Hice Esto · Compra → agradecimiento → acceso privado

Fuente de verdad de las Edge Functions que están en producción de Supabase **Te Hice Esto**. No cambiar snapshots premium-v1/premium-v2.

## Circuito
1. `order-create` crea regalo y orden pendientes con email del comprador.
2. Mercado Pago Checkout v2 y webhook v2 verifican la acreditación en el proveedor.
3. `payment-bridge` recibe sincronización HMAC, valida monto y estado, y marca orden `approved`.
4. En una aprobación real, solicita `gift-account.requestLink` con email y código. La transacción continúa aunque el mail falle, y deja registrada una incidencia recuperable.
5. `gift-account` valida la compra aprobada. Si `RESEND_API_KEY` está presente, genera link de autenticación de un solo uso con Supabase Auth y envía un email premium por Resend. Sin Resend, mantiene el flujo histórico Supabase OTP, que **NO es apto para compradores externos** hasta configurar SMTP.
6. Al abrir el correo, Supabase verifica la identidad; `/mis-regalos?regalo=<codigo>` canjea la sesión y pide un editor token para ese regalo. El cliente personaliza y publica mediante el flujo premium-v2 congelado.
7. `order-status` permite reintentar la entrega al reabrir el pedido, solo después de un enfriamiento de 20 minutos. El acceso se puede recuperar manualmente desde `/mis-regalos`.

## Variables de Supabase (proyecto Te Hice Esto)
- `RESEND_API_KEY` **necesaria para correos reales**, secreto del proveedor.
- `TEHICEESTO_EMAIL_FROM` opcional; por defecto `Te Hice Esto <hola@tehiceesto.com>`; ese dominio y remitente deben estar verificados en Resend para que funcione.
- Nunca incorporar valores de claves API a Git, a logs ni al cliente.
- Desactivar tracking de enlaces en Resend: los enlaces de Supabase Auth son temporales y de un solo uso.

## Auditoría y recuperación
- `orders.access_email_sent_at`: proveedor aceptó el intento (no significa lectura ni llegada a bandeja).
- `orders.access_email_last_attempt_at`: intento más reciente; evita bucles/dobles envíos.
- `orders.access_email_error`: código seguro cuando falla.
- El mecanismo debe tolerar webhooks duplicados y no marcar como enviado ante HTTP no exitoso.
- No enviar enlaces de edición ni emitir sesión antes de verificar que el usuario controla el email.
- Revisar mensajes rechazados y buzón de spam con una compra controlada antes de activar publicidad.

## Estado de puesta en marcha (2026-10-08)
Se agregó código de email de agradecimiento y reintentos; **no se confirmó un proveedor Resend configurado**.
El test de acceso con el email de prueba recibió HTTP 200 usando **correo estándar de Supabase**, no de Resend. Eso no valida la entrega a compradores reales.
La conexión y verificación de dominio en Resend es una condición pendiente para producción masiva.
