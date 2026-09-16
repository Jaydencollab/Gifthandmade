import { describe, it, expect } from 'vitest'
import { encodePayload, decodePayload, LIMITS } from '../src/payload.js'

const sample = {
  m: ['Yêu em thật nhiều mỗi ngày', 'Luôn xinh đẹp và hay cười'],
  bg: 'I Love You',
  heart: 'Kỷ niệm 1 năm 💖',
  img: 'https://i.imgur.com/abc.jpg',
  music: 'song1',
}

describe('payload', () => {
  it('round-trips Vietnamese text', () => {
    expect(decodePayload(encodePayload(sample))).toEqual({ v: 1, ...sample })
  })

  it('produces a URL-safe string', () => {
    expect(encodePayload(sample)).toMatch(/^[A-Za-z0-9+\-$_.!~*'()]+$/)
  })

  it('returns null for garbage, empty, or wrong version', () => {
    expect(decodePayload('')).toBeNull()
    expect(decodePayload('%%%not-valid')).toBeNull()
    expect(decodePayload(encodePayload({ m: [] }))).toBeNull()
    expect(decodePayload(encodePayload({ ...sample, v: 2 }))).toBeNull()
  })

  it('applies limits', () => {
    const long = 'x'.repeat(100)
    const p = decodePayload(encodePayload({ m: Array(12).fill(long), bg: long, heart: long }))
    expect(p.m).toHaveLength(LIMITS.messages)
    expect(p.m[0]).toHaveLength(LIMITS.message)
    expect(p.bg).toHaveLength(LIMITS.bg)
    expect(p.heart).toHaveLength(LIMITS.heart)
  })

  it('drops blank messages and non-http urls', () => {
    const p = decodePayload(encodePayload({ m: ['  ', 'hi'], img: 'javascript:alert(1)', music: 'ftp://x' }))
    expect(p.m).toEqual(['hi'])
    expect(p.img).toBe('')
    expect(p.music).toBe('')
  })

  it('keeps http(s) music urls and song ids', () => {
    expect(decodePayload(encodePayload({ m: ['a'], music: 'https://x.com/a.mp3' })).music).toBe('https://x.com/a.mp3')
    expect(decodePayload(encodePayload({ m: ['a'], music: 'song_2' })).music).toBe('song_2')
  })
})
