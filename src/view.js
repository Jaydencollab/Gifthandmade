import { decodePayload } from './payload.js'
import { resolveMusic } from './songs.js'
import { startScene } from './scene.js'

const $ = (sel) => document.querySelector(sel)
const data = decodePayload(location.hash.slice(1))

if (!data) {
  $('#invalid').hidden = false
} else {
  $('#heartText').textContent = data.heart
  const photo = $('#photo')
  if (data.img) {
    photo.onload = () => (photo.hidden = false)
    photo.src = data.img
  }

  const src = resolveMusic(data.music)
  const audio = src ? new Audio(src) : null
  if (audio) audio.loop = true

  const intro = $('#intro')
  intro.hidden = false
  intro.onclick = async () => {
    // play() must be called inside the tap for mobile autoplay rules.
    audio?.play().catch(() => {})
    intro.remove()
    await document.fonts.load('700 64px "Dancing Script"').catch(() => {})
    startScene($('#scene'), data)
    $('#center').hidden = false
  }
}
