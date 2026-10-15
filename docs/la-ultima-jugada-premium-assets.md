# La Última Jugada — recursos premium de la biblioteca Viralio 3D

Actualizado: 2026-10-15. Estado: **copias binarias presentes en rama de desarrollo** mediante Git tree/sha del repositorio principal. Uso comercial: **CC0-1.0** según catálogo fuente `public/viralio-3d/index.json` de `main`. Carga local mediante Three.js GLTFLoader; sin URLs externas en runtime.

## Modelos premium seleccionados

| ID | Archivo local | Autor fuente | Tamaño (bytes) | SHA-256 | Origen |
| --- | --- | --- | ---: | --- | --- |
| `steel-office-desk` | `/viralio-3d/models/steel-office-desk.glb` | Poly Haven contributors | 553308 | `deeabbce85f36815a6ee1647a7069674db7501f8d4ef13cc12cf577810436970` | [Ficha](https://www.innerscene.com/tools/library/3d-parts/steel-office-desk-16158a62) |
| `video-analysis-27inch-monitor` | `/viralio-3d/models/video-analysis-27inch-monitor.glb` | Innerscene original model | 67180 | `85b397b4d9f5335ca485138305737830070c127b7f6e42cd3c91c01737abe807` | [Ficha](https://www.innerscene.com/tools/library/3d-parts/27-inch-monitor-office-technology-961fb20e) |
| `key-grid-mechanical-keyboard` | `/viralio-3d/models/key-grid-mechanical-keyboard.glb` | Innerscene | 21976 | `42cc21e24ac2d16480a5c863b2f9c0f6417813366fb444190db64f9b43250ff2` | [Ficha](https://www.innerscene.com/tools/library/3d-parts/key-grid-mechanical-keyboard-8503e99e) |
| `cctv-security-camera` | `/viralio-3d/models/cctv-security-camera.glb` | Poly Haven contributors | 661252 | `03aa2f9b910025c15a3d8600ad3162e0226666a7a0f7c8995bdce7d82cc2f0f3` | [Ficha](https://www.innerscene.com/tools/library/3d-parts/cctv-security-camera-ca92b457) |
| `access-control-keypad` | `/viralio-3d/models/access-control-keypad.glb` | Innerscene | 26852 | `56cbda30bbb0d44a6b7efa11b959a30485d0fcbcb675a7e82dcc127f13dd06c4` | [Ficha](https://www.innerscene.com/tools/library/3d-parts/access-control-keypad-32fe0a6e) |
| `football-duffel-bag` | `/viralio-3d/models/football-duffel-bag.glb` | Innerscene original | 49096 | `685295ba65c2817b1fcc23676e3e4f3e8bc096d2b1139af4b1f3d760f73ed321` | [Ficha](https://www.innerscene.com/tools/library/3d-parts/weekender-travel-storage-1225c9b9) |
| `football-backpack` | `/viralio-3d/models/football-backpack.glb` | Innerscene original | 63956 | `b83d6c857b30ed252ed2b8e076fe43b7a02a248def9fa0fb57a0bb9ae48ae09c` | [Ficha](https://www.innerscene.com/tools/library/3d-parts/daypack-travel-storage-95695502) |
| `vent-perforated-locker` | `/viralio-3d/models/vent-perforated-locker.glb` | Innerscene original model | 822316 | `8ad0137f2fd9d20f5d31157c3fe4ef43293e9baf725070009eae160434350e12` | [Ficha](https://www.innerscene.com/tools/library/3d-parts/vent-perforated-locker-f5acf922) |
| `four-compartment-locker` | `/viralio-3d/models/four-compartment-locker.glb` | Innerscene original model | 68524 | `41cf716d2e6ce280644acd40ab07dfa17a3e379ffdc1d33f0e1eb8ca94df0aea` | [Ficha](https://www.innerscene.com/tools/library/3d-parts/four-compartment-office-locker-bank-e9b274a5) |
| `football-polyhaven-dirty` | `/viralio-3d/models/football-polyhaven-dirty.glb` | Rohit Seervi | 623756 | `3ce46a04de16cc4e856e6f72a2a460dd9d7ccbd7f30164997ca1576557f986e5` | [Ficha](https://polyhaven.com/a/dirty_football) |
| `football-scoreboard` | `/viralio-3d/models/football-scoreboard.glb` | Innerscene original model | 60664 | `ee2aa5daf8f23a3a74bbea8702e73b27fef06aae8fcaeb36de0e1b1075dbcd5f` | [Ficha](https://www.innerscene.com/tools/library/3d-parts/scoreboard-sports-equipment-12d80980) |
| `workshop-industrial-steel-door` | `/viralio-3d/models/workshop-industrial-steel-door.glb` | Innerscene / credited creator on source | 133652 | `eb8fb393d981a1b789aa6a71fbc88e930e8471a356b34f31ee73cddb2b92cba4` | [Ficha](https://www.innerscene.com/tools/library/3d-parts/workshop-industrial-steel-door-4773934f) |

| `npc-sam-locomotion` | `/viralio-3d/models/npc-sam-locomotion.glb` | Innerscene / MakeHuman MPFB contributors | 3197476 | `c2a7e56257e9a57dcff20845067cc66681769701734b6c659ef97eab57e4945a` | [Ficha](https://www.innerscene.com/tools/library/3d-parts/locomotion-collection-sam-3d-person-animated-dc23800f) |

El entrenador utiliza `npc-sam-locomotion`: un personaje **skinned** de 12 skins y 7 clips originales (`Idle_Standing `, `Walk_Relaxed `, `Walk_Brisk `, `Jog `, `Run `, `Walk_Carry `, `Sit_Stand`). Este rig está destinado al entrenador del túnel; los futbolistas del estadio conservan un modelo más liviano. La apariencia final se audita mediante capturas y no se presume hiperrealista.

## Materiales PBR

Base de archivos: `/viralio-3d/materials/`. `color` (sRGB), `normal` (OpenGL), `arm` (AO-Roughness-Metallic empaquetado). Procedencia: **Poly Haven, CC0**.

| Material | Ficha | Mapas locales |
| --- | --- | --- |
| `old_linoleum_flooring_01` | [Poly Haven](https://polyhaven.com/a/old_linoleum_flooring_01) | `/viralio-3d/materials/old_linoleum_flooring_01-color.webp`, `/viralio-3d/materials/old_linoleum_flooring_01-normal.webp`, `/viralio-3d/materials/old_linoleum_flooring_01-arm.webp` |
| `concrete_tiles` | [Poly Haven](https://polyhaven.com/a/concrete_tiles) | `/viralio-3d/materials/concrete_tiles-color.webp`, `/viralio-3d/materials/concrete_tiles-normal.webp`, `/viralio-3d/materials/concrete_tiles-arm.webp` |
| `rubber_tiles` | [Poly Haven](https://polyhaven.com/a/rubber_tiles) | `/viralio-3d/materials/rubber_tiles-color.webp`, `/viralio-3d/materials/rubber_tiles-normal.webp`, `/viralio-3d/materials/rubber_tiles-arm.webp` |

## Escena, rendimiento e interacciones

- Cabina: escritorio de acero PBR, monitor, teclado, cámara de seguridad, bolso, mochila y balón fotoescaneado; los tres monitores del acertijo conservan sus texturas dinámicas y raycast originales.
- Corredor: casillero PBR de cuatro compartimentos sustituye la carcasa procedimental si carga correctamente; las etiquetas, credenciales, pulsadores y colisionadores originales **siguen operativos**. Teclado de acceso y cámara CCTV local.
- Túnel: bolso de utilería y pequeño marcador físico, sin ocupar la posición del técnico ni alterar la cámara del gol.
- Superficies: linóleo para la cabina, goma para los otros espacios y placas de hormigón en paredes. Tres mapas PBR reales cargados progresivamente con `TextureLoader`; procedurales como respaldo para WebGL móvil.
- Solo precarga de modelos que aparecerán en el primer escenario. El resto se solicita al avanzar, con caché compartida de GLTFLoader. No precargar los 171 GLB.
- Objetivo móvil: 30 FPS prácticos, sujeto a medición en dispositivos reales. No anunciar FPS sostenidos sin esa auditoría.
- Seguridad legal: no usar fotografías promocionales ni escudos oficiales. Este registro no transfiere permisos distintos de CC0.

## Verificación pendiente

- Pruebas E2E de las tres salas, HTTP 200 para los cinco primeros GLB, captura real desktop/mobile.
- Comprobar proporciones, caras de modelo y que la pizarra/expediente no queden tapados por utilería.
- Verificar el tamaño/resolución y mediana de FPS en un Android de gama media y un iPhone real.

La biblioteca principal contiene más modelos que los copiados en esta rama. Los demás **no están integrados** en esta versión.
