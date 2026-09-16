import { encodePayload, LIMITS } from './payload.js'
import { TEMPLATES, renderTemplate } from './qrTemplates.js'
import { SONGS, resolveMusic } from './songs.js'

const $ = (sel) => document.querySelector(sel)
const form = $('#form')
const messages = $('#messages')

function addMessage(value = '') {
  const n = messages.children.length + 1
  const label = document.createElement('label')
  label.textContent = `Lời nhắn ${n}`
  const input = document.createElement('input')
  input.maxLength = LIMITS.message
  input.placeholder = 'Lời bạn muốn nói (3-8 từ)'
  input.value = value
  label.append(input)
  messages.append(label)
  $('#addMsg').hidden = n >= LIMITS.messages
}
for (let i = 0; i < 4; i++) addMessage()
$('#addMsg').onclick = () => addMessage()

// Music
const audio = new Audio()
const select = form.elements.song
if (SONGS.length) {
  for (const s of SONGS) select.add(new Option(s.title, s.id))
} else {
  $('#songPicker').hidden = true
}
$('#preview').onclick = () => {
  if (!audio.paused) return audio.pause()
  const src = resolveMusic(select.value)
  if (!src) return
  audio.src = src
  audio.play().catch(() => {})
}
audio.onplay = () => ($('#preview').textContent = '❚❚')
audio.onpause = () => ($('#preview').textContent = '▶︎')
select.onchange = () => audio.pause()

// Result
let state = { url: '', template: 2 }
const captions = () => ({ top: form.elements.top.value.trim(), bottom: form.elements.bottom.value.trim() })

function drawAll() {
  renderTemplate($('#qr'), state.template, state.url, captions())
  const box = $('#templates')
  box.replaceChildren(
    ...TEMPLATES.map((t) => {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.textContent = t.name
      btn.setAttribute('aria-pressed', t.id === state.template)
      const c = document.createElement('canvas')
      renderTemplate(c, t.id, state.url, captions())
      btn.append(c)
      btn.onclick = () => {
        state.template = t.id
        drawAll()
      }
      return btn
    }),
  )
}

form.onsubmit = (e) => {
  e.preventDefault()
  const f = form.elements
  const m = [...messages.querySelectorAll('input')].map((i) => i.value.trim()).filter(Boolean)
  const error = $('#error')
  if (!m.length) {
    error.textContent = 'Hãy nhập ít nhất một lời nhắn.'
    error.hidden = false
    return
  }
  error.hidden = true
  audio.pause()

  const data = encodePayload({
    m,
    bg: f.bg.value.trim(),
    heart: f.heart.value.trim(),
    img: f.img.value.trim(),
    music: f.musicUrl.value.trim() || select.value,
  })
  state.url = new URL(`view.html#${data}`, location.href).href
  $('#link').value = state.url
  $('#open').href = state.url
  $('#result').hidden = false
  drawAll()
  $('#result').scrollIntoView({ behavior: 'smooth' })
}

// Redraw captions live once a QR exists.
for (const name of ['top', 'bottom']) form.elements[name].oninput = () => state.url && drawAll()

$('#download').onclick = () => {
  $('#qr').toBlob((blob) => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `qr-ky-niem-mau-${state.template}.png`
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  }, 'image/png')
}

$('#copy').onclick = async () => {
  try {
    await navigator.clipboard.writeText(state.url)
  } catch {
    $('#link').select()
    document.execCommand('copy')
  }
  $('#copy').textContent = 'Đã chép ✓'
  setTimeout(() => ($('#copy').textContent = 'Sao chép'), 1500)
}

// Captions use the script font; redraw once it has loaded.
document.fonts.ready.then(() => state.url && drawAll())
