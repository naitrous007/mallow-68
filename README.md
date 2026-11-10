# Mallow 68

A playful, pastel 3D mechanical keyboard you can take apart layer by layer.

Built with **React 19**, **React Three Fiber**, **Drei**, **GSAP**, **Framer Motion**, and **Zustand**.

## Run it

```bash
npm install
npm run dev
```

Open the printed local URL. For a production build:

```bash
npm run build
npm run preview
```

## What's inside

- **Explode slider (0–100%)** — keycaps float up, switches lift, then plate, foam, PCB, and finally the bottom case slides forward. Every layer is sprung with a small overshoot.
- **Layer isolation** — use the Anatomy panel or click a visible part. Everything else fades to 15% opacity.
- **Switch peek** — once the switches are exposed (or the Switches layer is soloed), hover a key to lift its cap and split the switch into stem, spring, top and bottom housing.
- **Real key input** — mapped 68-key layout. Physical keys press the matching 3D key and trigger a synthesized thock/clack, with a sound on/off toggle.
- **Live customizer** — six keycap themes and six case colors, animated into the 3D scene and saved in `localStorage`.
- **Touch and mobile layout** — responsive camera, native range input, horizontal layer strip, and a bottom-sheet customizer.
- **Performance** — keycaps, switches, plate cut-outs, foam cut-outs, and PCB sockets use instanced meshes. All labels and decals are painted locally on canvases; no external assets or HDRIs are fetched.

## Controls

| Action | Control |
| --- | --- |
| Orbit | Drag on empty scene space |
| Explode | Bottom slider, or the reset button |
| Isolate a layer | Anatomy panel, or click a part in the scene |
| Customize | Palette button, top right |
| Play a key | Press your keyboard, or tap a keycap |
| Switch peek | Hover switches once they're exposed |

## Layout

- `src/three/` — the scene, desk props, instanced keyboard, and spring/fade behavior.
- `src/ui/` — top bar, Anatomy panel, explode dock, customizer, and floating hints.
- `src/data.js` — the 68-key layout, themes, case colors, and exploded-layer choreography.
- `src/audio.js` — a small Web Audio synth for the thock/clack sounds.
- `src/store.js` — persisted Zustand settings and interaction state.
