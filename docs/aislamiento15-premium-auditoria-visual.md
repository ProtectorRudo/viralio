# AISLAMIENTO 15 — Auditoría visual premium

**Pase:** HÉLIX 015, 14/10/2026. **Juego:** https://protectorrudo.github.io/aislamiento-15/

**Dirección artística:** medicina industrial reconvertida en pesadilla de contención. Urgencias con verdosos fríos, Aislamiento con cian clínico y señales de cuarentena, Contención con acero oscuro y ámbar/rojo de emergencia. El terror no debe oscurecer la legibilidad de las pistas. Todas las salas siguen siendo 3D real en Three.js, no un fondo plano.

## Top 20 cambios visuales, ordenados por resultado comercial

| # | Mejora exacta | Impacto | Riesgo móvil | Estado |
|---|---|---|---|---|
| 1 | Señalética física de la marca de ficción HÉLIX / 015 | Alto | Bajo | Integrado |
| 2 | Luz principal de color y orientación diferente para cada sala | Muy alto | Bajo | Integrado |
| 3 | Hacer sobresalir con luz los puntos de interacción sobre paredes y muebles | Muy alto | Bajo | Primera pasada |
| 4 | Componer Urgencias con monitores, lámparas, instrumentación y rastros de abandono | Alto | Medio | Primera pasada |
| 5 | Pods de cuarentena con vidrio, juntas, pernos y luz de seguridad | Muy alto | Medio | Integrado |
| 6 | Figura fugaz reconocible detrás del cristal | Muy alto | Bajo | Integrado |
| 7 | Reactor 3D animado como punto focal de Contención | Muy alto | Medio | Integrado |
| 8 | Emergencias luminosas ligadas al nivel de peligro sin múltiples sombras | Alto | Bajo | Integrado |
| 9 | Manchas, desgaste y marcas aplicadas con intención narrativa | Alto | Bajo | Primera pasada |
| 10 | Monitores médicos con lectura propia y emisión sin deslumbramiento | Alto | Bajo | Integrado |
| 11 | Compuertas mecánicas con nervaduras, pernos, sello y animación | Alto | Medio | Integrado previamente |
| 12 | Reorganización de carteles y pistas para no bloquear el pasillo | Alto | Bajo | Primera pasada |
| 13 | Intertítulos de capítulo animados, tipografía del universo HÉLIX | Alto | Bajo | Integrado |
| 14 | Peligro lateral discreto en móvil al acercarse el perseguidor | Alto | Bajo | Integrado |
| 15 | PBR con diferencias claras entre cerámica, goma, metal, vidrio y textiles | Muy alto | Medio | Parcial |
| 16 | Criatura HÉLIX con máscara propia sobre humano CC0, 7 clips esqueléticos y persecución física | Muy alto | Alto | Implementado parcialmente; faltan pruebas de acabado comercial |
| 17 | Reemplazo de cada prop restante de blockout por GLB profesional | Muy alto | Alto | Parcial |
| 18 | Animación física y colisiones de válvulas, relés, cajones y accesorios | Alto | Medio | Parcial |
| 19 | Perfilado real de draw calls, transparencias y resolución en Android físico | Muy alto | Alto | Pendiente |
| 20 | Validación fotográfica de tres salas y playtest humano de 15 minutos | Crítico | — | En pruebas |

## Evidencia, arquitectura y límites de lo verificado

- HospitalCinematics.ts: señales, cristales, silueta fugaz, reactor y luces animadas en geometría real.
- IsolationWorld.ts: WebGL2, iluminación focal por sector, PBR, GLTFLoader, AnimationMixer y control de amenazas.
- IsolationGame.tsx e isolation.css: transiciones cinematográficas, indicador de peligro y control táctil.
- Pipeline de QA visual: workflow qa-aislamiento-15-cinematics.yml en el repositorio de GitHub Pages, preparado para fotografías de las tres salas en escritorio y celular vertical.
- Pipeline de QA completo: qa-aislamiento-15-route.yml, prueba del recorrido de acertijos y condiciones de evacuación.

La verificación de compilación y de interacciones NO sustituye 30 FPS reales en equipos Android de gama media, pruebas de 15 minutos con jugadores no familiarizados, ni una certificación de premium comercial. Esas puertas de calidad siguen abiertas.

**Progreso adicional (14/10/2026):** base humana animada CC0 de 7 clips comprimida a 6MB, geometría original del rostro, anclaje a hueso de la cabeza, 6 momentos de tensión con sonido sincronizado, persecución A* y colisiones para mobiliario fijo. Pruebas automatizadas: recorrido integral, ruta contra obstáculos, capturas en escritorio y celular vertical. **Próxima inversión:** pulir criatura (texturas y proporciones), sustituir los últimos props simples, perfilar teléfonos físicos y medir la partida completa con personas nuevas antes de comercializar.


## Inspección de capturas reales — correcciones aplicadas

La primera auditoría de las seis capturas reveló tres defectos que no aparecían en las pruebas de TypeScript: (a) un pod central ocultaba la escena de Aislamiento, (b) un armario bloqueaba la vista de Contención y (c) las transmisiones superpuestas ocupaban el centro de la pantalla. Los tres se corrigieron.

La segunda inspección encontró que las ruedas de purga aún parecían discos de colores suspendidos delante de la puerta. Se sustituyeron por tres mecanismos metálicos con corona, radios, eje, placa de montaje e hitbox táctil discreta, instalados sobre la pared lateral.

**Resultado de la última verificación automática:**

- Fotografías de Urgencias, Aislamiento y Contención en escritorio 1280×720 y móvil vertical 390×844.
- Nueve archivos GLB de equipamiento hospitalario y personaje con respuesta 200.
- Ningún error JavaScript en las sesiones de captura.
- Circuito lógico completo de tres sectores y evacuación final aprobado en Chromium.
- Publicación de GitHub Pages completada.

**Limitación de la evidencia:** el flujo de captura sitúa la cámara directamente en cada sala para auditar su composición. Por eso el HUD de esas seis imágenes puede conservar el título de Urgencias y un temporizador reciente, aunque el entorno sea de otra sala. El cambio real de HUD fue cubierto por el test independiente del recorrido completo. No usar esas seis capturas como prueba de una partida de 15 minutos.

**Calidad pendiente:** el modelo del perseguidor sigue siendo un GLB propio reutilizado y, pese al oscurecimiento de sus materiales, no constituye un diseño de criatura nuevo. Parte del mobiliario secundario conserva formas simplificadas. Es imprescindible un personaje autoral, sustitución de props restantes y pruebas de FPS/duración con jugadores antes de venderlo como producto 3D premium definitivo.

**Ver evidencias de QA:**
- https://github.com/ProtectorRudo/ProtectorRudo.github.io/actions/runs/38639232956
- https://github.com/ProtectorRudo/ProtectorRudo.github.io/actions/runs/38639238559
