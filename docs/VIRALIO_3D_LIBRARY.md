# Viralio Escape — biblioteca de recursos 3D fotorrealistas

**Estado:** catálogo de fuentes y proceso de selección, **NO** colección de GLB ya descargados.
**Actualización:** 2026-10-15.
**Objetivo:** maximizar calidad visual y reutilización entre salas de escape 3D de navegador (Next.js + Three.js), priorizando recursos gratuitos aptos para explotación comercial.

## Regla central para cualquier agente de desarrollo

Antes de crear desde cero una pared, puerta, mueble, accesorio, personaje o una escena entera:

1. Comprobar si ya existe un recurso apto y con procedencia documentada en el proyecto; consultar `docs/aislamiento15-asset-licenses.md` y buscar modelos GLB existentes.
2. Buscar en las fuentes confiables **de esta biblioteca** recursos de mayor calidad y reutilizables.
3. Comparar la calidad real del archivo, no solo la imagen promocional: geometría, materiales PBR, UVs, escala, partes móviles, animaciones y calidad en un dispositivo real.
4. Verificar permiso de uso comercial **por recurso**, atribución, restricciones de redistribución y compatibilidad con nuestra distribución web; registrar la licencia.
5. Descargar únicamente mediante medios autorizados por el proveedor; convertir y optimizar una **copia local** para producción. No depender de URLs remotas de terceros en el runtime.
6. Integrar los modelos con hitboxes e interacción funcional, audio, iluminación adecuada y narrativa. Un GLB estático NO sustituye mecánicas de escape.
7. Medir FPS y tiempos de carga en móvil; comprobar legibilidad de los acertijos.
8. Reutilizar con cambios de materiales, iluminación, distribución, props narrativos y comportamiento. **Evitar salas clonadas.**

**Criterio visual:** fotorrealismo coherente y móvil fluido. No priorizar la cantidad de modelos sobre el resultado. No añadir modelos low-poly/cartoon al primer plano de una experiencia realista salvo decisión artística.

## Bibliotecas y política de selección

| Prioridad | Fuente | Para qué | Licencia / precaución |
| --- | --- | --- | --- |
| A | [Poly Haven — modelos](https://polyhaven.com/models) | Muebles, utilería, objetos fotografiados | **CC0**. Alta prioridad por calidad. [Licencia oficial](https://polyhaven.com/license). |
| A | [Poly Haven — texturas](https://polyhaven.com/textures) | Paredes, pisos, metales, madera, desgaste PBR | **CC0**. Preferir mapas adecuados a motor de tiempo real. |
| A | [Poly Haven — HDRI](https://polyhaven.com/hdris) | Reflexiones/iluminación ambiental | **CC0**. Optimizar tamaños. |
| A | [ambientCG](https://ambientcg.com/list) | Texturas PBR, hormigón, ladrillo, madera, industrial | Fuente CC0; verificar ficha/licencia si el sitio cambia. |
| A | [cgbookcase](https://www.cgbookcase.com/textures) | Materiales PBR para suelos y paredes | **CC0**, ver licencia en el catálogo. |
| A | [Innerscene — biblioteca 3D](https://www.innerscene.com/tools/library) | Props, equipos, componentes, GLB y objetos interactivos | Catálogo **CC0**; el proyecto ya utiliza recursos de aquí en Aislamiento 15. Registrar URL exacta y permisos de cada modelo. |
| B | [Blendkit — catálogo de modelos](https://www.blendkit.com/) | Amplia selección de muebles, escenas e interiores | Gratis y pago mezclados. Recurso concreto puede tener **Royalty Free** o **CC0**; revisar la licencia. [Condiciones](https://www.blendkit.com/docs/licenses/). No asumir CC0 por ser gratuito. |
| B | [Sketchfab — descargables](https://sketchfab.com/search?features=downloadable&type=models) | Candados, fusibles, escenografía, props específicos | Revisar licencia de **cada** modelo: CC BY puede requerir crédito; evitar NC para comercial y licencias incompatibles. No automatizar descargas saltándose autenticación. [Guía de atribución](https://sketchfab.com/developers/download-api/guidelines). |
| B | [Fab](https://www.fab.com/) | Kits modulares de interiores y escenas | Filtrar gratuitos y analizar licencia, archivos disponibles y compatibilidad (recursos solo Unreal suelen requerir trabajo adicional). |
| C | [Quaternius](https://quaternius.com/) | Arquitectura/props rápidos y prototipos | **QAL v1.0** (licencia propia actualizada 28/08/2026): uso comercial gratuito, pero no redistribución de assets de forma independiente; estética normalmente estilizada. [Términos](https://quaternius.com/license.html). |
| C | [Kenney](https://kenney.nl/assets) | Prototipos y decoración secundaria | **CC0**, pero muchos packs no son fotorrealistas. |
| Especial | [Mixamo](https://www.mixamo.com/) | Animaciones de personajes compatibles | Revisar permisos del servicio y rig antes de integración. |

**No confundir:** un catálogo gratuito no garantiza una ficha gratuita, ni un modelo caro garantiza mejor calidad en móviles.

## Ejemplos concretos ya identificados

- [Poly Haven — Metal Office Desk](https://polyhaven.com/a/metal_office_desk): oficina, interrogatorios, laboratorio, expedientes. CC0 por licencia global de Poly Haven.
- [Poly Haven — Television 01](https://polyhaven.com/a/Television_01): pistas de vídeo, apariciones, pantallas antiguas. CC0 por licencia global de Poly Haven.
- [Innerscene — Project Box projector](https://www.innerscene.com/tools/library/3d-parts/project-box-projector-6d147ec3): proyector de utilería para cine o investigación; ficha CC0; GLB.
- [Innerscene — Open Notes](https://www.innerscene.com/tools/library/3d-parts/open-notes-stationery-b40f246f): cuaderno/pistas; ficha CC0; GLB.
- [Innerscene — Campaign Chest](https://www.innerscene.com/tools/library/3d-parts/voyage-campaign-chest-1d609eb1): cofre con pistas/cerraduras; ficha CC0; GLB.
- [Innerscene — All-in-One Computer](https://www.innerscene.com/tools/library/3d-parts/screen-one-all-in-one-computer-6bc2e4e0): terminal de claves, mensajes, archivos; ficha CC0; GLB.
- [Innerscene — Free Parts Library](https://www.innerscene.com/tools/library): buscar términos como hospital bed, monitor, locker, door, cabinet, switch, desk, books, chair.

**Referencia interna:** `docs/aislamiento15-asset-licenses.md` documenta **ocho recursos médicos CC0** que ya alimentan una escena, modelo de personaje y optimización. Preservar y ampliar ese flujo; no duplicar la descarga si ya existe una copia o pipeline confiable.

Estos ejemplos son **candidatos o referencias**, no promesa de que ya están incluidos en todas las salas.

## Qué buscar por categoría

1. **Arquitectura modular:** pared recta/esquina, techo, piso, marcos, puertas, ventanas, escalera, columnas, pasillo, rejas, zócalos; alta reutilización.
2. **Props universales:** escritorio, mesa, silla, armario, estante, cajonera, lámpara, caja, cuadro, reloj, computadora; alta reutilización.
3. **Objetos interactivos:** cerraduras, cajones con mallas separadas, candados, fusibles, interruptores, pantallas, teclados, botones, terminales, cajas fuertes, llaves; prioridad a elementos que el jugador toca.
4. **Ambientación:** óxido, suciedad, humedad, pinturas gastadas, vidrio roto, polvo, manchas, decals; usar materiales reutilizables.
5. **Escenas completas:** usar como inspiración o desarmar en módulos; verificar licencia, formatos, acceso a mallas y coste de render.
6. **Personajes:** modelos con rig y animaciones, estética coherente, sin apariencias genéricas repetidas; validar movimientos, sombras y escala.

## Reutilización sin repetición visible

Mantener una base de geometría compartida con variantes temáticas:
- Cine: paneles oscuros + butacas + proyector + luz cálida envejecida.
- Hospital: mismas dimensiones estructurales + materiales clínicos + equipamiento + luz fría.
- Casa: paredes pintadas + muebles domésticos + ventanas + luz natural.
- Búnker/laboratorio: hormigón + acero + consolas + luz de emergencia.

**No** limitarse a recolorear. Variar silueta de la sala, recorrido, ubicación de pistas, acústica, ritmo narrativo y comportamiento de personajes.

## Integración técnica para este repositorio

- Stack observado en `package.json`: Next.js 16, React 19 y `three` 0.180.0.
- Formato preferido en runtime: **GLB/glTF**. FBX/OBJ/BLEND requieren conversión y evaluación de materiales.
- Al adaptar: unificar escala, orientar pivotes y ejes, preservar UVs, separar componentes interactivos, generar colisionadores simples, cuidar z-fighting y transparencia.
- Optimizar con redimensionamiento de texturas según importancia, compresión y eliminación de nodos/materiales innecesarios; usar instancias donde convenga. Aplicar Draco/Meshopt/KTX2 solo si el loader está configurado y probado.
- Las texturas y luces procedurales de Blender/Cycles **no** se trasladan idénticas a Three.js: convertir u hornear cuando corresponda.
- Emplear lazy loading, precarga de pistas claves y alternativas visuales si el archivo falla.
- Probar dispositivos Android de gama media. Como objetivo inicial, aspirar a **30 FPS sostenidos** y medir presupuesto de red/memoria por escena; son metas de QA, no garantías.
- Comprobar integración real con `npm run build`, `npm run typecheck` y pruebas aplicables. No introducir cambios destructivos en escenas existentes por instalar la biblioteca.

### Registro obligatorio de procedencia para cada recurso incorporado

Mantener junto a cada implementación o en `docs/*-asset-licenses.md` una ficha:

```yaml
asset_id: identificador-unico
title: Nombre del modelo
source_url: https://...
author: Autor verificado
license: CC0 | CC BY 4.0 | Royalty Free | QAL 1.0 | otra
license_url: https://...
download_date: YYYY-MM-DD
original_format: GLB
optimized_path: ruta-en-el-repositorio-o-pipeline
attribution_required: true/false
attribution_text: texto si corresponde
games_using_it:
  - slug-del-juego
optimization_notes: reducir texturas, geometría, compresión...
status: candidate | licensed | downloaded | optimized | integrated | tested_mobile
```

**No etiquetar** un asset como integrado sin verificar su archivo, su licencia, su render y su ubicación efectiva en el juego.

## Flujo recomendado cuando se pide mejorar una sala

1. Auditar capturas actuales y listar los 5 elementos que más se ven artificiales.
2. Buscar alternativas en esta biblioteca **antes** de modelar manualmente o pagar.
3. Priorizar 1) elementos de primer plano, 2) objetos manipulables, 3) paredes/materiales, 4) escenas secundarias, 5) personajes.
4. Verificar licencia y exportación; escoger un asset compatible.
5. Descargar, convertir y optimizar de forma reproducible (con controles de tamaño y fallback).
6. Integrar interacción y colisiones; revisar iluminación y dirección artística.
7. Comparar antes/después en móvil, FPS, peso de carga y legibilidad de pistas.
8. Documentar procedencia y reutilización. Si no mejora lo anterior, no añadirlo.

## Seguridad y costos

- **Objetivo de gasto en assets:** US$0 por defecto. Comprar solo cuando esté justificado por un resultado concreto y con autorización.
- No automatizar scraping ni descargar saltándose cuentas/paywalls/TOS. Usar descargas públicas permitidas o integraciones oficiales.
- No asumir permisos de una imagen de vista previa promocional; los materiales del catálogo y el render promocional pueden tener licencias distintas.
- El navegador expone recursos descargados: consultar restricciones de distribución y atribución, especialmente en licencias distintas de CC0.
- Cada recurso nuevo es una dependencia artística y de rendimiento; preferir una biblioteca limitada, mantenible y con identidad visual.

## Cómo usar el documento en otras conversaciones o agentes

> Antes de diseñar o mejorar cualquier sala de Viralio Escape, lee `docs/VIRALIO_3D_LIBRARY.md` y el documento de licencias de la sala. Busca modelos y materiales gratuitos de alta calidad en las fuentes recomendadas, valida licencia y compatibilidad móvil, integra solo lo que mejore la experiencia, y documenta la procedencia del recurso.
