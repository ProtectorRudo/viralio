# ¿Dónde estás, mamá? — experiencia especial de Viralio Escape

- **Ruta:** `/donde-estas-mama`
- **Tecnología:** Next.js 16 / React 19 / TypeScript / Three.js WebGL2, PBR locales, GLTFLoader, Web Audio API, ACESFilmToneMapping, controles táctiles/teclado.
- **Duración:** 300 segundos desde que el jugador confirma empezar; tiempo real también durante acertijos.
- **Etapa 1:** pasillo; inspeccionar caja escolar y recuperar llave del perchero; abrir puerta.
- **Etapa 2:** sala familiar; girar cuatro fragmentos de fotografía hasta orientación correcta, descubrir secuencia de colores, ordenar tres libros; abrir puerta.
- **Etapa 3:** dormitorio; conseguir tres engranajes en muebles y colocarlos por tamaño en caja musical; activar apertura del armario.
- **Resultado:** final emotivo y carta personal, o reinicio si se acaba el tiempo. No hay extensión de tiempo.
- **Momentos narrativos:** mensajes programados a 12, 50, 105, 170, 240 y 280 segundos desde inicio; apagones, sonidos con PannerNode, vibraciones si el navegador las soporta.
- **Personalización:** `?mama=Nombre&hijo=Nombre&mensaje=Texto` (codificación URL estándar). Los tres parámetros se muestran localmente y se limitan en longitud. No se guardan los datos.
- **Modelo de acceso:** acceso especial directo, sin prueba temporal promocionada ni sistema de pago agregado; no prometer precios.
- **Biblioteca:** usa `loadViralio3DAsset` y `loadViralioPBR`, consumiendo solo los modelos del escenario. Los modelos son registros CC0 ya publicados en `public/viralio-3d/index.json`; no se incorporaron archivos externos nuevos.
- **Límite actual:** los engranajes, indicadores, luces y señalización son mecanismos construidos con geometría nativa, no sustitutos de muebles. La escena se considera en desarrollo hasta pruebas completas reales en Android y iOS.
- **Pruebas manuales recomendadas:** abrir tres habitaciones, resolver secuencia de libros y caja musical, vencer antes de 300 s, validar modo fracaso, usar móvil vertical, probar manos izquierda y derecha, comprobar WebGL2, medir FPS, verificar assets sin intersecciones y sin objetos flotantes.

- **Editor para regalar:** `/donde-estas-mama/preparar` produce enlace firmado con parámetros URL; la persona que juega no ve el formulario.

## Auditoría técnica y artística — revisión posterior

- **Puesta en escena:** una silueta momentánea cruza el pasillo; el marco cae, los muebles cambian de posición y aparece un aviso rojo sobre la pared. Las luces parpadean en momentos sincronizados con el reloj.
- **Geometría y colisiones:** los límites de cada habitación y los radios de mobiliario impiden atravesar paredes, mesas y armarios. Se normaliza el desplazamiento diagonal y se reutiliza la instancia de `Raycaster`.
- **Streaming:** los modelos GLB se solicitan por etapa, con precarga del siguiente ambiente, conservando los assets CC0 existentes. No se agrega CDN externo.
- **Final:** al resolver la caja musical, el cronómetro deja de correr, el armario se desplaza durante la secuencia cinematográfica y aparecen en el mundo 3D globos, una torta, una vela y un cartel original. La carta se muestra después de 3,6 segundos.
- **Fotografía:** la imagen original `public/donde-estas-mama/foto-familiar.svg` se divide en cuatro cuadrantes giratorios para el rompecabezas, sin licencia de terceros.
- **Tests automáticos:** `tests/mother-escape-rules.test.ts` cubre orientación de las piezas, bloqueo de secuencias, contador y despachos únicos de eventos. `e2e/viralio-escape-home.spec.ts` incluye la ficha, la pantalla de regalo y un smoke test de WebGL2/cronómetro/controles móviles.
- **Limitación artística explícita:** la celebración representa la sorpresa con escenografía y texto; aún no hay un actor infantil 3D con rig y animación ni grabación infantil auténtica. No usar modelos adultos reducidos de tamaño como sustitutos.
- **Calidad pendiente de verificación:** recorrido completo de cinco minutos con evidencia en Android/iPhone físicos, capturas de las tres habitaciones, tiempos de carga, FPS y validación del sistema de audio. Los pipelines de compilación no certifican por sí solos un playtest comercial completo.

## QA de continuidad — 18/10/2026

- **Corrección de controles:** el objetivo de interacción se decide por precisión de apuntado y no por cuál de las esferas de colisión transparentes interseca primero la cámara. Así la mochila no impide seleccionar el perchero y los objetos cercanos no bloquean las pistas del fondo.
- **Apoyos 3D:** el teléfono y el reloj esperan a que cargue el GLB de su mesa y utilizan la altura real de la superficie para colocarse. El cuadro se anima hasta quedar tendido junto a la pared, sin estar suspendido.
- **Audio:** el control de silencio bloquea también las señales Web Audio tardías, los clics y los golpes.
- **Ritmo independiente del tiempo:** recuperar la primera llave tira un cuadro; abrir la sala puede mostrar una aparición con parpadeo; entrar al dormitorio provoca un golpe y parpadeo. Una partida rápida conserva sorpresas en vez de perder las escenas de tensión.
- **Prueba de navegador añadida:** `e2e/mother-escape-journey.spec.ts` intenta completar las tres habitaciones con puntería de cámara y pulsaciones reales, fotografía, tres libros, tres engranajes, apertura del armario y capturas de la revelación **en viewport 390 × 844**.
- **CI habilitada:** `.github/workflows/escape-platform-qa.yml` incluye esta prueba Playwright además del lint, typecheck, build y tests de lógica.
- **Estado de validación:** la compilación de Vercel valida las rutas y tipos; no constituye por sí misma evidencia de que Playwright haya finalizado satisfactoriamente. El conector actual no expone resultados de los jobs `push`, por lo que **no afirmar tests E2E aprobados** sin recuperar su resultado y capturas.
- **Pendiente comercial:** evaluar personaje infantil GLB animado con licencia verificada, grabación de voz auténtica, prueba táctil en iPhone/Android físicos, FPS, fidelidad de muebles en capturas reales.


## Cierre de producción — 18/10/2026

- **QA con evidencia real:** GitHub Actions Playwright recorrió las tres habitaciones en Chromium WebGL2 en formato 390 × 844, giró las cuatro piezas, desbloqueó la biblioteca, reunió los tres engranajes, abrió el armario y mostró el final. Archivos: `mother-mobile-room-1.png`, `mother-mobile-room-2.png`, `mother-mobile-room-3.png`, `mother-mobile-reveal.png`, `mother-mobile-ending.png`.
- **Rendimiento del runner:** la primera medición reportó 5 FPS de `requestAnimationFrame` usando *SwiftShader*, renderizado por software. **No es un resultado de Android/iPhone ni certifica 30/60 FPS.** Se introdujo ocultación de escenas no activas y resolución adaptativa; tomar métricas nuevas por dispositivo real.
- **Personaje adulto de terror:** recurso existente `npc-sam-locomotion`, CC0, 7 clips, esqueleto verificado en `public/viralio-3d/index.json`. Se usa oscurecido y durante segundos como aparición de sombra; se retiraron los antiguos cuerpos de cápsulas geométricas.
- **Personaje infantil del final:** `mother-child-eli` (Eli, niño de seis años, 1,19 m), fuente `https://www.innerscene.com/tools/library/3d-parts/eli-3d-person-child-age-6-standing-bcaf5944`, autor Innerscene / MakeHuman-MPFB CC0; licencia CC0 y descarga GLB oficial permitida para uso comercial. Catalogado en `data/viralio-3d/catalog.json`. Debe superar el pipeline que incorpora los binarios a `public/viralio-3d/index.json` antes de afirmar que está disponible. Se precarga con la habitación final y permanece oculto hasta abrir el armario.
- **Animaciones del niño:** si el archivo incluye clips se emplea `THREE.AnimationMixer`; si solo contiene rig se utiliza movimiento de brazo/cabeza muy sutil; si el recurso no puede cargarse no se coloca una figura humana primitiva como sustituto. Requiere revisión visual del modelo real tras materializarlo.
- **Consistencia visual:** la fotografía original aparece sobre el soporte 3D de la pared, con muebles apoyados mediante alturas medidas en los GLB y sombras de contacto. Los globos quedan distribuidos a los lados para dejar el mensaje y el personaje visibles.
- **Exigencia de publicación comercial:** tener el juego compilado y el Playwright de escritorio aprobados no equivale a terminar los ensayos con dispositivos físicos; probar en Android y iPhone y evaluar comportamiento de GPU, uso de memoria y audio antes de campañas de pago.

## Primer acertijo rediseñado — 18/10/2026

- Se retiró por completo la llave del perchero (que ahora es un señuelo no resolutivo) y se colocó una cama con cabecera GLB CC0 real del índice `public/viralio-3d/index.json`: `hotel-bed-with-headboard-and-bench-original-hotel-furnishing`, fuente [Innerscene](https://www.innerscene.com/tools/library/3d-parts/hotel-bed-with-headboard-and-bench-original-hotel-furnishing-700471ba).
- La almohada tiene geometría de tela subdividida y materiales rugosos, pivote animado y una llave de bronce reducida a escala física. El objeto `key1` y su hotspot permanecen invisibles e inaccesibles hasta levantar la almohada en 3D.
- El jugador puede examinar la cama y elegir revisar la manta (falsa pista) o levantar la almohada. Al levantarla debe apuntar/tocar la llave por separado para recogerla. Un hotspot directo sobre la almohada también permite interactuar físicamente sin ventana emergente.
- La mochila contiene una nota con pista indirecta acerca del lugar donde el niño apoya la cabeza; el perchero se puede inspeccionar pero ya no otorga premios.
- Se sumaron mesa de luz y reloj GLB CC0, sombras de contacto para la cama y colisiones que respetan su volumen. Se mantiene el cartel introductorio y el tiempo de cinco minutos.
- La prueba `e2e/mother-escape-journey.spec.ts` verifica engaño en el perchero, pista de mochila, manta, levantamiento de almohada, recogida separada de llave y recorrido posterior por las tres habitaciones.

## Auditoría visual y controles — 18/10/2026

- Tres salas reorganizadas con mobiliario GLB ya publicado, centros de paso despejados, posiciones de detección y colisiones coordinadas con los modelos. Muebles y objetos pequeños apoyados físicamente. Primer cuarto rotulado como cuarto familiar.
- Ningún hotspot genera un círculo de ayuda: se eliminaron las mallas toroidales y animaciones pulsantes; los objetivos se descubren examinando el entorno y reciben confirmación solo al apuntar o tocar. El botón opcional `¿PISTA?` permanece para accesibilidad.
- Joystick circular analógico táctil: dirección y velocidad proporcionales, zona muerta central, captura de puntero, reinicio automático al soltar/cancelar, control de cámara con otro dedo, WASD conservado en escritorio.
- Se retiraron falsas molduras verticales y tapetes de cubo fino, se añadió un marco de madera a las puertas, se corrigió la mesa de luz que tapaba una puerta y se cerró el vano sin puerta de la última habitación.
- Evidencia de QA: `e2e/mother-escape-journey.spec.ts` pasa las tres salas tras sus nuevas ubicaciones; `e2e/viralio-escape-home.spec.ts` verifica joystick y retorno de la palanca al centro.
- Pendiente no certificable en CI: FPS y ergonomía en dispositivos Android y iOS físicos de gama media.
