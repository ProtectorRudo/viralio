# Ampliación arquitectura / horror / muebles premium — Viralio Escape

**Fecha:** 2026-10-15. **Fuente:** fichas CC0 individuales de Innerscene y Poly Haven.

## Criterio de selección

- **Descarga permitida y procedencia** por modelo. La presencia en el catálogo no significa integración: el índice `public/viralio-3d/index.json` contiene SOLO binarios efectivamente verificados por el pipeline.
- **Hiperrealista no es sinónimo de muchos polígonos.** Los props de Poly Haven y las piezas fotogramétricas son candidatos de primer plano. Los modelos PBR de Innerscene son secundarios salvo verificación visual en la escena.
- **Monstruo alado:** la ficha describe una ESCULTURA/escaneo museístico de bronce, **no** un monstruo animado ni una criatura IA. **Esqueleto:** utilería anatómica estática. **Maniquí:** utilería estática. **Pacientes:** dos figuras en una escena, no afirmar clips incluidos.
- Para fantasmas animados creíbles: usar un humanoide con rig con dirección de arte, materiales específicos, transparencias selectivas, partículas, oclusión correcta, sonido 3D y animaciones probadas. **No simular que ya existe un espectro fotorrealista en el catálogo si no existe un archivo revisado.**
- El usuario indicó mantener US$0 en compra de assets por defecto.

## Selección por temática de sala (ids de `data/viralio-3d/catalog.json`)

| Sala | Entorno/props preferentes | Materiales |
|---|---|---|
| **Hospital / sanatorio** | `nurse-station-low-counter`, `patient-wheelchair-attendant`, `standing-mannequin`, `sharps-disposal-container`, `window-security-grille`, `full-adult-skeleton-standing` | `dirty_tiles`, `plastered_wall`, `concrete` |
| **Mansión / cripta** | `victorian-arched-mirror`, `gilt-landscape-picture-frame`, `victorian-tea-set`, `candle-arm-chandelier`, `kneeling-winged-monster`, `detailed-skull-with-articulated-jaw`, `wingback-armchair` | `old_wood_floor`, `old_wooden_floor_01`, `plastered_wall` |
| **Hotel / departamento** | `linea-textile-wardrobe`, `angle-corner-wardrobe`, `slit-bedside-cabinet`, `sliding-patio-door`, `casement-window`, `picture-fixed-window` | `wood_floor`, `old_wooden_floor_01`, `rough_plaster_03` |
| **Búnker / laboratorio** | `window-security-grille`, `awning-window`, `clerestory-window`, `jalousie-window`, `security-grille-gate`, `cctv-security-camera`, `access-control-keypad` | `rough_concrete`, `concrete_floor_worn_001`, `dirty_tiles` |
| **Cine / teatro embrujado** | `victorian-arched-mirror`, `gilt-landscape-picture-frame`, `standing-mannequin`, `candle-arm-chandelier`, `project-box-projector`, `bay-three-sided-window` | `old_wood_floor`, `plastered_wall` |

**Nota sobre puertas, ventanas y colisiones:** añadir GLB a una pared sólida NO abre un hueco. Los juegos deben modelar aperturas reales con piezas de marco o dividir mallas de pared, además de agregar colisiones, ejes/pivotes, sonidos y gestos de apertura. Evitar ventanas flotando sobre paredes completas.

## Materiales Poly Haven incorporados

- `plastered_wall`: yeso roto/envejecido
- `dirty_tiles`: baldosas manchadas
- `old_wood_floor`: tablas envejecidas
- `wood_floor_worn`: piso gastado
- `wood_floor`: madera limpia
- `old_wooden_floor_01`: madera barnizada antigua

Son **3 mapas por material** (color, normal OpenGL, ARM; total 18 mapas adicionales); transformación a WebP 1K. Se usan por `loadViralioPBR(id)`; no usar las texturas originales en tamaño 8K/16K directamente en móvil.

## Verificaciones requeridas

1. En la action de assets: `VIRALIO_3D` con cantidad prevista; `VIRALIO_PBR` con cantidad prevista, `errors:0`.
2. Confirmar que `public/viralio-3d/index.json` enumera los modelos; `materials/index.json` enumera los materiales; cada archivo aparece físicamente.
3. Inspeccionar los objetos héroe en `/biblioteca-3d` si la ruta está desplegada; revisar escala, superficies, transparencias, sombras.
4. Comprobar rendimiento en Android medio antes de insertar varios personajes simultáneos.
5. Hacer pruebas de juego y no tocar las rutas actuales sin una mejora específica visible.

## Documentación complementaria

- [Biblioteca técnica](VIRALIO_3D_OPERATIONAL_LIBRARY.md)
- [Plan premium y compra selectiva](VIRALIO_3D_PREMIUM_ROADMAP.md)
- [Poly Haven / CC0](https://polyhaven.com/license)
- [Innerscene / biblioteca CC0](https://www.innerscene.com/tools/library)
