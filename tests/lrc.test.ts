import { expect, test } from 'claude-code/testing'

import { lineAt, parse, pick } from '../hooks/lrc'
import { MASCOT } from '../hooks/mascot'

const LRC = '[00:01.00] Tell me why you did it\n[00:04.50] \n[00:06.00][00:20.00] Every dream falling apart'

test('words light up as the line is sung', async () => {
  const lines = parse(LRC)
  expect(lines.map(line => line.at)).toEqual([1, 4.5, 6, 20])
  expect(lineAt(lines, 0.5, 30)).toBe(null)
  expect(lineAt(lines, 1, 30)).toEqual({ above: '', sung: 'Tell', rest: ' me why you did it', below: '' })
  expect(lineAt(lines, 4.2, 30)?.sung).toBe('Tell me why you did it')
  expect(lineAt(lines, 5, 30)).toBe(null)
  expect(lineAt(lines, 7, 30)?.below).toBe('Every dream falling apart')
  expect(lineAt(lines, 21, 30)?.sung.startsWith('Every')).toBe(true)
})

test('pick takes the synced version closest in length', async () => {
  const hits = [
    { duration: 245, syncedLyrics: '[00:01.00] extended', instrumental: false },
    { duration: 135, syncedLyrics: '[00:01.00] album', instrumental: false },
    { duration: null, syncedLyrics: '[00:01.00] unknown', instrumental: false },
  ]
  expect(pick(hits, 135.26)).toEqual([{ at: 1, text: 'album' }])
  expect(pick(hits, 60)).toBe(null)
  expect(pick([{ duration: 200, syncedLyrics: null, instrumental: true }], 200)).toBe('instrumental')
})

test('the mascot is the app sprite in braille, both poses', async () => {
  const rows = MASCOT.map(cells => {
    const bytes = Uint8Array.from(atob(cells), c => c.charCodeAt(0))
    const words = new Uint32Array(bytes.buffer)
    const glyphs = [...Array(24).keys()].map(i => String.fromCharCode(words[i * 3]!)).join('')
    return [glyphs.slice(0, 8), glyphs.slice(8, 16), glyphs.slice(16)]
  })
  expect(rows[0]).toEqual(['⠀⡔⣪⣭⣭⣕⢢⠀', '⣸⣿⣏⣻⣏⣻⣿⡇', '⠈⠙⢿⠮⠵⡿⠓⠄'])
  expect(rows[1]).toEqual(['⠀⡔⣪⣭⣭⣕⢢⠀', '⢸⣿⣏⣻⣏⣻⣿⣇', '⠠⠚⡿⠮⠵⢿⠋⠁'])
})
