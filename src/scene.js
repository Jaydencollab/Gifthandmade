import * as THREE from 'three'

const rand = (a, b) => a + Math.random() * (b - a)
const BOX = { x: 45, y: 60, z: 50 } // half extents of the falling volume

function canvasTexture(canvas) {
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

// White glowing text; tinted per frame through material.color.
function textTexture(text) {
  const font = '700 64px "Dancing Script", cursive'
  const c = document.createElement('canvas')
  const ctx = c.getContext('2d')
  ctx.font = font
  const w = Math.ceil(ctx.measureText(text).width) + 60
  c.width = w
  c.height = 120
  ctx.font = font
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = '#fff'
  ctx.fillStyle = '#fff'
  for (const blur of [28, 12, 4]) {
    ctx.shadowBlur = blur
    ctx.fillText(text, w / 2, 60)
  }
  return { map: canvasTexture(c), aspect: w / 120 }
}

function shapeTexture(draw, glow) {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const ctx = c.getContext('2d')
  ctx.shadowColor = glow
  ctx.shadowBlur = 18
  draw(ctx)
  return canvasTexture(c)
}

const heartTexture = () =>
  shapeTexture((ctx) => {
    ctx.fillStyle = '#ff2d4b'
    ctx.beginPath()
    ctx.moveTo(64, 106)
    ctx.bezierCurveTo(8, 70, 14, 22, 44, 22)
    ctx.bezierCurveTo(56, 22, 64, 32, 64, 42)
    ctx.bezierCurveTo(64, 32, 72, 22, 84, 22)
    ctx.bezierCurveTo(114, 22, 120, 70, 64, 106)
    ctx.fill()
  }, '#ff2d4b')

const moonTexture = () =>
  shapeTexture((ctx) => {
    const m = document.createElement('canvas')
    m.width = m.height = 128
    const mc = m.getContext('2d')
    mc.fillStyle = '#fff'
    mc.arc(64, 64, 38, 0, Math.PI * 2)
    mc.fill()
    mc.globalCompositeOperation = 'destination-out'
    mc.beginPath()
    mc.arc(82, 52, 34, 0, Math.PI * 2)
    mc.fill()
    ctx.drawImage(m, 0, 0)
  }, '#fff')

const starTexture = () =>
  shapeTexture((ctx) => {
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 6
    ctx.lineJoin = 'round'
    ctx.beginPath()
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 18 : 44
      const a = (i * Math.PI) / 5 - Math.PI / 2
      ctx.lineTo(64 + r * Math.cos(a), 64 + r * Math.sin(a))
    }
    ctx.closePath()
    ctx.stroke()
  }, '#fff')

function starfield() {
  const n = 1800
  const pos = new Float32Array(n * 3)
  for (let i = 0; i < pos.length; i++) pos[i] = rand(-150, 150)
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  const dot = shapeTexture((ctx) => {
    ctx.fillStyle = '#fff'
    ctx.arc(64, 64, 28, 0, Math.PI * 2)
    ctx.fill()
  }, '#fff')
  return new THREE.Points(
    geo,
    new THREE.PointsMaterial({ ...baseMaterial, map: dot, size: 0.9, color: 0xcfd8ff, fog: false }),
  )
}

const baseMaterial = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }

export function startScene(canvas, { m: messages, bg }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
  const scene = new THREE.Scene()
  scene.fog = new THREE.Fog(0x000000, 45, 140)
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 500)
  camera.position.z = 50
  const world = new THREE.Group()
  scene.add(starfield(), world)

  const falling = []
  const spawn = (obj, anywhere) =>
    obj.position.set(rand(-BOX.x, BOX.x), anywhere ? rand(-BOX.y, BOX.y) : BOX.y + rand(0, 15), rand(-BOX.z, BOX.z))
  const add = (obj, item) => {
    spawn(obj, true)
    world.add(obj)
    falling.push({ obj, ...item })
  }

  // Neon text
  const labels = [...new Set([...messages, bg].filter(Boolean))]
  const textures = new Map(labels.map((t) => [t, textTexture(t)]))
  const plane = new THREE.PlaneGeometry(1, 1)
  for (let i = 0; i < 54; i++) {
    const text = i % 6 === 5 && bg ? bg : messages[i % messages.length]
    const { map, aspect } = textures.get(text)
    const mat = new THREE.MeshBasicMaterial({ ...baseMaterial, map, side: THREE.DoubleSide })
    const mesh = new THREE.Mesh(plane, mat)
    const h = text === bg ? rand(4, 6) : rand(1.8, 3.2)
    mesh.scale.set(h * aspect, h, 1)
    add(mesh, { speed: rand(4, 8), tint: mat, phase: rand(0, 0.08) })
  }

  // Hearts, moons, stars
  const shapes = [
    { map: heartTexture(), count: 45, size: [1.5, 3.2], tinted: false },
    { map: moonTexture(), count: 14, size: [2, 3.5], tinted: true },
    { map: starTexture(), count: 22, size: [1.2, 2.6], tinted: true },
  ]
  for (const s of shapes) {
    for (let i = 0; i < s.count; i++) {
      const mat = new THREE.SpriteMaterial({ ...baseMaterial, map: s.map, rotation: rand(0, Math.PI * 2) })
      const sprite = new THREE.Sprite(mat)
      const k = rand(...s.size)
      sprite.scale.set(k, k, 1)
      add(sprite, { speed: rand(5, 11), spin: rand(-1.2, 1.2), tint: s.tinted && mat, phase: rand(0, 0.08) })
    }
  }

  // Drag to rotate, gentle sway when idle
  const view = { x: 0, y: 0, tx: 0, ty: 0, dragging: false, lastX: 0, lastY: 0, idle: 0 }
  canvas.addEventListener('pointerdown', (e) => {
    Object.assign(view, { dragging: true, lastX: e.clientX, lastY: e.clientY })
    canvas.setPointerCapture(e.pointerId)
  })
  canvas.addEventListener('pointermove', (e) => {
    if (!view.dragging) return
    view.ty = THREE.MathUtils.clamp(view.ty + (e.clientX - view.lastX) * 0.006, -1.2, 1.2)
    view.tx = THREE.MathUtils.clamp(view.tx + (e.clientY - view.lastY) * 0.006, -0.8, 0.8)
    Object.assign(view, { lastX: e.clientX, lastY: e.clientY, idle: 0 })
  })
  const release = () => (view.dragging = false)
  canvas.addEventListener('pointerup', release)
  canvas.addEventListener('pointercancel', release)

  function resize() {
    const w = innerWidth
    const h = innerHeight
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    // Portrait screens are narrow: shrink the world so more of it is visible.
    world.scale.setScalar(Math.min(1, camera.aspect * 1.3))
  }
  addEventListener('resize', resize)
  resize()

  const clock = new THREE.Clock()
  const color = new THREE.Color()
  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.05)
    const t = clock.elapsedTime

    if (!view.dragging && (view.idle += dt) > 3) {
      view.ty += (Math.sin(t * 0.2) * 0.35 - view.ty) * dt * 0.5
      view.tx += (Math.sin(t * 0.13) * 0.15 - view.tx) * dt * 0.5
    }
    view.x += (view.tx - view.x) * Math.min(1, dt * 6)
    view.y += (view.ty - view.y) * Math.min(1, dt * 6)
    world.rotation.set(view.x, view.y, 0)

    // Blue (0.58) ⇄ purple (0.76)
    const hue = 0.67 + 0.09 * Math.sin(t * 0.35)
    for (const f of falling) {
      f.obj.position.y -= f.speed * dt
      if (f.obj.position.y < -BOX.y - 10) spawn(f.obj, false)
      if (f.spin) f.obj.material.rotation += f.spin * dt
      if (f.tint) f.tint.color.copy(color.setHSL(hue + f.phase, 1, 0.66))
    }
    renderer.render(scene, camera)
  })
}
