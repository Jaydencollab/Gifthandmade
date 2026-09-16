import LZString from 'lz-string'

export const LIMITS = { messages: 8, message: 40, bg: 20, heart: 30 }

const isHttp = (s) => /^https?:\/\//i.test(s)
const str = (s, max) => (typeof s === 'string' ? s.trim().slice(0, max) : '')

export function encodePayload(data) {
  return LZString.compressToEncodedURIComponent(JSON.stringify({ v: 1, ...data }))
}

export function decodePayload(encoded) {
  let raw
  try {
    raw = JSON.parse(LZString.decompressFromEncodedURIComponent(encoded) || 'null')
  } catch {
    return null
  }
  if (!raw || raw.v !== 1 || !Array.isArray(raw.m)) return null

  const m = raw.m
    .map((s) => str(s, LIMITS.message))
    .filter(Boolean)
    .slice(0, LIMITS.messages)
  if (!m.length) return null

  const img = str(raw.img, 500)
  const music = str(raw.music, 500)
  return {
    v: 1,
    m,
    bg: str(raw.bg, LIMITS.bg),
    heart: str(raw.heart, LIMITS.heart),
    img: isHttp(img) ? img : '',
    music: isHttp(music) || /^[\w-]+$/.test(music) ? music : '',
  }
}
