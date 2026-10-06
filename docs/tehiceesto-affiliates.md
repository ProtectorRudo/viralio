# Te Hice Esto · Afiliados

Arquitectura productiva del sistema de influencers.

## Atribución
- Link público: `https://tehiceesto.com/r/<codigo>`
- Ventana: 30 días.
- Regla: último clic válido.
- El link emite un token de atribución y registra la visita.
- El checkout adjunta ese token al pedido.
- La atribución queda congelada en `affiliate_order_attributions`.

## Venta y comisión
- Una visita no es una venta.
- Un pedido pendiente no es una venta.
- La comisión se genera únicamente cuando Mercado Pago deja el pedido en `approved`.
- Si el pedido se devuelve, la comisión pasa a `reversed`.
- El porcentaje queda congelado al crear la atribución para que cambios futuros no modifiquen ventas pasadas.

## Privacidad
El influencer nunca recibe nombre, email, WhatsApp ni datos personales del comprador.

## Paneles
- Admin: `/admin/afiliados`
- Influencer: `/afiliados/<slug>`

El panel del influencer se actualiza periódicamente mientras está visible y muestra visitas, visitantes únicos, pedidos, ventas, conversión, facturación, comisiones y liquidaciones.
