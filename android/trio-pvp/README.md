# Trío PvP Android - compilación aislada

Este subproyecto NO forma parte de Viralio ni de su despliegue.

- Rama de prueba: `feat/trio-pvp-android-20261113`
- No integrar a `main`.
- Workflow exclusivo: `.github/workflows/trio-pvp-android.yml`
- Fuentes Android v0.3-alpha: 4 partes Base64 que forman un tar.gz, verificadas por SHA-256.
- Si CI pasa, descargar artefacto `trio-pvp-v0-3-alpha-debug` en la ejecución de GitHub Actions.
- El APK sería de desarrollo; no está probado en un teléfono ni aprobado por Niantic.
- Captura de pantalla y OCR local requieren permiso por sesión; el riesgo de restricciones de Pokémon GO permanece.
- Sin permisos de Internet declarados en la aplicación.
- SHA-256 fuente reconstruida: `5a869a524c345d7d800868f61fc944a6ac9977b1ccc4edc0f3d400c62cd2cd93`.

## Prueba en teléfono

1. Instalar APK debug únicamente si GitHub Actions pasa.
2. Probar primero el modo manual, luego la captura con una pantalla de prueba.
3. Confirmar permiso de captura, notificación Detener, detección OCR y ventana flotante.
4. No se afirma compatibilidad con Pokémon GO: el proveedor del juego podría restringir herramientas externas.
