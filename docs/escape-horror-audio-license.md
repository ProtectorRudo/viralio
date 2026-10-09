# UMBRAL — Sonido cinematográfico y licencias

## Producción
El sonido se inicia después de que el jugador toca **ENTRAR A LA CASA**; nunca se reproduce automáticamente al cargar la web. Se puede silenciar en cualquier momento desde los controles del juego. El sonido espacial usa `AudioContext`, `StereoPannerNode`, filtros de paso bajo y compresión dinámica. Las alertas de tensión tienen ganancia moderada y transiciones suaves.

El apagón de Eva afecta **solo al contenido del navegador**, no modifica el brillo del dispositivo ni puede apagar realmente su pantalla. Se realiza una sola vez por partida, después de entrar en la habitación y cuando no hay un objeto abierto. Se puede omitir. La opción *Terror suave* lo desactiva, y también se respeta la preferencia del sistema `prefers-reduced-motion`.

## Grabaciones CC0 incorporadas
Las siguientes grabaciones se utilizaron mediante **Creative Commons Zero (CC0)**, se descargaron y procesaron con FFmpeg (filtrado/normalización) y se alojan en `public/escape/audio/`:

1. `footsteps-wood.ogg`: **Steps in wood floor**, creador **mikeask**, OpenGameArt, https://opengameart.org/content/steps-in-wood-floor — grabación real de pasos en piso de madera, CC0.
2. `wood-creak.ogg`: **Tree Creaking**, autor de la publicación **AntumDeluge**, sonido original de **Department64**, OpenGameArt, https://opengameart.org/content/tree-creaking — crujido natural normalizado, CC0.
3. `heavy-door.ogg`: **Opening lock and door**, creador **RPG**, OpenGameArt, https://opengameart.org/content/opening-lock-and-door — grabación estéreo de cerradura/puerta, CC0.

Los efectos secundarios —latidos, golpes, drones, electricidad y sonido del apagón— se sintetizan mediante Web Audio API; **no se presentan como grabaciones profesionales**. Si falla la descarga de una muestra o el navegador no la admite, se utiliza una alternativa sintética. La voz de Eva sigue siendo la síntesis del navegador con subtítulos.

## Diseño narrativo
- Vestíbulo: madera lejana y un golpe detrás de la puerta al introducir una combinación incorrecta.
- Despacho: crujidos desplazados hacia la izquierda; error en la secuencia de velas.
- Habitación de Eva: silencio breve, apagón, latido, figura fotográfica, pasos cruzando el estéreo. Escena reducida por preferencia del sistema.
- Subsuelo: chispas suaves y latidos durante los últimos cinco minutos. Sin picos sonoros bruscos ni destellos repetidos.

## Auditoría y advertencias
- Las grabaciones se usan con ganancia baja y compresor dinámico, pero la percepción depende de auriculares/altavoces; probar en dispositivos reales antes de prometer una masterización profesional.
- La generación de nuevas voces y efectos premium mediante fal está **pendiente** por falta de créditos en la cuenta conectada. No se realizaron cargos nuevos.
- No reclamar que la pantalla física se apaga ni que Eva fue interpretada por una actriz.
