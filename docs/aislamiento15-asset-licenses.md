# AISLAMIENTO 15 · Asset provenance and commercial permissions

## Integrated third-party medical meshes

The following models are used in the 3D scene as real glTF-binary assets, fetched during the GitHub Pages production build. Their provider identifies them as **CC0** (public-domain dedication, including commercial redistribution).

| Bundled file | Source | License | Source documented |
| --- | --- | --- | --- |
| `hospital-bed-flat.glb` | https://www.innerscene.com/tools/library/3d-parts/hospital-bed-flat-mattress-44fc9faf | CC0 | 2026-10-14 |
| `hospital-bed-raised.glb` | https://www.innerscene.com/tools/library/3d-parts/hospital-bed-raised-backrest-6bb95542 | CC0 | 2026-10-14 |
| `medical-headwall.glb` | https://www.innerscene.com/tools/library/3d-parts/patient-room-headwall-services-unit-536f71cf | CC0 | 2026-10-14 |
| `supply-cart.glb` | https://www.innerscene.com/tools/library/3d-parts/three-shelf-medical-supply-cart-45cc326c | CC0 | 2026-10-14 |
| `vital-monitor.glb` | https://www.innerscene.com/tools/library/3d-parts/vital-signs-monitor-on-roll-stand-83c9b7fa | CC0 | 2026-10-14 |
| `exam-light.glb` | https://www.innerscene.com/tools/library/3d-parts/mobile-examination-light-65ace7fb | CC0 | 2026-10-14 |
| `privacy-curtain.glb` | https://www.innerscene.com/tools/library/3d-parts/privacy-curtain-and-ceiling-track-0353bfbc | CC0 | 2026-10-14 |
| `transport-stretcher.glb` | https://www.innerscene.com/tools/library/3d-parts/patient-transport-stretcher-3ff4d512 | CC0 | 2026-10-14 |

Files are obtained from the provider's dedicated download endpoints. The deployment validates all eight medical GLBs' magic headers and maximum transfer sizes before publishing them. The player includes fallback geometry if any asset fails to load.

## Reused studio-owned character asset

- `warden.glb` is copied at build time from `la-ultima-funcion/models/usher/usher-mobile.glb` already hosted in the project owner's GitHub Pages repository.
- Its rig is controlled by `THREE.AnimationMixer` when embedded animations are present.
- The previous KhronosGroup CesiumMan CC BY 4.0 fallback is only fetched if the studio's model fails.
- The character is tinted and given an in-game mask via separate meshes; the original textures are retained.

## Original geometry and texture authoring

- `src/app/aislamiento-15/HospitalPremiumArt.ts` includes original procedural textures, physical trim, bolts, ceiling structures, clinical modules, floor wear, medical signage, and three distinct wall/door configurations.
- All detail meshes are in true 3D. Shared geometries and selected instanced meshes reduce WebGL draw calls.
- The horror ambience is generated with Web Audio, rather than a stock copyrighted soundtrack.

## Remaining premium-quality gates

1. Playtest the complete 3-room puzzle route without dead ends and calibrate average time to approximately 15 minutes.
2. Validate 30 FPS practical minimum on middle-range real Android hardware and thermal behaviour over the whole session.
3. Replace any remaining blockout equipment with fully authored professional glTF assets; verify original character art direction and skeletal clips.
4. Confirm sound cues, illumination and props remain legible on a vertically held phone.
5. Do not claim these goals have been met until verified.
