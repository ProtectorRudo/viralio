# CIERRE en Viralio: piloto SaaS multiempresa

## Estado (22 de octubre de 2026)
Implementado en `/cierre`: acceso por correo/contraseña con Supabase Auth, creación de comercio, panel independiente, ajustes de seguimiento, lista de oportunidades y sección de conexión oficial de WhatsApp.

**No hay números de WhatsApp conectados.** El botón de Meta está deliberadamente deshabilitado hasta que estén configurados App Review, Embedded Signup, el receptor seguro y las credenciales de la aplicación del proveedor. El código no inicia envíos de WhatsApp y la configuración de los negocios impone `shadow_only = true`.

## Almacenamiento
Se reutiliza el proyecto Supabase activo de Viralio para bajar el costo inicial, con tablas exclusivas del producto CIERRE:
- `public.cierre_businesses`: id, owner_id, nombre, industria.
- `public.cierre_settings`: política por negocio, texto aprobado localmente, modo sombra obligatorio.
- `public.cierre_connections`: estado y cobertura de recepción, exclusivamente lectura para titulares.
- `public.cierre_opportunities`: presupuestos observados, exclusivamente lectura para titulares.

Todas tienen RLS habilitado. Las consultas están restringidas al propietario real `auth.uid()` contra `cierre_businesses.owner_id`, nunca contra metadata del cliente. El browser únicamente puede escribir información del comercio que le pertenece y su configuración; no puede marcar conexiones como habilitadas ni crear oportunidades de forma unilateral. Ninguna contraseña se almacena en estas tablas: se delega a Supabase Auth.

## Prueba del producto
1. Entrá en `https://viralio.net/cierre` después de que el despliegue de Vercel esté READY.
2. Creá una cuenta con un email habilitado para recibir confirmación.
3. Confirmá por correo y volvé a ingresar. Configurar los Redirect URLs permitidos en Supabase Auth (incluyendo `https://viralio.net/cierre`) es necesario para la confirmación y recuperación por correo.
4. Creá un comercio. El panel deberá mostrar indicadores cero, no cifras ficticias.
5. Configurá horas y mensaje fijo. El panel debe guardar y recuperar los cambios después de salir e ingresar nuevamente.
6. Abrí `WhatsApp`: debe indicar **no conectado** y explicar el QR oficial de Embedded Signup sin simular una conexión.

## Conexión oficial pendiente
- Solicitar y configurar una aplicación Meta con permisos aprobados para WhatsApp Business y Embedded Signup, incluida la modalidad de coexistencia si se conserva la app de WhatsApp Business.
- Configurar el `config_id`/Facebook Login y el backend servidor que intercambia el código sin exponer App Secret.
- Meta puede mostrar un QR en Embedded Signup: el dueño debe confirmarlo desde la app WhatsApp Business. **No usar QR de WhatsApp Web ni automatización de navegadores o librerías no oficiales.**
- Asociar de forma autenticada el WABA y Phone Number ID resultantes al único `business_id` del titular.
- Recibir `messages` y `smb_message_echoes` firmados; validar dispositivo real, PDF, reintentos, compras y bajas en modo sombra.
- Usar tablas o funciones servidor para ingestión con garantías transaccionales y deduplicación. No dejar que el browser inyecte estados.
- Un envío real requiere por separado: consentimiento de contacto, plantilla aprobada, ventana/política de Meta, idempotencia transaccional y verificación de ventas externas.

## Consideraciones de despliegue
El proyecto de Vercel ya está vinculado al GitHub `ProtectorRudo/viralio`. Los cambios realizados no modifican la página principal ni las rutas de juegos. Si el commit queda en estado pendiente o ERROR, inspeccionar el build en Vercel antes de afirmar que la URL está lista. La API de Vercel del equipo devuelve un 403 por permiso insuficiente desde este chat, aunque GitHub sí permite consultar el estado de CI del commit.

## Costos y privacidad
Para el MVP se reutiliza el backend de Supabase ya existente, sin pagar por un nuevo servidor. El costo final depende de usuarios activos, eventos, almacenamiento, número de WhatsApp, conexión oficial y consumo real de mensajería. Los datos de cada negocio no deben mezclarse ni mostrarse en registros públicos. Todos los contenidos de chat reales requieren autorización del titular del negocio y una política clara de tratamiento y retención.
