# Viralio Escape — Biblioteca Premium de Investigación Criminal (homicidio)

**Fecha:** 15 de octubre de 2026. **Alcance solicitado:** buscar, seleccionar, descargar, optimizar y documentar recursos 3D. **NO** construir juegos, niveles, rompecabezas, escenas ni alterar rutas.

## Actualización técnica

Biblioteca anterior: **256 modelos GLB y 42 materiales PBR**. Nueva tanda: **29 GLB CC0 nuevos y 2 materiales PBR** elegidos de fuentes concretas, evitando **3 descargas duplicadas**. **El inventario final real se determina en** `public/viralio-3d/index.json` y `public/viralio-3d/materials/index.json` **después** de concluir GitHub Actions; no basarse solo en `catalog.json`.

Todos los nuevos GLB están en `data/viralio-3d/catalog.json`; sus páginas originales se guardan en cada `sourcePage`. Licencia fuente: [Innerscene CC0](https://www.innerscene.com/tools/library), con modelos originales y otros adaptados de [Poly Haven CC0](https://polyhaven.com/license) / MakeHuman CC0.

## Subpacks de selección

El archivo **`data/viralio-3d/crime-investigation-core.json`** ofrece siete listas reutilizables de identificadores, combinando modelos existentes y nuevos.

### 1. Escena del crimen

- `crime-barrier-tape`: **cinta de delimitación genérica sobre postes**; no presenta necesariamente texto POLICÍA.
- `crime-clipboard`: portapapeles con hojas en blanco.
- `crime-photo-frame`: portarretrato con vidrio; contenido de la fotografía aún debe crearse.
- `crime-vintage-camera`: cámara de fotos analógica fotorrealista, procedente de Poly Haven (hero).
- `crime-police-officer-static`: policía estático con vestimenta no licenciada de autoridad específica.
- Reutilizables existentes: `cctv-security-camera`, `premium-ph-magnifier`, `investigation-open-notebook`, `premium-ph-telephone-clock`.

**Pendientes auténticos:** evidencia numerada, guantes de látex, bolsas transparentes de muestras, fichas de huellas y señales específicas, impresiones o fotografías editables. No declarar que existen como GLB si no están.

### 2. Oficina de detectives

- `crime-detective-partner-desk`: escritorio de roble de dos pedestales (39K tri, PBR).
- `crime-office-chair`: silla de oficina ergonómica 51K tri, PBR.
- `crime-voice-recorder`, `crime-field-recorder`, `crime-reel-tape-recorder`: tres tipos de grabadora realistas, sin audio incorporado.
- `crime-filing-cabinet-lateral`, `index-42-mobile-filing-cabinet`: archivadores distintos.
- `crime-banker-lamp`, `crime-paper-trays`, `crime-ink-printer`, `crime-office-printer-stand`: utilería ambiental de oficina.

### 3. Sala de interrogatorio

- Mesas de oficina metálicas ya existentes, `crime-office-chair` y `school-chair`.
- `crime-field-recorder`, `crime-voice-recorder`, `crime-clipboard`.
- `ceiling-dome-security-camera`, `workshop-industrial-steel-door`, `crime-gooseneck-lamp`.
- **Espejo unidireccional:** todavía no hay componente con material de óptica probado. Un espejo decorativo no asegura el comportamiento de vidrio de observación.

### 4. Forense / laboratorio / medicina legal

- `crime-lab-researcher-static`: investigador de laboratorio con bata blanca, **figura estática MakeHuman de 21.6MB en origen**; requiere revisión visual.
- `crime-examination-table`: camilla de examinación acolchada, **NO** mesa de autopsias.
- `crime-patient-bedside`, `crime-label-printer`, `crime-iv-pole`, `crime-manual-wheelchair`, `crime-gloves-sign`.
- Reutilizables: `patient-transport-stretcher`, `mobile-examination-light`, `three-shelf-medical-supply-cart`, `vital-signs-monitor-on-roll-stand`.
- **No** representar equipo médico como sistema forense real operable. Es utilería visual.

### 5. Vivienda, motel u oficina de la víctima

- `crime-hotel-desk-chair` y `crime-photo-frame`.
- Recursos de `Universal Core`: `universal-ph-leather-sofa`, `universal-fridge-premium`, `universal-ph-red-apple`, `universal-ph-wooden-table`, `universal-ph-painted-cabinet` y `universal-ph-wooden-bowl`.
- Cuaderno y papeles neutros para generar narrativa, solo si algún día desarrollamos un caso concreto.

### 6. Sospechosos y testigos

- `crime-police-officer-static`, `crime-lab-researcher-static`, `premium-guard-drew`, `premium-worker-clipboard-taylor` y civiles existentes.
- Las figuras nuevas con uniforme son **mallas estáticas** con ropa/texturas embebidas, no NPCs animados ni actuaciones faciales. Los humanoides `npc-harper-locomotion` y `npc-jordan-locomotion` sí disponen de clips corporales básicos, pero tampoco son actores cinematográficos.

### 7. Exterior, estacionamiento y depósito

- `crime-police-suv` y `crime-police-sedan`: vehículos de patrulla con **decoración genérica**, sin logos de policía argentina.
- `crime-barrier-tape`, cámara CCTV y puertas metálicas existentes, herramientas de Poly Haven.
- Materiales nuevos `dirty_concrete`, `rusty_metal` CC0, convertidos de tres mapas Poly Haven 1K a WebP.
- Estos dos materiales se agregan al índice PBR compartido, no crean paredes o edificios por sí mismos.

## Calidad y límites

**Hero PBR/fotorrealista:** cámara vintage, escritorio de detective, lámpara industrial, silla ergonómica. Los modelos de Poly Haven tienen detalle para primeros planos, mientras que los modelos PBR originales de Innerscene necesitan auditoría visual con luces reales.

**Support:** vehículos, carteles, equipos médicos, lámparas, grabadoras, archivadores, papelería y otras piezas. No cargar una ambulancia o vehículo policial en un cuarto pequeño.

**Personajes:** dos nuevas figuras humanas **estáticas**; no declarar caminar/correr/interrogar o expresiones. Rig y locomoción seguirán siendo una tarea artística separada.

**Interacciones:** puertas de cajones, cámaras, grabadoras, frascos y lámparas son geometría; no tienen mecánicas ni audio automático. Una carpeta no incluye registros de víctimas ni expedientes prehechos.

## QA obligatorio tras materialización

1. Comprobar `public/viralio-3d/index.json` para 29 nuevos modelos efectivamente disponibles, no solo fichas.
2. Comprobar `public/viralio-3d/materials/index.json` para `dirty_concrete` y `rusty_metal`.
3. Confirmar que GitHub Actions terminó sin errores de descarga y validación GLB v2, SHA256 y presupuesto de tamaño.
4. Revisar render de personajes, transparencias y shaders metálicos; medir memoria y FPS en Android antes de usar simultáneamente objetos de grandes dimensiones.
5. Mantener las siete colecciones como **listas opcionales de selección**, sin construir juegos a partir de ellas.

**Costo de licencias:** US$0. No se realizaron compras.

