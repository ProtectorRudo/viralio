# Viralio — smoke de primer piloto

Este smoke se ejecuta después de desplegar `main` con PostgreSQL productivo y secretos de producción cargados. No guarda ni imprime secretos.

## 1. Readiness

Abrir `/alta` y usar el bloque **Pilot readiness** con la clave privada de onboarding.

Debe mostrar:
- PostgreSQL: listo;
- autenticación y canje seguro: listo;
- alta privada: listo;
- Brand Engine: listo;
- `pilotReady`: verdadero en la respuesta protegida.

El check no llama a OpenAI y no consume tokens.

## 2. Marca real

Usar un comercio que no exista en código.

Cargar:
- nombre;
- rubro real;
- logo PNG/JPG/WebP si existe;
- breve descripción de la marca;
- WhatsApp del comercio;
- PIN nuevo.

Mantener habilitado **Generar identidad con ChatGPT** y solicitar una propuesta.

Validar visualmente:
- logo correcto;
- paleta coherente con la marca;
- copy sin referencias a otro rubro;
- Story/Estado legible de forma aislada;
- estética premium, no casino/kermés;
- no se modifican premios/probabilidades por acción de la IA.

## 3. Alta y persistencia

Aprobar la propuesta y crear el comercio.

Verificar:
- la experiencia abre por su slug dinámico;
- el rubro real aparece en el funnel;
- cerrar/recargar y confirmar que identidad, copy, rubro y logo vuelven desde PostgreSQL;
- el panel del comercio acepta únicamente su PIN.

## 4. Flujo consumidor

En móvil o viewport móvil:
1. abrir el funnel;
2. desbloquear;
3. iniciar share;
4. comprobar opciones Estado de WhatsApp / Instagram Stories / WhatsApp / otras apps;
5. girar;
6. verificar que el premio visual coincide con el premio decidido por servidor;
7. guardar por WhatsApp;
8. abrir la tarjeta pública del premio.

## 5. Share card

Comprobar que la pieza 9:16:
- usa logo/paleta del comercio;
- no revela el premio ganado por quien comparte;
- contiene copy de curiosidad y referral;
- mantiene legibilidad móvil.

## 6. Canje

Desde el panel autenticado del comercio:
- buscar el código corto;
- validar AVAILABLE;
- canjear una vez;
- comprobar REDEEMED;
- segundo intento debe fallar/conflictar;
- un cliente sin sesión de comercio no debe poder autocanjear.

## 7. Cierre

Revisar logs de producción y analytics del flujo. El piloto sólo se considera habilitado cuando no hay errores críticos y el bloque Pilot readiness continúa en estado listo.

## Variables de despliegue esperadas

- `DATABASE_URL`
- `VIRALIO_PERSISTENCE=postgres`
- `VIRALIO_AUTH_SECRET`
- `VIRALIO_ONBOARDING_KEY`
- `OPENAI_API_KEY`
- `OPENAI_BRAND_MODEL` (por defecto `gpt-5.6-terra`)
- `NEXT_PUBLIC_APP_URL`

Nunca copiar valores reales de secretos a issues, logs, screenshots ni documentación.
