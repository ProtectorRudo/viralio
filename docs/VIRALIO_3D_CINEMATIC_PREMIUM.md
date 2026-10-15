# VIRALIO ESCAPE — CINEMATIC PREMIUM LIBRARY

**Edición:** 15/10/2026. **Alcance exclusivo:** biblioteca de modelos, materiales e iluminación, NO diseño ni desarrollo de juegos.

## Contenido de esta ampliación

### 12 modelos de personas/artefactos CC0 de Innerscene

**Personajes estáticos** (sin animación):
- `premium-guard-drew` — guardia sin marca; hotel, cine, búnker
- `premium-doctor-jordan` — médico con abrigo clínico; hospital
- `premium-surgeon-alex` — cirujano; hospital/laboratorio
- `premium-paramedic-drew` — paramédico con bolsa de emergencias
- `premium-nurse-tablet-micah` — enfermero con tableta
- `premium-construction-worker-drew` — operario con casco/chaleco
- `premium-chef-sam` — chef para restaurante/cocina
- `premium-courier-owen` — repartidor con paquete
- `premium-worker-clipboard-taylor` — personal con planilla

**Personajes animados independientes** (un solo clip):
- `premium-dancer-step` — paso lateral; rig 53 huesos y un clip original
- `premium-dancer-groove` — baile de brazos; rig 53 huesos y un clip original

Estos **NO** son humanoides de captura de movimiento ni NPC completos. Los cuatro NPC de locomoción previamente incorporados tienen 7 clips; los dos bailarines de esta tanda tienen solo uno. Las figuras de uniformes en esta ampliación se descargan como mallas estáticas; **no** es correcto prometer que caminan, persiguen o gesticulan. También son relativamente pesadas en origen; medir memoria/GPU después.

**Artefacto de electrónica:**
- `premium-audio-speaker` — parlante portátil PBR original.

### 12 modelos fotoescaneados/fotorrealistas de Poly Haven (CC0)

Se descargan desde `data/viralio-3d/polyhaven-cinematic-models.json` con `scripts/build-polyhaven-cinematic.mjs`, convertido desde glTF oficial a GLB 1K y verificado (mallas/materiales/SHA).

| ID | Artefacto | Utilidad |
|---|---|---|
| `premium-ph-hurricane-lantern` | Farol de tormenta con vidrio/bronce | Misterio, mansión, exterior |
| `premium-ph-victorian-books` | Enciclopedias encuadernadas | Biblioteca, hotel, pistas |
| `premium-ph-telephone-clock` | Reloj-pieza telefónica | Pistas temporales y decoración |
| `premium-ph-wooden-candle` | Candelabro con vela gastada | Ritual / mansión |
| `premium-ph-magnifier` | Lupa de metal/cristal | Investigación, acertijos |
| `premium-ph-metal-toolbox` | Caja metálica oxidada | Taller / sótano |
| `premium-ph-metal-tool-chest` | Cajonera de herramientas | Depósito / taller |
| `premium-ph-bolt-cutters` | Cizalla metálica | Taller |
| `premium-ph-hand-truck` | Carro de cargas | Almacén / local comercial |
| `premium-ph-garden-gnome` | Gnomo de jardín de cerámica | Patio / sorpresa visual |
| `premium-ph-crystal-chandelier` | Araña de cristal | Teatro / hotel / mansión |
| `premium-ph-wood-lantern` | Farol de madera | Mansión / casa rústica |

**Importante:** lámparas y candelabros son geometrías PBR; no crean por sí solos una luz real ni emiten sonido/efectos. Si algún recurso está riggeado o tiene piezas separadas, comprobar el GLB antes de publicitarlo como interactivo.

### Seis superficies CC0 realistas de Poly Haven

`rusted_shutter`, `rust_coarse_01`, `wood_plank_wall`, `painted_concrete_02`, `smoke_speckled_veneer`, `metal_grate_rusty`.

Aportan 6 × 3 = 18 mapas 1K (diffuse, normal GL y ARM). La madera `smoke_speckled_veneer` NO es un efecto de humo: es una textura de tablero de madera oscura.

### Siete HDRI reales de Poly Haven

Se publican aparte en `public/viralio-3d/hdri/` y se identifican en `hdri/index.json`, desde `data/viralio-3d/polyhaven-hdri.json`:

- `cinema-vintage` — Pretville Cinema
- `cinema-lobby` — Cinema Lobby
- `abandoned-warehouse` — Abandoned Construction
- `abandoned-tile-room` — Abandoned Tiled Room
- `victorian-old-hall` — Old Hall
- `forest-mist` — Misty Pines
- `abandoned-games-room` — Abandoned Games Room 02

**Un HDRI es luz/fondo/reflexión fotográfica, no un nivel 3D, no niebla volumétrica simulada ni partículas.** El HDRI es útil para mejorar el realismo de los materiales y el entorno, pero la integración en Three.js con RGBELoader, PMREM y control de exposición es tarea de una sala futura (no realizada en esta petición).

## Control de veracidad y rendimiento

Para afirmar que la ampliación quedó instalada verificar conjuntamente:

1. Índice GLB: `public/viralio-3d/index.json` contiene los 12 originales nuevos y 12 Poly Haven fotorrealistas.
2. Índice materiales: `public/viralio-3d/materials/index.json` incluye los 6 materiales nuevos.
3. Índice HDRI: `public/viralio-3d/hdri/index.json` contiene los entornos efectivamente descargados.
4. Informes: `data/viralio-3d/build-report.json`, `polyhaven-cinematic-report.json`, `hdri-report.json` sin descargas fallidas si se anuncia la tanda entera.
5. Modelos en primer plano: inspeccionar con vista real de Three.js y cámara de Android; no dar por verificada la estética solo porque el GLB pasó la prueba binaria.
6. Evitar cargar todos los humanos a la vez o HDRI grandes; la carga debe realizarse por sala y por recurso, únicamente tras elegirlos.

Licencia: modelos/texuras/HDRI CC0 publicados por [Poly Haven](https://polyhaven.com/license) e [Innerscene](https://www.innerscene.com/tools/library). Revisión de procedencia individual en los manifest. No se compraron recursos.

## Lista de necesidades futuras (sin archivos instalados)

- Fantasmas humanoides realmente cinematográficos, con rig facial y animaciones de terror comprobadas
- Efectos de humo y polvo en sprites/flipbooks CC0 separados (no confundir con HDRI)
- Audio de pasos, gemidos, electricidad y puertas con licencia comercial segura
- Personajes específicos de cada historia con dirección artística propia

Estos son **pendientes**. No llamar fotorrealista a lo que solo sea una idea.
