# AISLAMIENTO 15 — protocolo final de playtest comercial

**Versión:** control de calidad 15/10/2026. **URL:** https://protectorrudo.github.io/aislamiento-15/

El juego está publicado, pero **no está certificado para venta** hasta validar la duración, dificultad y rendimiento en equipos físicos con participantes nuevos.

## Prueba en dispositivos reales

- Probar al menos un Android de gama media, un Android de gama alta y un iPhone (Safari), preferentemente con tamaños de pantalla distintos.
- Iniciar partida sin conocimiento de códigos, secuencias ni localizaciones. Usar auriculares. Jugar desde una sesión fresca.
- Terminar Urgencias, Aislamiento y Contención, examinando al menos un cartel y un documento; comprobar que ninguna transición dependa de tocar una zona microscópica.
- Registrar si un acertijo exige una pista (niveles 1, 2 o 3), genera confusión, queda fuera del alcance o exige volver a intentar por fallos de control.
- En Ayuda → Medir FPS, observar estabilidad en los tres sectores, especialmente ante luces de alerta y persecuciones. Evaluar la sensibilidad de arrastre, doble toque, joystick y pellizcar para hacer zoom.
- Dejar la aplicación en segundo plano dos veces y comprobar que el crédito global no excede 45 segundos. Verificar que la criatura no ataque mientras se lee una ficha médica.
- Al ganar o perder, elegir **COPIAR INFORME DE PRUEBA** y pegarlo en la conversación de desarrollo. El juego no sube telemetría automáticamente.

## Criterios de aceptación antes de activar cobros

| Puerta de calidad | Evidencia requerida |
|---|---|
| Recorrido completo | Ningún bloqueo físico o lógico en tres habitaciones, 0 errores JS críticos, todos los objetos alcanzables |
| Tiempo y dificultad | Cinco partidas de personas nuevas, con tiempo, número de pistas, tasa de conclusión y frustraciones documentadas |
| Rendimiento | Medidas in situ para 30 FPS mínimos prácticos en móvil gama media durante exploración, amenaza y acertijos; objetivo 60 en compatibles |
| Calidad visual | Tres salas comprensibles sin linterna obligatoria; texto de avisos accesible desde distancia real; personaje y props no se atraviesan |
| Interacción táctil | Todos los mecanismos se seleccionan con el dedo, joystick y zoom sin saltos ni cámara bloqueada |
| Audio | Sonido se inicia por gesto, alarmas y amenazas sincronizadas, control de silencio funcional |
| Integridad temporal | Sellado a 900 segundos; 45 s de cortesía total y no por cada cambio de aplicación |
| Compatibilidad | Pantalla de error clara ante WebGL no disponible, nunca start CTA engañoso |
| Derechos | Procedencia y licencia comercial verificadas para cada GLB, sonido y textura usados |

**Importante:** Chromium en CI con emulación vertical/no-GPU no valida calor, RAM, batería ni FPS en Android o iPhone real. Las herramientas automatizadas verifican código, mecánicas y capturas; el informe local recopila datos de los dispositivos donde realmente juegan las personas.

## Registros y evidencia del repositorio

- \`src/app/aislamiento-15/LocalPlaytest.ts\`: mediciones privadas en memoria, informe legible y copiable.
- \`src/app/aislamiento-15/IsolationGame.tsx\`: estado de partida y controles reales, incluyendo las pantallas de fin.
- \`.github/workflows/qa-aislamiento-15-route.yml\`: recorrido hasta ganar, vencimiento a los 900 segundos, reinicio, informe y fallback.
- \`.github/workflows/qa-aislamiento-15-cinematics.yml\`: capturas del escenario real para tres habitaciones en dos resoluciones y gestos táctiles.

**Estado:** falta evidencia de dispositivos físicos. No afirmar que la experiencia está lista para cobrar por superar solamente CI.
