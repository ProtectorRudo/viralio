# Viralio 3D — ampliación PREMIUM de objetos de fútbol (15/10/2026)

**Alcance:** SOLO BIBLIOTECA. No se crea ni se modifica ningún juego, acertijo, ruta ni escena. El usuario elegirá después qué modelos integrar.

## Recuento comprobable

- Biblioteca general: verificar `public/viralio-3d/index.json`; 157 modelos antes de esta tanda, +12 GLB de Innerscene procesados y validados en GitHub Actions = 169 modelos. El segundo proceso añadió 2 balones Poly Haven = **171 modelos GLB verificados**, 26 sets PBR.
- Fotogrametría exclusiva de fútbol: `data/viralio-3d/polyhaven-football-models.json` registra **dos balones CC0**. La descarga desde Poly Haven, la conversión y la optimización las realiza `scripts/build-football-polyhaven.mjs`. **Ambos quedaron verificados (sin fallos, cada uno de ~624 KB) en el índice materializado y en el reporte** `data/viralio-3d/polyhaven-football-report.json`. El catálogo de Innerscene no incluye automáticamente estos dos modelos.
- 26 sets de materiales PBR base ya disponibles; no se alteran.
- Todos los nuevos modelos de Innerscene están bajo CC0; no usar las fotografías promocionales como sustituto de los GLB.
- Marcadores y tribunas de Innerscene tienen texturas PBR, pero su detalle y realismo **no son equivalentes a un estadio fotográfico profesional**. Reservar elementos complejos para revisiones visuales.

## Recursos deportivos adicionales MATERIALIZADOS (tras comprobar índice)

| ID | Objeto | Uso previsto | Calidad / límites |
| --- | --- | --- | --- |
| `football-duffel-bag` | Bolso grande de lona | Vestuario, staff | PBR original; sin marca |
| `football-backpack` | Mochila con correas | Vestuario | PBR original; sin logos |
| `football-toiletry-kit` | Neceser y cierre | Vestuario | PBR original; utilería |
| `football-mudroom-bench` | Banco con compartimientos y acolchado | Vestuario | PBR, estética doméstica a adaptar |
| `football-tilted-shoe-rack` | Zapatero de madera y metal | Vestuario | NO incluye botines |
| `football-changing-bench` | Banco de espera | Vestuario | Originalmente mobiliario de dormitorio |
| `football-hardcase-suitcase` | Valija rígida con ruedas | Cuerpo técnico | PBR, sin identidad de club |
| `football-foam-roller` | Rodillo de recuperación | Kinesiología deportiva | PBR técnico |
| `football-outdoor-picnic-table` | Mesa exterior fotoescaneada Poly Haven | Predio de entrenamiento | CC0; detallar en primer plano |
| `football-coach-tablet-figure` | Persona revisando una tablet | Videoanálisis | Estática SIN rig ni animación |
| `football-celebrating-spectator-static` | Persona celebrando | Ambiente del estadio | Estática, ropa de calle |
| `football-raised-ball-figure-static` | Persona levantando pelota | Ambiente deportivo | Estática, NO jugador profesional |

## Dos recursos HÉROE fotoescaneados de Poly Haven

1. [Dirty Football — Rohit Seervi](https://polyhaven.com/a/dirty_football): pelota de fútbol gastada, CC0, referencia de alta calidad con costuras, suciedad y cuero. El archivo original tiene versiones de muy alta resolución que no deben enviarse sin conversión al teléfono.
2. [Football — Amal Kumar](https://polyhaven.com/a/football): pelota vintage con aspecto gastado y parcialmente desinflada, CC0.

El script utiliza el endpoint público oficial `https://api.polyhaven.com/files/{id}` y sus dependencias, toma la variante glTF de **1K**, y genera una copia **GLB autoconclusiva** mediante glTF-Transform; valida la cabecera, mallas, integridad, tamaño y SHA-256 antes de registrarla. Ambos generaron GLB válidos, compresión y hashes; las futuras reproducciones del pipeline deben confirmar el mismo resultado.

## Lo que faltó conseguir en CC0 premium

Para no rebajar la calidad o incumplir licencias, **no se agregaron automáticamente**:
- Botines profesionales 3D fotogramétricos individuales (los anteriores son zapateros sin botines).
- Camisetas colgadas de fútbol fotorrealistas, con UV editable y sin marcas.
- Trofeos de FIFA, CONMEBOL o copas oficiales: hay modelos en Sketchfab bajo CC BY, pero reproducen diseños de terceros; requieren revisión de derechos.
- Estadio entero, interior y exterior, escaneado en calidad AAA y optimizado a WebGL móvil.
- Jugadores animados vestidos con equipación de fútbol premium. Los humanos CC0 con camisetas/shorts encontrados eran **estáticos**.

### Fuentes para revisión manual posterior — no incorporadas ni descargadas

- [Trofeo genérico, Sketchfab, CC BY](https://sketchfab.com/3d-models/trophy-b2c21f7c7c0c46f28b98967dd55a8865) — puede servir para inventar una copa original tras validar autoría/atribución y formato.
- [Copa Libertadores, Sketchfab, CC BY](https://sketchfab.com/3d-models/copa-libertadores-c16ee94f64f94df497ddb073b8c1bafa) — **referencia artística solamente**; no integrar trofeo oficial sin comprobar permisos de marca/diseño.
- [Free Soccer Pitch, Sketchfab, CC BY](https://sketchfab.com/3d-models/free-soccer-pitch-aec62086bbb54aabade1cb4c83bb4042) — escena con cientos de miles de triángulos; atribución + optimización y QA obligatorios.
- [Stadium HDRI de Poly Haven, CC0](https://polyhaven.com/a/stadium_01) — un HDRI no es un estadio 3D explorable.
- [Soccer Park HDRI de Poly Haven, CC0](https://polyhaven.com/a/suburban_soccer_park) — entorno iluminado real, no arquitectura.

## Selección editorial para primer plano

**Nivel A (fotoescaneo):** dos pelotas Poly Haven y mesa exterior fotogramétrica.

**Nivel B (PBR original):** bolsa deportiva, mochila, banco, zapatero, rodillo, candados, lockers, pizarras y monitores.

**Nivel C (referencia de composición):** jugadores estáticos y escenas low-poly. Nunca vender su calidad como equivalente a Unreal Engine.

**Instrucción a asistentes:** Consultar primero estos archivos y `public/viralio-3d/index.json`. Escoger por calidad percibida, licencia, escala, peso y animabilidad. No construir juegos ni cambiar rutas. No comprar assets sin autorización explícita.
