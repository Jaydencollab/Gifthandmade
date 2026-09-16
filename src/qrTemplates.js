import qrcode from 'qrcode-generator'

export const TEMPLATES = [
  { id: 1, name: 'Mẫu 1' },
  { id: 2, name: 'Mẫu 2' },
  { id: 3, name: 'Mẫu 3' },
]

export function qrMatrix(text) {
  const qr = qrcode(0, 'M')
  qr.addData(text)
  qr.make()
  const n = qr.getModuleCount()
  return Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => qr.isDark(r, c)))
}

// Classic heart curve; (x, y) roughly in [-1.2, 1.2], y pointing up.
const inHeart = (x, y) => (x * x + y * y - 1) ** 3 - x * x * y ** 3 <= 0

function rng(seed) {
  return () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
}

// Returns { size, cells } where cells[r][c] is true for dark modules.
// The real QR sits inside the heart with a 2-module light gap around it.
export function heartGrid(matrix) {
  const n = matrix.length
  const gap = 2
  for (let size = Math.ceil(n * 1.8); ; size++) {
    const top = Math.round(size * 0.3)
    const left = Math.floor((size - n) / 2)
    const toXY = (r, c) => [((c + 0.5) / size - 0.5) * 2.5, (0.5 - (r + 0.5) / size) * 2.5 + 0.2]
    const inside = (r, c) => inHeart(...toXY(r, c))

    let fits = true
    for (let r = top - gap; r < top + n + gap && fits; r++) {
      for (let c = left - gap; c < left + n + gap && fits; c++) {
        if (!inside(r, c)) fits = false
      }
    }
    if (!fits) continue

    const rand = rng(n * 7919)
    const cells = Array.from({ length: size }, (_, r) =>
      Array.from({ length: size }, (_, c) => {
        const qr = r >= top && r < top + n && c >= left && c < left + n
        if (qr) return matrix[r - top][c - left]
        const nearQr = r >= top - gap && r < top + n + gap && c >= left - gap && c < left + n + gap
        return !nearQr && inside(r, c) && rand() < 0.5
      }),
    )
    return { size, cells }
  }
}

function drawCells(ctx, cells, x, y, px, color) {
  ctx.fillStyle = color
  cells.forEach((row, r) =>
    row.forEach((dark, c) => {
      if (dark) ctx.fillRect(Math.floor(x + c * px), Math.floor(y + r * px), Math.ceil(px), Math.ceil(px))
    }),
  )
}

function caption(ctx, text, y, color) {
  if (!text) return
  ctx.fillStyle = color
  ctx.font = '600 56px "Dancing Script", cursive'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, ctx.canvas.width / 2, y, ctx.canvas.width - 80)
}

// Draws the chosen template onto `canvas` (resizing it).
export function renderTemplate(canvas, templateId, url, { top = '', bottom = '' } = {}) {
  const ctx = canvas.getContext('2d')
  const matrix = qrMatrix(url)

  if (templateId === 1) {
    canvas.width = canvas.height = 1080
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, 1080, 1080)
    const px = 1080 / (matrix.length + 8)
    drawCells(ctx, matrix, px * 4, px * 4, px, '#000')
    return
  }

  const dark = templateId === 3
  canvas.width = 1080
  canvas.height = 1440
  ctx.fillStyle = dark ? '#000' : '#fff'
  ctx.fillRect(0, 0, 1080, 1440)

  const { size, cells } = heartGrid(matrix)
  const px = 840 / size
  drawCells(ctx, cells, 120, 300, px, dark ? '#fff' : '#000')
  const ink = dark ? '#fff' : '#222'
  caption(ctx, top, 180, ink)
  caption(ctx, bottom, 1260, ink)
}
