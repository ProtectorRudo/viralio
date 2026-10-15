# Viralio Escape — Biblioteca Premium de Investigación Criminal (homicidio)

**Fecha:** 15 de octubre de 2026. **Alcance solicitado:** buscar, seleccionar, descargar, optimizar y documentar recursos 3D. **NO** construir juegos, niveles, rompecabezas, escenas ni alterar rutas.

## Actualización técnica

Biblioteca anterior: **256 modelos GLB y 42 materiales PBR**. Nueva tanda: **29 GLB CC0 nuevos y 2 materiales PBR** elegidos de fuentes concretas, evitando **3 descargas duplicadas**. **Validación de importación completada:** 29/29 GLB nuevos y 2/2 materiales PBR se encuentran en índices físicos, sin errores. Estado actual **285 GLB y 44 materiales PBR**. **El inventario final real se determina en** `public/viralio-3d/index.json` y `public/viralio-3d/materials/index.json` **después** de concluir GitHub Actions; no basarse solo en `catalog.json`.

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


## Resultado verificado

En el workflow final, los 251 modelos Innerscene del catálogo fueron descargados y validados sin fallos; más los 34 modelos de Poly Haven de bibliotecas complementarias dan **285 GLB reales**. 44 superficies PBR. Nuevos materiales `dirty_concrete` y `rusty_metal` disponibles con mapas color/normal/ARM. Los 29 `crime-*` nuevos están en `public/viralio-3d/index.json` y los 7 packs de selección en `data/viralio-3d/crime-investigation-core.json`. **No se han publicado escenas jugables.**

## Segunda ampliación: 17 utilerías de apoyo CC0 (15/10/2026)

Se agregaron **17 fuentes GLB sin duplicaciones** a `data/viralio-3d/catalog.json` para materialización mediante GitHub Actions. **Estado inicial: curadas, sin declarar descargadas hasta comprobar el índice publicado.** El catálogo pasa de 251 a 268 modelos Innerscene (más 34 GLB adicionales de bibliotecas Poly Haven externas, previamente verificados). El objetivo verificado, si no hay fallos, sería **302 GLB**.

### Recursos incorporados al catálogo

| ID | Uso correcto | Fuente |
| --- | --- | --- |
| `investigation-sealed-storage-pouch` | bolsa sellable doméstica para utilería; **no** bolsa pericial certificada | Innerscene |
| `investigation-desktop-file-sorter` | clasificación de expedientes | Innerscene |
| `investigation-lidded-storage-tote` | contenedor de almacenamiento | Innerscene |
| `investigation-network-archive` | servidor NAS de seguridad y análisis digital | Innerscene |
| `investigation-parts-drawer-cabinet` | gabinete para piezas/útiles pequeños | Innerscene |
| `investigation-file-holder` | soporte de expedientes | Innerscene |
| `investigation-glass-magnifier` | lupa con cristal y madera | Innerscene |
| `investigation-incident-report-sign` | señal de protocolo de incidentes | Innerscene |
| `investigation-visitor-signin-sign` | señal de registro de visitantes | Innerscene |
| `investigation-industrial-security-light` | reflector de seguridad PBR escaneado (hero) | Poly Haven vía Innerscene |
| `investigation-printmaking-glass-table` | mesa de trabajo de vidrio (no mesa de autopsias) | Innerscene |
| `investigation-coffee-cart-ph` | carro de ambiente fotoescaneado PBR (hero) | Poly Haven vía Innerscene |
| `investigation-document-scanner` | escáner de hojas para análisis documental | Innerscene |
| `investigation-pocket-journal` | objeto personal/diario de bolsillo | Innerscene |
| `investigation-trigger-spray-bottle` | aerosol de utilería genérica, **sin** químicos reales | Innerscene |
| `investigation-wire-wastebasket` | cesto de papel metálico | Innerscene |
| `investigation-parcel-locker` | casillero de paquetería | Innerscene |

Cada recurso tiene una ficha `sourcePage` CC0, autor, URL de descarga e identificador único en el catálogo. Licencia general: [Innerscene CC0](https://www.innerscene.com/tools/library/terms); 2 modelos proceden del repositorio [Poly Haven CC0](https://polyhaven.com/license). No se adquirieron licencias ni se modificaron juegos.

Tres selecciones opcionales se suman a `crime-investigation-core.json`: recepción y archivo de indicios, accesos vigilados y análisis digital. **Son listas de recursos, no niveles o escenas.** Los personajes animados cinematográficos, marcadores numerados y bolsas verdaderas de evidencia siguen pendientes.

### Verificación física

- Revisar `public/viralio-3d/index.json` y los `investigation-*.glb` tras completar el workflow.
- Diferenciar alta en catálogo (`curated-source`) de materialización real y optimización.
- Verificar específicamente transparencia del pouch, luminaria y polígonos de muebles en navegador Android.
- Mantener objetivos móviles y no introducir estos 17 GLB juntos en una misma escena.
