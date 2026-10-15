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


## Packs de arquitectura, terror y objetos escaneados (227 GLB / 37 PBR)
El catálogo ejecutable actualizado está en `public/viralio-3d/index.json` y el índice PBR en `public/viralio-3d/materials/index.json`. Al crear una sala, consulta `data/viralio-3d/experience-packs.json` para nueve combinaciones temáticas de objetos, los assets 3D nuevos en `data/viralio-3d/catalog.json` y la auditoría `docs/VIRALIO_3D_ARCH_HORROR_EXPANSION.md`. Reutiliza escenas con diseño propio, iluminación y aperturas reales. No confundir maniquí, esqueleto, paciente estático ni escultura de monstruo alado con una criatura animada o un NPC jugable. No cargar los 227 modelos juntos; solo lo necesario por sala.


## Pack de fútbol — lectura obligatoria
Para canchas, vestuarios, manga/túnel, charlas técnicas, tableros y salas de videoanálisis, leer [`docs/VIRALIO_3D_FOOTBALL_LIBRARY.md`](docs/VIRALIO_3D_FOOTBALL_LIBRARY.md) y los cuatro packs de fútbol en `data/viralio-3d/experience-packs.json`. Verificar cada recurso efectivamente publicado en `public/viralio-3d/index.json`, usar `grass_ground`, `rubber_tiles`, `concrete_tiles` y demás PBR del índice de materiales. Un jugador de fútbol en pose no tiene rig ni movimiento. El pack externo modular de 72 piezas no se pudo descargar desde Actions, por lo que no es un recurso local disponible; evitar prometer que está instalado. Para un videojuego premium usar estos modelos de utilería/escala como base, iluminación optimizada, interacciones reales, y no usar escudos, logos, camisetas oficiales ni retransmisiones de partidos sin permisos.


## Regla de alcance: biblioteca, no juego
Cuando el usuario pida buscar, ampliar o incorporar mobiliario, personajes, canchas, paredes, puertas, materiales, texturas o recursos 3D para Viralio, **trabajar únicamente en el inventario y el repositorio de assets**: búsqueda y verificación de procedencia, licencias, descargas y optimización, índices GLB/PBR, documentación, vista previa de activos si la solicita. No crear ni modificar niveles, partidas, mecánicas, rutas jugables, rompecabezas ni fichas comerciales sin una solicitud explícita y separada para diseñar un juego. Los packs temáticos son catálogos optativos para elegir luego, no una autorización para construir escenas o integrar modelos en niveles existentes.


## Objetos de fútbol CC0 verificados
Para elegir **solamente assets** de fútbol, leer `docs/VIRALIO_3D_FOOTBALL_PREMIUM_ASSETS.md`, consultar `data/viralio-3d/polyhaven-football-models.json` y confirmar ambos balones fotoescaneados en `public/viralio-3d/index.json` (`football-polyhaven-dirty` y `football-polyhaven-worn`). Hay 171 modelos GLB y 26 materiales PBR; 12 props nuevos de vestuario, fisioterapia y figuras deportivas estáticas. Los packs son listas opcionales: **no construir juegos ni modificar salas sin pedido explícito**.


## Biblioteca Universal Core — objetos cotidianos fotorrealistas
Cuando la tarea sea buscar sillas, mesas, sofás, heladeras, comida, vajilla, armarios, objetos domésticos o decoración para futuras salas, consultar primero `docs/VIRALIO_3D_UNIVERSAL_CORE.md` y `data/viralio-3d/universal-core.json` (32 seleccionados, 18 PBR Innerscene y 14 fotoescaneados Poly Haven). `data/viralio-3d/polyhaven-universal-models.json` conserva las fichas CC0 de Poly Haven y `scripts/build-polyhaven-universal.mjs` importa GLB optimizados. Registrar toda descarga y verificar `public/viralio-3d/index.json` antes de contar modelos disponibles. Utilizar los cinco materiales PBR de madera/cuero de `data/viralio-3d/materials.json`. Calidad: priorizar hero para primer plano, support en medio; no confundir PBR con fotorrealismo certificado. **Este inventario NO autoriza crear, editar o publicar ningún juego.**

Biblioteca validada al 15/10/2026: **203 archivos GLB y 31 sets PBR**. Los 32 modelos nuevos de Universal Core ya están efectivamente en `public/viralio-3d/index.json` (18 Innerscene y 14 Poly Haven). No alterar juegos sin pedido separado.


## Cinematic Premium CC0: nuevas personas, artefactos, luz y VFX
Consulta `docs/VIRALIO_3D_CINEMATIC_PREMIUM.md` y `data/viralio-3d/cinematic-core.json` antes de proponer figuras con uniforme, faroles, objetos antiguos, o ambientes cinematográficos. Estado de catálogo comprobado: **227 GLB, 37 materiales PBR, 7 HDRI**. Los 9 nuevos humanos uniformados son ESTÁTICOS. Los 2 nuevos bailarines tienen rig y **un clip** cada uno; los cuatro NPC anteriores tienen siete clips. Los HDRI de `public/viralio-3d/hdri/index.json` son iluminación y reflejo, NO escenas 3D. Los sprites transparentes procedurales (si se construyen, `public/viralio-3d/vfx/index.json`) son texturas VFX originales, no humo o niebla volumétricos reales. Mantener prioridad en fotorrealismo real y control de calidad, y no cambiar juegos hasta pedido explícito.


## Nature & Investigation Core — solo activos artísticos
Para buscar o elegir plantas, árboles, troncos, animales, figuras inquietantes, esculturas, humanoides editables, cuadernos y pequeños objetos de investigación, consultar [`docs/VIRALIO_3D_NATURE_INVESTIGATION.md`](docs/VIRALIO_3D_NATURE_INVESTIGATION.md) y `data/viralio-3d/nature-investigation-core.json`. El catálogo reúne 23 GLB CC0 originales/de Innerscene y 6 modelos vegetales Poly Haven de alto detalle, además de cinco materiales PBR. Verificar **presencia física** en `public/viralio-3d/index.json` y `public/viralio-3d/materials/index.json`; no declarar exitosos los que fallen al materializar. Los animales, las esculturas y los maniquíes **son estáticos**. El humanoide de 53 huesos **tiene rig, pero no animaciones** y NO es un monstruo terminado. Las plantas/helechos necesitan prueba de alfa, transparencia y rendimiento. La búsqueda de assets **no autoriza modificaciones de juegos, rutas, personajes activos o mecánicas**. Mantener CC0 verificable y presupuesto US$0.
