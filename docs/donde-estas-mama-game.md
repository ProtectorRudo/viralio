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
