# VIRALIO ESCAPE — Biblioteca de fútbol: cancha, vestuario, manga, táctica y videoanálisis

**Actualización:** 2026-10-15. **Descargas locales verificadas al cerrar la compilación (consultar índice).** **Estado:** inventario oficial de modelos CC0 / arte modular; comprobar la publicación efectiva en `public/viralio-3d/index.json` y `materials/index.json`.

## Visión de dirección artística

**Meta:** un club de fútbol creíble, futbolístico y cinematográfico, jugable en navegador y móvil. El objetivo NO es reproducir un estadio famoso ni mostrar logos reales no autorizados.

- Las escenas interiores deben verse como vestuarios y salas técnicas profesionales, no oficinas genéricas recoloreadas.
- El jugador debe atravesar **vestuario → manga de entrada → cancha**, con sala de videoanálisis como segmento opcional de misterio/pistas.
- El pack **externo** de 72 piezas de estética LOW-POLY en 3DAssets.dev es una referencia de layout para cancha/tribunas, gradas, dugout, conos, arcos y vestuario. Su CDN no estuvo accesible desde GitHub Actions, por lo tanto **NO existe una copia local ni figura en el catálogo operativo**. Para primeros planos, elegir objetos PBR de Innerscene y texturas fotoescaneadas.
- Fichas de jugadores de fútbol en poses de correr/rematar son **mallas estáticas sin esqueleto**, NO animaciones jugables. Para un futbolista caminando o corriendo, adaptar de forma artística un modelo con rig + clips de `src/lib/viralio-characters.ts` y crear uniforme original.
- No confundir un HDRI de estadio con una escena 3D explorable. Es un fondo iluminado y mapa de reflexiones, no arquitectura ni tribuna con colisiones.

## Inventario de recursos reales (ids)

**Cancha y estadio**
- `football-goal-full-size` — arco de tamaño reglamentario con red.
- `football-goal-junior` — arco reducido para entrenamiento.
- `bleachers-three-row` — grada reutilizable de tres filas.
- `football-scoreboard` — marcador de estadio.
- **Referencia externa solamente:** [pack modular 72 piezas](https://3dassets.dev/packs/football-soccer-club-grounds), sin archivo disponible en producción. Si se vuelve accesible, importarlo y validarlo antes de usar.

**Vestuario y charla técnica**
- Nuevos props CC0: `football-duffel-bag`, `football-backpack`, `football-toiletry-kit`, `football-mudroom-bench`, `football-changing-bench`, `football-tilted-shoe-rack`, `football-foam-roller`, y `football-hardcase-suitcase`. Consultar `docs/VIRALIO_3D_FOOTBALL_PREMIUM_ASSETS.md` para clasificación PBR y límites.
- `vent-perforated-locker` — locker metálico perforado detallado, con rail de banco.
- `four-compartment-locker` y `lock-3-office-locker-bank` — almacenamiento compartimentado.
- `football-coat-stand` — perchero auxiliar.
- `mobile-double-whiteboard` y `mobile-tactics-whiteboard` — pizarras y tácticas.
- `football-conference-table` — mesa para cuerpo técnico.
- `foosball-football-table` — metegol como ambientación de club.

**Sala de videoanálisis**
- `video-analysis-27inch-monitor` — monitor 27''.
- Reutilizar `sixty-five-inch-display-with-wall-bracket`, `project-box-projector`, `pan-tilt-zoom-camera-on-pole`, `key-grid-mechanical-keyboard`, `retro-laptop`.
- `football-laptop-trolley` — mesa móvil de análisis.

**Figuras humanas**
- `soccer-player-running-static` y `soccer-player-kicking-static`: personajes vestidos de futbolistas, **en pose fija**, texturas embebidas, sin rig.
- Humanoides originales animados: `npc-sam-locomotion`, `npc-harper-locomotion`, `npc-jordan-locomotion`, `npc-maya-locomotion`; uso como prototipo para staff, no se ven automáticamente como deportistas profesionales.

**Materiales PBR Poly Haven**
- `grass_ground` — tierra con pasto gastado (útil en márgenes), no césped corto perfecto.
- `sparse_grass` — césped ralo.
- `grass_path_2` — sendero exterior para cancha de entrenamiento.
- `rubber_tiles` — solado de vestuario deportivo.
- `old_linoleum_flooring_01` — solado de sala técnica / oficinas.
- `concrete_tiles` — manga y circulación a estadio.

El archivo `data/viralio-3d/experience-packs.json` define cuatro conjuntos de escenas reutilizables: `futbol-vestuario`, `futbol-manga`, `futbol-videoanalisis`, `futbol-cancha-estadio`. Cada uno tiene héroes, soportes, material y recorrido de tres etapas. Son direcciones artísticas, no salas programadas.

## Recursos fotorrealistas CC0 y referencias externas

**Los dos balones siguientes YA tienen GLB optimizado y SHA-256 en `public/viralio-3d/index.json`, descargados desde la API oficial Poly Haven (1K):**

1. [Poly Haven — Dirty Football](https://polyhaven.com/a/dirty_football) — id local `football-polyhaven-dirty`, fotogrametría CC0 optimizada.
2. [Poly Haven — Football](https://polyhaven.com/a/football) — id local `football-polyhaven-worn`, balón parcialmente desinflado CC0 optimizado.
**Las siguientes son referencias EXTERNAS: no son archivos GLB locales ni escenas listas para jugar.**

3. [Poly Haven — Orlando Stadium HDRI](https://polyhaven.com/a/orlando_stadium) — estadio soleado, cielo e iluminación, CC0. Usar 1K/2K convertido a formato web, NO 24K.
4. [Poly Haven — Stadium 01 HDRI](https://polyhaven.com/a/stadium_01) — estadio al atardecer, CC0.
5. [Poly Haven — Suburban Soccer Park HDRI](https://polyhaven.com/a/suburban_soccer_park) — práctica diurna, CC0.
6. [Innerscene Drawing Library — campo 105 x 68 m](https://www.innerscene.com/tools/library/drawings/football-pitch-dimensioned-cad-layout-6d463c24) — DXF **2D**, referencia dimensional CC0, NO un GLB 3D.

**Alternativas que NO deben incorporarse automáticamente:** estadios de Sketchfab CC BY sin créditos, modelos comprados con licencias restrictivas o estadios reales con logos protegidos. Revisión manual de permisos si queremos incorporarlos.

## Cómo construir realmente una experiencia premium

### Vestuario
- Columnas de lockers a distintas alturas, suelos de goma, banco y zapateros, duchas / superficies húmedas.
- Ropa de entrenamiento original, botines, bolsos y toallas aún requieren modelos adicionales (no fingir que están ya).
- Pistas: número de casillero, camiseta, fichas de convocatoria, candado interactivo.

### Manga y corredor
- Revestimientos de hormigón, puertas cortafuego y señalética de salida.
- Curvas de pasillo, rampas, luces lineales, rejas y sonido de hinchada espacial.
- El túnel debe tener longitud física, luz al final y colisiones; no mostrar una pared plana con una imagen de estadio.

### Sala táctica y videoanálisis
- Renderizar **4-3-3 / 4-4-2 / 3-5-2** en la pizarra usando CanvasTexture y fichas que puedan moverse.
- Reproducir en pantallas video propio/permitido mediante VideoTexture o secuencias generadas; no insertar retransmisiones sin derechos.
- Mostrar pista escondida en un frame, decisiones del entrenador y clave formada por números de dorsales.

### Cancha y tribuna
- Terreno reglamentario 105 x 68 m + líneas con material separado, topografía y césped.
- A distancia, estadio de base liviana; en primer plano, PBR con microdetalle y sombras estables.
- No colocar miles de meshes independientes como público. Emplear impostores/instancias o audio de ambiente.
- Usar HDRI del estadio como cielo y reflejo solo después de descargar una versión optimizada.
- Colisiones para vallas, banquillos, túnel, arcos; ambientación sonido 3D por etapas.

## Criterios comerciales
- Usar **uniformes originales y ficticios** a menos que se confirme licencia de clubes/equipaciones/escudos.
- Evitar logos de AFA, FIFA, Conmebol, clubes y torneos oficiales sin autorización.
- Los cuatro humandoides con animación no son jugadores futbolísticos acabados.
- Comprar nuevos packs únicamente si calidad y permisos justifican el presupuesto.

## Fuentes
- https://www.innerscene.com/tools/library
- https://polyhaven.com/license
- https://3dassets.dev/packs/football-soccer-club-grounds
- https://3dassets.dev/api/v1/packs/football-soccer-club-grounds
