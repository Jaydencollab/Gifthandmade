# Anniversary QR — Design

Date: 2026-09-16

## Goal

A mobile-first static web app: the creator enters anniversary messages, gets a
downloadable QR code; scanning it opens a greeting page with neon text, hearts,
moons and stars falling in 3D (inspired by the reference screen recording).

Out of scope: payment, activation codes, third-party branding, uploading
images/music, any backend.

## Stack

- Vite + vanilla JS (ES modules)
- `three` — 3D greeting scene
- `qrcode-generator` — QR matrix
- `lz-string` — compress payload into the URL
- `vitest` — unit tests
- Output: static files deployable to GitHub Pages / Netlify

## Pages

### `index.html` — creator

Fields:
- Messages: 4 inputs by default, "+ Thêm lời nhắn" adds more (max 8).
  Each message max 40 characters.
- Background text (`bg`), max 20 characters, e.g. "I Love You".
- Heart text (`heart`), max 30 characters.
- Image URL (`img`), optional.
- Music: select from `src/songs.js` list with preview play/pause, or paste an
  mp3 URL (`music`).
- Top / bottom caption for the QR template, max 30 characters each.

"Tạo QR" builds the link, shows the QR preview with 3 template choices, and
"Tải QR" downloads a PNG. The link is also shown with a copy button and an
"Xem thử" (preview) link.

### `view.html` — greeting

1. Intro overlay "Chạm để mở quà 💝". Tap starts music (autoplay policy) and
   the scene.
2. Three.js scene:
   - Black background, starfield (Points).
   - Messages and background text rendered to canvas textures as neon glowing
     text (color cycles blue → purple), placed as sprites/planes at random
     x/z, falling along -y, respawning at the top. Depth gives perspective.
   - Particles: red hearts, neon moons and stars (canvas-drawn textures),
     falling and slowly rotating.
   - Heart text shown large in the centre (DOM overlay with glow).
   - If `img` is set: shown in a glowing circular frame (DOM overlay) under the
     heart text; on load error it is hidden.
   - Touch/mouse drag rotates the camera around the centre (simple custom
     drag handler, no OrbitControls needed); gentle auto-rotation when idle.
   - Handles resize / orientation change; pixel ratio capped at 2.
3. Invalid or missing payload → friendly message with a link to the creator.

## Data flow

`payload = { v:1, m:[...messages], bg, heart, img, music }`
→ `JSON.stringify` → `LZString.compressToEncodedURIComponent`
→ `<base>/view.html#<data>`.

The view page reads `location.hash`, decompresses, validates (`v === 1`,
`m` is a non-empty array of strings), and trims to the limits above. The hash
is never sent to a server. `music` may be a song id from `songs.js` or an
http(s) URL; `img` must be http(s). Anything else is dropped.

Module: `src/payload.js` exports `encodePayload(obj)` and
`decodePayload(str)` (returns `null` on failure).

## QR templates (`src/qrTemplates.js`)

Canvas rendering, PNG via `canvas.toBlob`. Error correction level `M`.
- **Mẫu 1** — plain square QR, white background, quiet zone.
- **Mẫu 2** — heart QR: real QR centred; the rest of a heart shape is filled
  with random decorative modules of the same size, separated from the QR by a
  one-module quiet gap so scanners still find the code. Top/bottom captions.
- **Mẫu 3** — same as Mẫu 2 on black background with white modules.

## Music

`src/songs.js` exports `[{ id, title, src }]` pointing at
`public/music/*.mp3`. No copyrighted files ship with the repo; a README note
explains how to add them. Missing/failed audio is ignored silently.

## Testing

- Vitest: `encodePayload`/`decodePayload` round-trip including Vietnamese
  diacritics; garbage / empty / wrong-version input returns `null`; limits and
  URL sanitising applied.
- `vite build` succeeds.
- Manual check in a mobile-sized browser viewport: creator flow, QR download,
  view page effect, drag rotation.
