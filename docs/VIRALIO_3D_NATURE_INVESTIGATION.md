# Viralio Escape — Nature, Fauna, Investigation Premium Library

**Actualizado:** 15/10/2026. **Alcance:** adquisición y clasificación de assets, **no construir ni modificar juegos**.

## Objetivo de esta tanda

Ampliar la biblioteca existente de **227 GLB, 37 materiales PBR, 7 HDRI y 6 sprites VFX** con **29 modelos nuevos** (23 GLB Innerscene + 6 fotogrametrías/recursos de Poly Haven) y **5 nuevos materiales PBR** de exterior. **Verificación concluida:** GitHub Actions descargó y validó los 29 nuevos modelos y los cinco materiales, sin fallos. Recuento actual: **256 GLB, 42 PBR, 7 HDRI y 6 sprites VFX**.

Las fuentes de catálogo y descarga están en:
- `data/viralio-3d/catalog.json`: 23 modelos CC0 de Innerscene.
- `data/viralio-3d/polyhaven-nature-models.json`: seis plantas y troncos Poly Haven CC0.
- `data/viralio-3d/nature-investigation-core.json`: selección humana con prioridad *hero/support* y clasificación de animación.
- `data/viralio-3d/materials.json`: cinco materiales naturales.

## Naturaleza fotogramétrica: HERO de primer plano

| ID | Modelo | Uso |
|---|---|---|
| `nature-ph-potted-plant-large` | Planta grande en maceta de terracota | Recepciones, bares, casas, oficinas |
| `nature-ph-potted-plant-variegated` | Planta de interior frondosa | Pasillos, ventanas, hotel |
| `nature-ph-succulent-haworthia` | Suculenta pequeña | Escritorios, mesas, biblioteca |
| `nature-ph-fern-group` | Helechos agrupados | Bosques, patios, sótanos húmedos |
| `nature-ph-tree-stump-roots` | Tocón con raíces | Bosque y exteriores abandonados |
| `nature-ph-tree-stump-mossy` | Tocón con musgo | Exteriores, zonas húmedas |

Modelos fotografiados/detallados y publicados CC0 por [Poly Haven](https://polyhaven.com/models), convertidos de glTF a GLB 1K mediante script. **No** afirmar que son animables; pueden requerir una revisión de transparencia de hojas, normal maps, peso de geometría y sombreado *DoubleSide*. El original 8K no debe cargarse en móviles.

## Animales originales PBR de apoyo — figuras estáticas

- Aves: `nature-crow`, `nature-pigeon`.
- Silvestres: `nature-red-fox`, `nature-squirrel`, `nature-deer-grazing`, `nature-deer-standing`.
- Domésticos: `nature-cat-walking`, `nature-cat-sitting`, `nature-cat-sleeping`, `nature-rabbit`, `nature-dog-medium-standing`, `nature-dog-medium-lying`, `nature-dog-medium-sitting`, `nature-dog-small`.

**Las figuras son poses estáticas, no animales animados ni CGI cinematográfico garantizado.** El nombre "cat-walking" es una POSE de caminar, sin acción de andar ni movimiento. Usar de forma secundaria tras inspección visual.

## Terror, investigación, humanoide editable

- `nature-cat-statue`: gato de cemento fotoescaneado.
- `nature-lion-statue`: cabeza de león tallada, fotogrametría y PBR.
- `horror-seated-mannequin`: maniquí sentado.
- `horror-torso-mannequin`: maniquí torso.
- `character-humanoid-base-rig`: base neutra CC0 con esqueleto de 53 huesos, sin animaciones ni ropa final; sirve para **desarrollo futuro** de personajes; no es fantasma/monstruo cinematográfico.
- `investigation-open-notebook`: cuaderno abierto PBR.
- `investigation-biometric-terminal`: terminal de huella y teclado numérico PBR.
- `investigation-carpenter-workbench`: banco de carpintero realista.
- `horror-standalone-candle`: vela sin encender (no emite luz por sí sola).

Los elementos no contienen mecánicas. Una cerradura modelada no ofrece acceso biométrico real y un manuscrito necesita textura/texto propio para entregar pistas.

## Cinco materiales PBR nuevos — naturaleza

| ID | Uso |
|---|---|
| `forest_floor` | Suelos de bosque con hojas, barro y ramas secas |
| `concrete_moss` | Edificio abandonado, suelos/concreto verde |
| `metasequoia_bark` | Troncos y estructuras vegetales |
| `mossy_rock` | Piedra con musgo y líquenes |
| `brick_moss_001` | Pared de ladrillo viejo y humedades |

Cada material proviene de Poly Haven CC0 y se importa a WebP 1K con color, normal GL y ARM, si las tres URLs pasan validación.

## Verificación y criterios premium

1. **Validado en este lote:** GLB y PBR figuran en `public/viralio-3d/index.json` y `public/viralio-3d/materials/index.json`, y si la compilación termina bien.
2. El humanoide base **conservó 1 skin** tras optimización y **0 clips**; no confundir rig con personaje animado.
3. Revisar visualmente **el alfa de los helechos y plantas**; sin alfa correcto parecen cartones opacos. Una validación sintáctica de GLB no demuestra calidad de hojas.
4. Medir FPS y memoria de un móvil real antes de colocar varios animales o plantas simultáneamente.
5. Las dos estatuas y maniquíes son **utilería inerte**, no personajes con IA.
6. No se adquirieron licencias comerciales de pago. No atribuir estos modelos a franquicias, personajes protegidos, películas o videojuegos.

## Pendiente: fantasmas/monstruos de calidad AAA

No se encontró en esta selección un monstruo humanoide **animado**, hiperrealista y verificablemente libre para redistribución dentro del juego. Se deja pendiente, sin reemplazarlo con figuras de baja calidad ni fingir que ya existe. La opción profesional será elegir un modelo humanoide riggeado de procedencia clara, vestuario/rostro/hair premium y motions con licencia, más QA en teléfono.

## Accesos

- [Poly Haven — CC0](https://polyhaven.com/license)
- [Innerscene — biblioteca CC0](https://www.innerscene.com/tools/library)
- [Catálogo de esta tanda](../data/viralio-3d/nature-investigation-core.json)
- [Importación de naturaleza](../scripts/build-polyhaven-nature.mjs)
