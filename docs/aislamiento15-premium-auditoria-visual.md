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
| 16 | Nuevo monstruo único con rostro y animaciones personalizadas | Muy alto | Alto | Pendiente |
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

**Próxima inversión artística:** priorizar (16) criatura única, (17) reemplazo de los últimos props de bloque, (18) mecanismos físicamente animados; luego medir (19) y (20) antes de comercializar.
