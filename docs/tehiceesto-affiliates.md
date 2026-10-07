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
- Las liquidaciones son registros contables internos: no transfieren dinero.
- Al registrar una liquidación se toman únicamente las comisiones pendientes existentes en ese instante, se crea un `affiliate_payout` con fecha, período, monto y referencia/notas, y esas comisiones quedan vinculadas a ese pago.
- Las ventas nuevas posteriores a la liquidación vuelven a acumularse como pendientes.
- El total “ya liquidado” se calcula desde el historial real de `affiliate_payouts`, no desde un contador manual.

## Privacidad
El influencer nunca recibe nombre, email, WhatsApp ni datos personales del comprador.

## Paneles
- Admin: `/admin/afiliados`
- Influencer: `/afiliados/<slug>`

El panel del influencer se actualiza periódicamente mientras está visible y muestra visitas, visitantes únicos, pedidos, ventas, conversión, facturación, comisiones y liquidaciones.

## Transparencia de liquidaciones
- El administrador ve pendiente, total liquidado e historial por influencer.
- El botón “Pago liquidado” registra el saldo pendiente actual como abonado, con referencia y nota opcionales.
- El influencer ve el mismo historial: fecha, cantidad de ventas incluidas, período, monto, referencia y estado.
- El registro no expone datos personales de compradores.
- Cada comisión liquidada queda asociada al `payout_id` correspondiente, evitando mezclar ventas ya pagadas con ventas nuevas.
