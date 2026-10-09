# UMBRAL / Auditoría de nivel premium — 9 de octubre de 2026

## Criterio rector
La referencia del usuario (mansión azul nocturna/ámbar, tarjetas cinematográficas y objetos fotorrealistas) es el **piso obligatorio**, no una estética aproximada. No se puede vender como obra AAA/100 USD+ sin validación humana, rendimiento móvil real, tiempo de juego digno y consistencia de activos.

## Referencias
- Fireproof Games / The Room: https://www.fireproofgames.com/about — exploración táctil y manipulación de objetos como parte esencial de la inmersión.
- Artículo técnico en español, Fireproof: https://blog.es.playstation.com/2020/03/23/qu-aprendi-fireproof-games-durante-el-desarrollo-de-the-room-vr-para-ps-vr/ — el peso/resistencia de interacciones y que las personas jueguen por su cuenta.
- Entrevista técnica: https://gamerhorizon.com/2014/08/19/room-interview-fireproof-studios-barry-meade/ — audio discreto que sugiere en vez de saturar.

## Hallazgos reproducibles en código
| Dimensión | Diagnóstico anterior | Acción de esta versión | Aún pendiente |
|---|---|---|---|
| Portada y salas | Fotos cinematográficas ya cargadas. La capa de hotspots demasiado visible se impone sobre el arte. | Retículas diegéticas con zona táctil preservada, luces prácticas de ventana/velas/fusibles, deriva de cámara más delicada. | Auditoría visual manual y consistencia de color escena por escena |
| Objetos | Fotografías 2D; al inspeccionar, las imágenes no reaccionaban al jugador. | Parallax 3D en primer plano, reflejo variable sobre vidrio, marco con profundidad, respetando movimiento reducido. | Modelos 3D reales/photogrammetry y sombras PBR para todas las piezas |
| Mecánicas | Reloj era solo un texto con imagen, sin manipulación. | Engranaje de bronce de 2 vueltas, Pointer Events+teclado+botón, pista oculta, persistencia y logro de +300. | Otras mecánicas complejas con objetos combinables en inventario |
| Narrativa/pistas | Las cartas se leían como bloques de texto de un modal. | Carta física de doble cara, sello de cera, caligrafía, información al dorso y volteo táctil. | Reescritura narrativa profesional, pistas más complejas, ramificación real |
| Sonido y tensión | Música procedural, foley CC0, un apagón, voz sintética. | Ambientación ya no interrumpe apertura de carta/transiciones/blackout; se preserva banda sonora adaptativa. | Actuación de voz producida; mezcla y masterización móvil real |
| Juego completo | Cuatro salas, ~cuatro acertijos centrales; quien sepa las respuestas puede completar el juego rápido. | Nueva exploración opcional del reloj con bonificación y lectura a doble cara. | **Falta profundidad de puzzles y duración demostrada** para justificar precio alto |
| Accesibilidad | Soporte parcial de teclado, sonido opcional, movimiento reducido. | Mecanismo con teclado, botón táctil accesible, pistas en texto; retículas de 50 px; menos movimiento. | Revisión WCAG 2.2 manual, lector de pantalla y contraste |
| Calidad técnica | Pruebas automatizadas para recorrido, tiempo, sonidos y publicación estática. | Añadidas pruebas de inspección física, persistencia, ambas caras y cierre. | Safari iOS/Android real, LCP/INP/CWV y monitoreo de errores |
| Monetización | La ruta /escape es prueba pública; récord solo local. | Ningún acceso a cobros/QR modificado. | Precio real requiere producto definitivo, contenido, derechos, licencias, pagos, soporte, protección de acceso y pruebas con jugadores |

## Protocolo de aprobación de un producto de alto valor
1. Cada pantalla + primer plano del objeto debe superar la calidad de la referencia enviada.
2. Primera sesión a ciegas con al menos 8–10 jugadores: dificultad, emoción, resolución, frustración y abandono. Sin guiar ni insinuar respuestas.
3. Medir duración real: si se termina en 5–10 minutos, ampliar y entrelazar acertijos.
4. Compatibilidad real con iPhone Safari y Android gama media, audio desbloqueado por interacción, sin bloqueos.
5. Pruebas automatizadas completas verdes + inspección humana. El éxito de CI **no demuestra** calidad AAA por sí mismo.
6. Mantener la web pública actual sin cobros hasta aprobar lo anterior.

## Revisión visual propuesta por pantalla
- Portada: fotografía maestra, cinematografía nocturna, tipografía muy legible, información del desafío sin saturación.
- Vestíbulo: puerta con foto e interacción; reloj mecánico manipulable y retratos ópticos.
- Despacho: cartas de cera por ambas caras, lámparas cuyo estado se refleja en el ambiente.
- Habitación Eva: contraste emocional; muñeca y caja filmada, voz con subtítulos y pausa del tiempo.
- Subsuelo: fusibles claramente visibles, sonido eléctrico de peligro, resolución ética final.
- Finales: composición en fotografía, logro secreto y puntuación que no dependa exclusivamente de adivinar cuatro códigos.

**Veredicto editorial:** esta versión es una mejora significativa de tactilidad y presentación, pero **todavía no es honesto afirmar que vale cientos de dólares**. Los principales cuellos de botella son la escala de contenido, el grado de realismo continuo y la validación con jugadores reales.
