# VIRALIO ESCAPE — PLAN EJECUTABLE PARA AMPLIAR LA BIBLIOTECA PREMIUM
**Fecha:** 15/10/2026  
**Objetivo:** salas de escape 3D realistas y rentables, primero usando recursos gratuitos CC0. No iniciar compras automáticamente.

## 0. Estado de partida y límites de la promesa

- Catálogo base: 81 GLB / 14 materiales PBR, incorporados en `public/viralio-3d/` (confirmar `index.json`).
- La ampliación de octubre suma **cuatro personajes con rig y 7 clips** y utilería complementaria al catálogo: ver `data/viralio-3d/catalog.json`. **No considerar cualquier recurso como descargado hasta verificar su presencia en `public/viralio-3d/index.json`.**
- El objetivo es **fotorealismo perceptual**, no solo objetos con muchos polígonos: textura, escala, iluminación, animación y diseño narrativo deben ser coherentes.
- Los humanos CC0 basados en MakeHuman son una base técnica reutilizable, **no** personajes de calidad cinematográfica certificada. No llamar a una sala "hiperrealista" antes de verla en el teléfono.

## 1. PRIORIDAD 1 — objetos que el jugador examina de cerca

Buscar, integrar y verificar por este orden:

| Área | Recursos / búsquedas | Por qué importan | Uso en salas |
|---|---|---|---|
| Cerraduras y pistas | teclado de acceso, caja fuerte, candado, llave, cajón, libreta, combinaciones | Primer plano manipulable: todo error visual se nota | Todas |
| Electrónica narrativa | proyector, CRT, videocámara, panel CCTV, terminal, radio, cassette, teléfono | Los mensajes y revelaciones tienen soporte físico | Cine, UMBRAL, Caso M |
| Puertas y salida | industrial, emergencia, barrotes, hospital, pomo y bisagras animables | Es la promesa de la historia: escapar | Todas |
| Muebles protagonistas | escritorio, armario, biblioteca, mesa quirúrgica, archivador | Pistas ocultas, interacciones y colisiones | Todas |
| Materiales y luz | hormigón, pintura envejecida, metal oxidado, madera, vidrio, HDRI, lightmaps | Unifica sensación de realismo | Todas |

**Gate obligatorio:** modelo bien iluminado en cámara móvil, UV/PBR correcto, malla separada para interacción, peso adecuado. Si parece plástico o cartoon, descartarlo o reservarlo para fondo.

## 2. PRIORIDAD 2 — personajes animados y presencia psicológica

### Bases CC0 incorporadas al catálogo

| ID de recurso | Base | Movimientos prometidos en ficha | Uso de ficción potencial |
|---|---|---|---|
| `npc-sam-locomotion` | Sam, ropa casual | 7: quieto, marcha, paso rápido, trote, carrera, transporte, sentarse/levantarse | Intruso, testigo, celador |
| `npc-harper-locomotion` | Harper, ropa laboral | 7 | Enfermera, personal, detective |
| `npc-jordan-locomotion` | Jordan, traje de negocios | 7 | Acomodador, guardia, investigador |
| `npc-maya-locomotion` | Maya, ropa casual | 7 | Testigo, recepcionista, presencia misteriosa |

Fuente: `https://www.innerscene.com/tools/library/3d-parts/` y cada ficha individual indicada en catálogo. Modelos basados en MakeHuman/MPFB y animaciones originales de Innerscene; la ficha declara CC0. **No son capturas mocap profesionales**, ni garantizan animación facial.

Implementación: `src/lib/viralio-characters.ts`, con `AnimationMixer`, crossfades y escenas clonadas para NPCs independientes. Cada juego debe aportar navegación/IA, timing de aparición, orientación al jugador, cambios de estado y efectos de audio. Se puede combinar con accesorios propios, pero sin asumir ropa o rostro no incluidos.

### Comportamientos a programar (no vienen con el modelo)

1. `idle` + respiración y microgestos durante espera.
2. `lookAtPlayer` suave, rotación de cuello/torso dentro de límites anatómicos.
3. `patrol` sobre puntos del escenario con velocidad y colisiones reales.
4. `investigate` al escuchar un sonido o abrir un cajón.
5. `approach` aproximación amenazante y freno antes de invadir la cámara.
6. `chase` persecución breve sin clips deslizantes.
7. `exit` desaparición detrás de una puerta y reaparición teatral.
8. `reaction` sobresalto, retroceso o señal de un peligro.
9. Sonido 3D sincronizado con pasos y superficie de suelo.
10. LOD e inhibición de animación para NPCs lejanos / no visibles.

**Nunca reutilizar el mismo rostro en dos salas contiguas sin variación real.** Crear identidad mediante vestuario con licencia, máscara, accesorios, silueta, entonación y dirección actoral. Mantener presupuesto de personajes por sala según FPS, memoria y dispositivo.

### Animaciones externas

- **Mixamo (Adobe):** gratis con Adobe ID para uso comercial en videojuegos; descarga interactiva bajo condiciones oficiales, sin automatizar el inicio de sesión ni copiar sus animaciones a una biblioteca redistribuida como producto separado. https://helpx.adobe.com/ar/creative-cloud/faq/mixamo-faq.html
- **ActorCore:** evaluación opcional cuando el salto de movimiento sea cuantificable; revisar licencias de exportación/uso antes de integrar.
- **Character Creator:** opción futura si necesitamos distintos rostros/vestuario expresivo sin comprar cada figura. No comprarlo solo porque su nombre diga "Character".

## 3. PRIORIDAD 3 — escenas únicas que escalen a muchas salas

Construir piezas modulares de arquitectura realista (puertas, paredes, techos, escaleras, ventanas) con:
- mapas PBR CC0 locales;
- separación de piezas móviles y colisionadores simples;
- variantes de desgaste, color, detalles, iluminación, decoración y recorridos;
- 5 estilos base de `src/lib/viralio-rooms.ts`: mansion, hospital, bunker, detective, hotel.

No repetir las cinco plantillas idénticas. Para cada sala producir un set de 3 espacios verdaderamente diferenciados: *premisa*, *pista progresiva*, *pico de tensión*.

## 4. Presupuestos: cero compras por defecto

| Plan | USD en licencias | Qué ganamos | Cuándo |
|---|---:|---|---|
| **Mínimo** | **0** | CC0 de Poly Haven/Innerscene, texturas PBR y cuatro rigs con siete animaciones cada uno | **Ahora** |
| **Intermedio** | **29 por mes que se contrate** | ActorCore Motion Subscription: 20 movimientos premium/mes anunciados por el proveedor; Mixamo como alternativa sin costo | Solo si la prueba A/B demuestra necesidad |
| **Premium** | **299 de compra base + opcional 29/mes** | Character Creator 5 Standard (precio de referencia USD 299) + opcional ActorCore + nuestros recursos CC0 | Tras validar la venta y potencial reutilización |

*Impuestos y tipo de cambio en Argentina se agregan; los valores comerciales son referencias publicadas el 15/10/2026, sujetas a cambios. Los packs Fab no tienen precio universal: elegir uno concreto y aprobar gasto antes de adquirir. CC5 Standard no incluye automáticamente todos los complementos, exportaciones ni contenidos opcionales; corroborar las licencias de cada producto.*

Ver precios/licencias originales:
- https://actorcore.reallusion.com/motion-subscription
- https://www.reallusion.com/character-creator/
- https://www.fab.com/eula
- https://polyhaven.com/license
- https://helpx.adobe.com/ar/creative-cloud/faq/mixamo-faq.html

### Reglas de compra

Solo evaluar un recurso pago cuando **todos** se cumplan:
- Ya se agotó o descartó por calidad la alternativa CC0.
- Sirve en al menos **tres salas**, o es el elemento central de una campaña con ROI razonable.
- Aporta un salto demostrado con una comparación visual concreta.
- Pasa prueba de exportación glTF/GLB y móvil.
- Licencia comercial comprobada para videojuego web, no redistribución independiente.
- Se aprueba el precio final de cada compra. **Nunca realizar pagos autónomos.**

## 5. Gestión de calidad automatizada

**Fuente de verdad:** `public/viralio-3d/index.json`, no el catálogo aspiracional.

Para todos los modelos nuevos: GLB v2 válido, hash SHA-256, límites de peso, número de mallas, texturas, animaciones, nombre de ficha fuente, licencia. Para personas: **skin+rig y al menos 3 animaciones** (de preferencia 7) en origen y postoptimización. No eliminar todos los huesos durante optimización.

**Prueba visual por dispositivo:**
- Android gama media: objetivo 30 FPS sostenidos, medir 1% low y picos.
- Evitar descargas simultáneas de toda la biblioteca en el teléfono.
- Prop héroe legible en zoom y tolerancia de interacción táctil.
- Personajes sin pies deslizándose, articulaciones torcidas, manos rígidas o saltos de clips.
- Escenarios variados con material roughness adecuado (sin aspecto plástico).

## 6. Instrucción de adopción para asistentes

> Antes de crear o modificar una sala de Viralio Escape consulta `docs/VIRALIO_3D_PREMIUM_ROADMAP.md`, `docs/VIRALIO_3D_OPERATIONAL_LIBRARY.md`, `public/viralio-3d/index.json` y `src/lib/viralio-characters.ts`. Prioriza recursos CC0, usa modelos locales optimizados, integra objetos interactivos y selecciona un NPC con clip real si la historia lo pide. Toda sala debe superar una revisión en Android. No des por hecha la calidad hiperrealista sin una comparación visual del resultado; no compres activos sin autorización. Documenta origen, licencia y consecuencias para rendimiento.

