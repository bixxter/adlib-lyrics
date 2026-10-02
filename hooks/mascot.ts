// Adlib's dancing mascot (16×12 px, Adlib.swift `enum Mascot`), drawn in braille: each cell
// holds 2×4 px, so the sprite is 8×3 cells, about the app's own 64×48 pt. Eyes and mouth stay
// unlit, so they read as holes; a cell takes the color most of its lit pixels have.
const HEAD = [
  '.....HHHHHH.....',
  '...HH......HH...',
  '..H..BBBBBB..H..',
  '..H.BBBBBBBB.H..',
  '.HHBBBBBBBBBBHH.',
  '.HHBBEWBBEWBBHH.',
  '.HHBBEEBBEEBBHH.',
]
const POSES = [
  ['BHHBCBBBBBBCBHH.', '.BBBBBMBBMBBB...', '...BBBBMMBBBBB..', '....BBBBBBBB..B.', '.....B....B.....'],
  ['.HHBCBBBBBBCBHHB', '...BBBMBBMBBBBB.', '..BBBBBMMBBBB...', '.B..BBBBBBBB....', '....B......B....'],
]
const COLOR: Record<string, number> = { B: 0xf5f5f5, H: 0x666666, C: 0xc7c7c7, W: 0xffffff }
const DOTS = [[0x01, 0x08], [0x02, 0x10], [0x04, 0x20], [0x40, 0x80]] // braille bit at [dy][dx]
const DEFAULT = 0x01000000 // the terminal's own color

export const MASCOT_COLUMNS = 8
export const MASCOT_ROWS = 3

function encode(sprite: string[]): string {
  const words: number[] = []
  for (let cy = 0; cy < MASCOT_ROWS; cy++) {
    for (let cx = 0; cx < MASCOT_COLUMNS; cx++) {
      let dots = 0
      const count: Record<string, number> = {}
      for (let dy = 0; dy < 4; dy++) {
        for (let dx = 0; dx < 2; dx++) {
          const px = sprite[cy * 4 + dy]![cx * 2 + dx]!
          if (!(px in COLOR)) continue
          dots |= DOTS[dy]![dx]!
          count[px] = (count[px] ?? 0) + 1
        }
      }
      const most = Object.keys(count).sort((a, b) => count[b]! - count[a]!)[0]
      words.push(0x2800 + dots, most ? COLOR[most]! : DEFAULT, DEFAULT)
    }
  }
  // Raster cells: base64 of little-endian u32 [codePoint, fg, bg] triplets (Macs are little-endian).
  return btoa(String.fromCharCode(...new Uint8Array(Uint32Array.from(words).buffer)))
}

/** The Raster `cells` of each dance pose. */
export const MASCOT = POSES.map(pose => encode([...HEAD, ...pose]))
