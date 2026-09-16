// Put your mp3 files in public/music/ and list them here, e.g.
// { id: 'song1', title: 'Tên bài hát', src: 'music/song1.mp3' },
export const SONGS = [
  { id: 'au-clair-de-la-lune', title: '🌕 Au Clair de la Lune – Dưới ánh trăng (hộp nhạc)', src: 'music/au-clair-de-la-lune.mp3' },
  { id: 'moonlight-sonata', title: '🌙 Moonlight Sonata – Beethoven (hộp nhạc)', src: 'music/moonlight-sonata.mp3' },
  { id: 'greensleeves', title: '💞 Greensleeves – tình ca cổ (hộp nhạc)', src: 'music/greensleeves.mp3' },
  { id: 'canon-in-d', title: '💍 Canon in D – Pachelbel (hộp nhạc)', src: 'music/canon-in-d.mp3' },
  { id: 'fur-elise', title: 'Für Elise – Beethoven (hộp nhạc)', src: 'music/fur-elise.mp3' },
  { id: 'happy-birthday', title: 'Happy Birthday (hộp nhạc)', src: 'music/happy-birthday.mp3' },
  { id: 'twinkle-star', title: 'Twinkle Twinkle Little Star (hộp nhạc)', src: 'music/twinkle-star.mp3' },
  { id: 'ode-to-joy', title: 'Ode to Joy – Beethoven (hộp nhạc)', src: 'music/ode-to-joy.mp3' },
]

export function resolveMusic(music) {
  if (!music) return ''
  if (/^https?:\/\//i.test(music)) return music
  return SONGS.find((s) => s.id === music)?.src || ''
}
