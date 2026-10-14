# Te Hice Esto — certificado de lanzamiento comercial (14 octubre 2026)

## Publicación
- Aplicación de producción: repo `ProtectorRudo/viralio`, rama `main`, Vercel proyecto `viralio`.
- Dominio canónico: `https://tehiceesto.com`.
- No crear un proyecto distinto ni cambiar las rutas, modelos originales, compras o datos de los clientes.
- Ruta de salida principal: GitHub -> Vercel vía integración Git, aunque la API manual devuelva 402. Si la cuota bloquea también Git, verificar rutas de Vercel sin builds sólo para cambios aislados; nunca sustituir la app por una versión parcial.
- Confirmar el SHA activo mediante `https://tehiceesto.com/api/version` y el alias Vercel, no sólo estado `READY`.

## Certificaciones obtenidas
- Auditoría de producción pre-expansión: 43/43 verificaciones (GitHub Actions 38575319902).
- Compilación y typecheck independiente del último código del 14/10: éxito (GitHub Actions 38578847317).
- Auditoría completa: `scripts/tehiceesto-launch-readiness-audit.mjs` (6 regalos, 3 salas, pago simulado, privacidad, retractación).
- Prueba de ejecución real 3D de las 3 salas, móvil/escritorio: GitHub Actions 38568048916.

## Comprobación final obligatoria
1. El dominio muestra la Home, `/crear`, 6 modelos disponibles, 3 modelos próximamente y 3 salas.
2. Ejecutar la última auditoría comercial en GitHub Actions contra el **mismo commit** publicado.
3. `/arrepentimiento` recibe solicitud, emite número de seguimiento y la lista administrativa permanece privada.
4. `/privacidad` muestra usos de datos, contacto y enlace al botón de arrepentimiento.
5. `/admin/arrepentimientos` se abre sólo tras sesión autenticada.
6. Verificar que el pago Mercado Pago está configurado a ARS 25.000, que nunca se cobran tarjetas dentro de la web y que en las salas la personalización es asistida.
7. No simular una compra real aprobada ni alterar pedidos reales de clientes. La compra real end-to-end sigue pendiente.
8. Evitar reintentos sucesivos de despliegue: una única publicación verificada.
