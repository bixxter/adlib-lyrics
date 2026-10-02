import type { AdlibWords } from '../types'

export type Line = { at: number; text: string }
export type Hit = { duration: number | null; syncedLyrics: string | null; instrumental: boolean }

// "[01:02.34][01:40.00] words" → one Line per timestamp, sorted by time.
export function parse(lrc: string): Line[] {
  const lines: Line[] = []
  for (const row of lrc.split('\n')) {
    const text = row.replace(/\[[^\]]*\]/g, '').trim()
    for (const [, m, s] of row.matchAll(/\[(\d+):(\d+(?:\.\d+)?)\]/g)) {
      lines.push({ at: Number(m) * 60 + Number(s), text })
    }
  }
  return lines.sort((a, b) => a.at - b.at)
}

// LRCLIB search hits → the synced version closest in length to what plays.
export function pick(hits: Hit[], duration: number): Line[] | 'instrumental' | null {
  const off = (hit: Hit) => Math.abs((hit.duration ?? Infinity) - duration)
  const best = hits.filter(hit => hit.syncedLyrics).sort((a, b) => off(a) - off(b))[0]
  if (best && off(best) <= 5) return parse(best.syncedLyrics!)
  return hits.some(hit => hit.instrumental) ? 'instrumental' : null
}

// The line at `t` seconds, split where the word being sung ends, between its neighbours.
// ponytail: LRCLIB times lines, not words, so words are spread by character count over
// 90% of the gap to the next line (6 s at most); word-synced (enhanced LRC) if that drifts.
export function lineAt(lines: Line[], t: number, end: number): AdlibWords | null {
  let i = -1
  while (i + 1 < lines.length && lines[i + 1]!.at <= t) i++
  const line = lines[i]
  if (!line?.text) return null
  const span = Math.min(((lines[i + 1]?.at ?? end) - line.at) * 0.9, 6)
  const chars = Math.floor((Math.min(t - line.at, span) / span) * line.text.length)
  const cut = line.text.indexOf(' ', chars)
  const at = cut < 0 ? line.text.length : cut
  return {
    above: lines[i - 1]?.text ?? '',
    sung: line.text.slice(0, at),
    rest: line.text.slice(at),
    below: lines[i + 1]?.text ?? '',
  }
}
