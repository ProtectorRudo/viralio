# Te Hice Esto — flujo de publicación

Para evitar agotar el límite de despliegues de Vercel durante sesiones de trabajo intensas:

1. Trabajar en la rama `tehiceesto-work`.
2. Vercel tiene deshabilitados los despliegues automáticos para esa rama mediante `vercel.json`.
3. Agrupar cambios y pruebas allí.
4. Cuando una tanda esté lista, abrir/actualizar un PR hacia `main`.
5. Hacer un único merge a `main` para generar un solo despliegue de producción.

No hacer commits intermedios a `main` durante una tanda de diseño.
