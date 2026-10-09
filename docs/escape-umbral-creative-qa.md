# UMBRAL — Auditoría maestra, dirección creativa y criterio de lanzamiento

**Fecha:** 9 de octubre de 2026  
**Destino solicitado:** https://viralio.net/escape  
**Estado:** implementación en rama; **no publicado en dominio principal**.

## 1. Alcance y aislamiento

- Proyecto Next.js 16 de `ProtectorRudo/viralio`, desplegado en Vercel.
- Viralio y Te Hice Esto comparten proyecto y dominios; la ruta `/escape` restringe el host de Te Hice Esto.
- Se añadió un juego original aislado en `src/app/escape/`. No se alteraron páginas comerciales ni sus pagos.
- No usar personajes ni marcas protegidas de franquicias comerciales sin licencia.

## 2. Experiencia implementada

**Título:** UMBRAL — La casa que recuerda.  
**Género:** misterio/terror atmosférico con acertijos.  
**Modo:** individual, 25 minutos (Historia) o 12 minutos (Pesadilla), cuatro habitaciones, dos finales, puntuación, ocho pistas coleccionables y récord personal local.

1. **El vestíbulo.** Reloj detenido, tres retratos y cerradura numérica. El jugador deduce el orden cronológico.
2. **El despacho.** Nota escondida, velas simbólicas y pasadizo detrás de la biblioteca.
3. **La habitación de Eva.** Carta, melodía de cuatro notas, caja musical y medalla opcional.
4. **El corazón de la casa.** Fusibles, restauración de energía y decisión final entre escapar o regresar por Eva.

Componentes desarrollados: escenas SVG originales con estado reactivo de velas, pasadizo, caja musical y fusibles; iluminación nocturna, linterna interactiva, niebla y tormenta, apariciones discretas, vibración móvil compatible, audio procedural con controles, transición de puertas, exploración táctil y teclado físico numerado, artefactos individuales, expediente de pistas en panel de corcho, pistas progresivas, temporizador de reloj real sin deriva, dos dificultades, pausa, persistencia local, récord personal y finales alternativos.

## 3. Pruebas confirmadas

- `Escape Room QA`: **5 de 5 pruebas de navegador aprobadas** en la ejecución [37982422885](https://github.com/ProtectorRudo/viralio/actions/runs/37982422885), más las anteriores.
- La configuración exclusiva `e2e/escape.playwright.config.ts` compila Next, revisa lint solo de UMBRAL y prueba Chromium real.
- Se verificó la progresión completa, decisión de rescatar a Eva, puntuación y récord, error y entrada táctil de PIN, reacción visible de velas y fusibles, expediente de evidencias, linterna, modo Pesadilla, navegación táctil, pausa, sincronización de reloj real y recuperación de la partida.
- Las ejecuciones exportaron once capturas reales (escritorio y 390px móvil) en el artefacto `umbral-visual-qa`, con animaciones pausadas para revisar la composición final.
- Se detectó y corrigió la desalineación de botones en panorama móvil, recalculando coordenadas de SVG recortado; también se eliminó el solapamiento del pie de página.

## 4. Hallazgos visuales y brecha de excelencia

**Lo logrado:** identidad tipográfica e interfaz noir coherentes, escenas ligeras y originales, objetivos claros, objetos activables con feedback, una base técnica modular que corre en navegador sin instalaciones.

**Lo insuficiente para el objetivo “nivel gloria”:** el arte actual es **vectorial/ilustrado**, no un escenario fotorrealista cinematográfico. Los interiores necesitan assets específicos de alta dirección artística, materiales, profundidad, textura, iluminación narrativa, diseño sonoro profesional y mayor riqueza de manipulación física. La imagen conceptual generada en el chat es una referencia estética; **no es un archivo desplegado en el sitio**.

**No afirmar todavía:** pruebas de rendimiento certificadas en Safari/Android de gama baja, validación multijugador, retención/adictividad observada en jugadores reales, métricas servidor, tabla pública antitrampa, versiones premium, landing comercial final, accesibilidad auditada por especialistas.

## 5. Gate de lanzamiento (no omitir)

- [x] Juego funcional con cuatro habitaciones, cronómetro y finales.
- [x] Cinco pruebas Playwright: historia completa, móvil, error de PIN, cronómetro y modo Pesadilla.
- [x] Compilación de Next y lint aislado de todos los componentes de la ruta.
- [x] Capturas de escritorio y móvil; defectos móviles principales corregidos.
- [ ] Dirección artística final con escenarios de mayor fidelidad, consistente en las cuatro habitaciones.
- [ ] Pruebas de 320, 360, 390, 768, 1280 y 1440 px más Safari iOS y Android real.
- [ ] Pruebas manuales de todos los estados, pistas, fallos, accesibilidad y audio opcional.
- [ ] Prueba con jugadores externos: registrar dificultad, tiempo real, confusiones y porcentaje de finalización.
- [ ] Verificar que `/`, `/q/*`, `/tehiceesto` y los cobros existentes no cambian.
- [ ] Vista previa pública autorizada y comparación visual antes/después.
- [ ] Publicar solo versión aprobada y verificar `https://viralio.net/escape` realmente disponible.

## 6. Estado del despliegue

- Vercel registró un preview `READY` para commit `7a4b084`; es **anterior** a las mejoras finales de linterna y móvil.
- Operaciones de publicación y bypass de vista previa devuelven **403 — equipo/proyecto no autorizado**.
- El estado de GitHub para Vercel señala **`build-rate-limit`** en commits nuevos, por lo que no hay desplegado verificable del último commit.
- **No fusionar** el PR ni redirigir el tráfico actual hasta que los permisos de Vercel, el cupo y la revisión artística estén resueltos.

## 7. Evolución prevista

- Reemplazar arte provisional por escenas originales de alta fidelidad, manteniendo posiciones exactas de objetos y controles.
- Convertir cada inspección en una microinteracción física (girado, abrir cajones, deslizar, raspar, enfocar linterna).
- Crear un director narrativo para sustos medidos por progreso, no aleatorios repetitivos.
- Diseñar un tema musical dinámico, voces puntuales y sonido espacial con versión silenciosa equivalente.
- Instrumentar sesiones y embudo de finalización con privacidad y consentimiento; solo después evaluar tabla de tiempos y multijugador.

> **Regla del proyecto:** una versión que compila y pasa E2E es una **base jugable**, no la experiencia gloriosa final. No declarar publicada ninguna versión sin inspección en el dominio solicitado.
