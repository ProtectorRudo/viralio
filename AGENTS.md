<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Viralio Escape — obligatorio antes de tocar escenas 3D

Consulta [`docs/VIRALIO_3D_LIBRARY.md`](docs/VIRALIO_3D_LIBRARY.md) para encontrar modelos, paredes modulares, escenas, materiales PBR, personajes y efectos 3D gratuitos con calidad fotorrealista. Prioriza recursos reutilizables y aptos para móviles antes de crear geometría genérica o comprar assets. Comprueba licencia/atribución, compatibilidad glTF/GLB y rendimiento real; documenta la procedencia de todo asset externo. También consulta [`docs/aislamiento15-asset-licenses.md`](docs/aislamiento15-asset-licenses.md) como precedente de integración. **El catálogo no equivale a modelos ya descargados; debes integrar y probar cada recurso explícitamente.**


## Biblioteca 3D materializada — uso preferente
Al trabajar en salas 3D de Viralio consulta primero `docs/VIRALIO_3D_OPERATIONAL_LIBRARY.md`, `data/viralio-3d/catalog.json` y `data/viralio-3d/materials.json`. Usa `src/lib/viralio-3d.ts` para cargar modelos CC0 de forma perezosa y `src/lib/viralio-rooms.ts` para superficies/escenarios PBR. Los archivos finales y sus índices están en `public/viralio-3d/` **solo después** de ejecutar el pipeline. Confirma la presencia real y QA de cada asset. Busca la licencia y el origen antes de incorporar nuevos modelos, y evita descargar todos los modelos cuando el jugador solo necesita unos pocos.

## Paquete premium de personajes y prioridades
Antes de decidir compras, vestuario, modelos de primer plano o NPCs, sigue [`docs/VIRALIO_3D_PREMIUM_ROADMAP.md`](docs/VIRALIO_3D_PREMIUM_ROADMAP.md). Usa el catálogo CC0 y `src/lib/viralio-characters.ts` para instanciar humanoides animados con clips, sin confundir bases MakeHuman con humanos fotorrealistas terminados. No ofrecer como descargados los que solo estén en catálogo; comprobar `public/viralio-3d/index.json`. Mantener gasto en US$0 por defecto; solicitar aprobación previa de cada compra.


## Packs de arquitectura, terror y objetos escaneados (155 GLB / 26 PBR)
El catálogo ejecutable actualizado está en `public/viralio-3d/index.json` y el índice PBR en `public/viralio-3d/materials/index.json`. Al crear una sala, consulta `data/viralio-3d/experience-packs.json` para nueve combinaciones temáticas de objetos, los assets 3D nuevos en `data/viralio-3d/catalog.json` y la auditoría `docs/VIRALIO_3D_ARCH_HORROR_EXPANSION.md`. Reutiliza escenas con diseño propio, iluminación y aperturas reales. No confundir maniquí, esqueleto, paciente estático ni escultura de monstruo alado con una criatura animada o un NPC jugable. No cargar los 155 modelos juntos; solo lo necesario por sala.


## Pack de fútbol — lectura obligatoria
Para canchas, vestuarios, manga/túnel, charlas técnicas, tableros y salas de videoanálisis, leer [`docs/VIRALIO_3D_FOOTBALL_LIBRARY.md`](docs/VIRALIO_3D_FOOTBALL_LIBRARY.md) y los cuatro packs de fútbol en `data/viralio-3d/experience-packs.json`. Verificar cada recurso efectivamente publicado en `public/viralio-3d/index.json`, usar `grass_ground`, `rubber_tiles`, `concrete_tiles` y demás PBR del índice de materiales. Un jugador de fútbol en pose no tiene rig ni movimiento. El pack externo modular de 72 piezas no se pudo descargar desde Actions, por lo que no es un recurso local disponible; evitar prometer que está instalado. Para un videojuego premium usar estos modelos de utilería/escala como base, iluminación optimizada, interacciones reales, y no usar escudos, logos, camisetas oficiales ni retransmisiones de partidos sin permisos.
