# Viralio Escape — biblioteca 3D operativa (actualizada 15/10/2026)

## Qué existe realmente

- **227 assets CC0 materializados y verificados** en `data/viralio-3d/catalog.json`. Incluye más de 30 modelos fotorrealistas de Poly Haven, cuatro humanoides con rig y siete clips cada uno, mobiliario, puertas, ventanas, equipamiento médico, figuras estáticas, accesorios de terror y una escultura escaneada de bronce. El carácter fotorrealista de cada escena completa aún depende de iluminación, materiales y QA en móvil.
- **37 materiales PBR CC0** de Poly Haven en `data/viralio-3d/materials.json`: 3 mapas (base color, normal OpenGL y ARM) por material, 111 mapas publicados y validados.
- **Construcción reproducible** con `scripts/build-viralio-3d-library.mjs` y `scripts/build-viralio-materials.mjs`, desplegados por `.github/workflows/viralio-3d-library.yml`.
- **Archivos GLB ya materializados** se sirven bajo `public/viralio-3d/models/*.glb`. El índice definitivo con archivos realmente disponibles es `public/viralio-3d/index.json`. El índice de materiales publicados será `public/viralio-3d/materials/index.json`.
- **Helpers de juego** `src/lib/viralio-3d.ts` para búsqueda, carga perezosa, reutilización de mallas sin descargar dos veces el mismo modelo y clonación de rigs.
- **Construcción de interiores** `src/lib/viralio-rooms.ts` con 5 tratamientos: mansion, hospital, bunker, detective, hotel.
- **Packs temáticos:** `data/viralio-3d/experience-packs.json` agrupa referencias reutilizables para cine, hospital, mansión, búnker y hotel. Ver `docs/VIRALIO_3D_ARCH_HORROR_EXPANSION.md`.
- **Visor del catálogo** `/biblioteca-3d` para previsualizar individualmente los modelos disponibles.

IMPORTANTE: **un modelo en el catálogo no equivale a un binario ya integrado**. Comprobar índices compilados y los archivos correspondientes. La ejecución automática puede fallar o quedar pendiente.

## Proceso para usar en una sala

```ts
import { loadViralio3DAsset, findViralio3DItems } from "@/lib/viralio-3d";
import { createViralioRoom } from "@/lib/viralio-rooms";

// 1) Buscar qué tenemos, sin cargar todos los modelos.
const doors = await findViralio3DItems({category: "puertas"});

// 2) Instanciar un objeto real, con copia de los nodos y la geometría compartida.
const {scene: door} = await loadViralio3DAsset("workshop-industrial-steel-door");
threeScene.add(door);

// 3) Construir una habitación con superficies PBR reales y utilería.
const result = await createViralioRoom("bunker",{width:8,depth:9});
threeScene.add(result.group);
console.log(result.loadedAssets, result.failedAssets);
```

Los props y paredes son **base artística**: el desarrollo de cada sala debe incorporar colisionadores, apertura de puertas, controles táctiles accesibles, acertijos, pistas, audios, enemigos y efectos específicos. Una puerta de GLB no se anima mágicamente.

## Reutilización sin repetir la misma habitación

- Biblioteca modular: usar geometrías compartidas con otros materiales y distribución.
- Crear variaciones de iluminación, desgaste, focos, voces, sonido ambiente, distancia de cámara y objetos narrativos.
- No repetir los mismos 4 props hero en salas contiguas, ni reutilizar la misma disposición de muebles. Las figuras anatómicas, maniquíes, pacientes y la escultura de monstruo alado SON ESTÁTICOS, no NPCs.
- Reservar fotorrealismo/alta resolución para objetos cercanos al jugador; muebles secundarios pueden usar 1K.
- No cargar automáticamente los 227 modelos ni 26 materiales en cada visita. Cada sala selecciona solo los que efectivamente usa.

## Fuentes y licencia

- Fichas: `https://www.innerscene.com/tools/library/3d-parts/<slug>` — cada una anuncia **CC0**.
- Fotografías 3D aportadas por [Poly Haven](https://polyhaven.com/models), CC0 y materiales PBR incluidos.
- Texturas: [Poly Haven](https://polyhaven.com/textures), CC0.
- `public/viralio-3d/index.json` incorpora path, SHA-256, peso, cantidad de mallas/texturas, fuente y autor del asset tal como lo registra el catálogo. Antes de publicar un modelo con disputa de procedencia, retirarlo.

No redistribuir en la colección materiales NC, exclusivos, que requieran una licencia distinta o extraídos de otros videojuegos.

## Construcción / pruebas

```bash
# Compilación de toda la biblioteca con glTF Transform instalado
npm ci
npm install --no-save --no-package-lock @gltf-transform/cli@4.5.1
node scripts/build-viralio-3d-library.mjs --all --min-success=139
node scripts/build-viralio-3d-library.mjs --all --validate-only

# Base de materiales para paredes y pisos
node scripts/build-viralio-materials.mjs
node scripts/build-viralio-materials.mjs --validate-only

npm run typecheck
npm run build
```

La Action automatizada descarga, valida GLB v2, limita tamaño por modelo, optimiza geometría (cuantización) y convierte texturas a WebP con tope de 2K para las piezas foto-realistas. Publica la biblioteca y su reporte en el repositorio; intenta preservar identificadores/nodos para uso interactivo.

Si algún modelo falla, el reporte indica los ausentes; no afirmar integración de objetos sin binarios. El catálogo incluye fichas independientes: el empaquetado real solo contiene descargas exitosas.

## Objetivos de calidad / QA pendientes

1. Confirmar FPS (objetivo 30 sostenidos) y memoria en Android gama media.
2. Evaluar cada uno de los modelos principales con iluminación real en el visor, no únicamente con snapshots promocionales.
3. Validar la exactitud de pivotes, colisionadores, UVs y estética de las paredes en los cinco presets.
4. Confirmar que todas las rutas sean accesibles desde el dominio de producción y que no haya fallos CORS/CSP.
5. Crear una escena piloto y comparar capturas con la versión actual de Viralio Escape.

**Política de costo:** US$0 en licencias, salvo autorización explícita para un recurso pago.

## Balones y vestuario de fútbol

Última selección: 12 props CC0 e instalaciones y dos balones Poly Haven fotoescaneados, convertidos y verificados. Ver `docs/VIRALIO_3D_FOOTBALL_PREMIUM_ASSETS.md`, manifest `data/viralio-3d/polyhaven-football-models.json` e índice `public/viralio-3d/index.json`. Total 171 GLB y 37 materiales PBR. Los jugadores de fondo de esta colección son figuras estáticas; no construir escenas o juegos sin solicitud.

## Universal Core fotorrealista — última incorporación

Se importaron y validaron 32 modelos: 18 Innerscene PBR y 14 Poly Haven fotorrealistas, con cinco materiales adicionales de madera y cuero; biblioteca actual **227 GLB y 37 materiales PBR**. Ver `docs/VIRALIO_3D_UNIVERSAL_CORE.md` e índice de selección `data/viralio-3d/universal-core.json`. Es un catálogo de recursos, no un juego; evitar cargar todos los modelos simultáneamente en móviles. La validación del binario no sustituye pruebas visuales.

## Cinematic Premium: personajes, artefactos, HDRI y VFX

Última ampliación verificada: **24 GLB nuevos** (9 figuras humanas estáticas, 2 figuras animadas con un clip, 1 parlante y 12 modelos fotorrealistas de Poly Haven). Además **6 materiales PBR** nuevos de desgaste/madera/metal, **7 HDRI RGBE 1K** y **6 máscaras alfa 2D** para componer humo, polvo, bruma, destellos y haces de luz.

Ver `docs/VIRALIO_3D_CINEMATIC_PREMIUM.md`, `data/viralio-3d/cinematic-core.json`, `public/viralio-3d/hdri/index.json`, `public/viralio-3d/vfx/index.json` y `public/viralio-3d/index.json`. Estado confirmado: **227 GLB, 37 materiales PBR, 7 HDRI, 6 máscaras VFX**. Los HDRI no son escenas 3D, y las máscaras no simulan niebla volumétrica por sí solas. No se modificó ningún juego.
