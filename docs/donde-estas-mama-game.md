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
- **Modelo de acceso:** demo especial gratuita, sin sistema de compra (no prometer precios).
- **Biblioteca:** usa `loadViralio3DAsset` y `loadViralioPBR`, consumiendo solo los modelos del escenario. Los modelos son registros CC0 ya publicados en `public/viralio-3d/index.json`; no se incorporaron archivos externos nuevos.
- **Límite actual:** los engranajes, indicadores, luces y señalización son mecanismos construidos con geometría nativa, no sustitutos de muebles. La escena se considera en desarrollo hasta pruebas completas reales en Android y iOS.
- **Pruebas manuales recomendadas:** abrir tres habitaciones, resolver secuencia de libros y caja musical, vencer antes de 300 s, validar modo fracaso, usar móvil vertical, probar manos izquierda y derecha, comprobar WebGL2, medir FPS, verificar assets sin intersecciones y sin objetos flotantes.
