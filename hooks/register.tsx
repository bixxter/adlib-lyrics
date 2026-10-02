import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { AdlibBand } from '../types'
import { lineAt, pick, type Line } from './lrc'
import { MASCOT, MASCOT_COLUMNS, MASCOT_ROWS } from './mascot'

const band = atom({ plugin: 'adlib-lyrics', key: 'band' } as const, null)

// The app's own words for a song the mascot dances to instead.
const CAPTIONS = {
  instrumental: ["It's an instrumental", "…so let's dance"],
  missing: ["Sorry, couldn't find the lyrics", '…but I can dance for you'],
  offline: ["Sorry, I'm offline", '…but I can dance for you'],
} as const

// Prints one JSON line a second while Music or Spotify plays (every 3 s otherwise) and
// never launches either app. Artist and duration are read only when the title changes:
// every Apple Event costs Spotify ~18 ms. Spotify's duration is in ms, Music's in seconds.
const NOW_PLAYING = `
let last = {}
const read = app => {
  const player = Application(app)
  if (!player.running() || player.playerState() !== 'playing') return null
  const track = player.currentTrack
  const name = track.name()
  if (name !== last.name || app !== last.app) {
    const d = track.duration()
    last = { app, name, artist: track.artist(), duration: app === 'Spotify' ? d / 1000 : d }
  }
  return Object.assign({}, last, { position: player.playerPosition() })
}
while (true) {
  let out = null
  for (const app of ['Spotify', 'Music']) {
    try { out = read(app) } catch (e) { if (e.errorNumber === -1743) out = { denied: app } }
    if (out) break
  }
  console.log(JSON.stringify(out))
  delay(out ? 1 : 3)
}
`

type Playing = { app: string; name: string; artist: string; duration: number; position: number }
type Polled = Playing | { denied: string } | null

export const register: Register = (on, options) => {
  const layout = options.lyrics // 'stack' | 'line' | 'off', from /config; a change reloads the mod
  const isDancing = options.mascot !== false
  if (layout === 'off' && !isDancing) return // nothing to draw, so nothing to poll

  on('session.start', async ($, e, next) => {
    const started = await next(e)
    let playing: Playing | null = null
    let polledAt = 0
    let track = ''
    let title = ''
    let lyrics: Line[] | 'instrumental' | 'missing' | 'offline' | null = null // null: fetching
    let shown = 'null'
    let isWarned = false

    const show = (value: AdlibBand | null) => {
      const key = JSON.stringify(value)
      if (key === shown) return
      shown = key
      void update($, band, () => value)
    }

    const fetchLyrics = async (song: Playing, key: string) => {
      const query = new URLSearchParams({ track_name: song.name, artist_name: song.artist })
      const res = await $.http
        .fetch(`https://lrclib.net/api/search?${query}`, {
          headers: { 'User-Agent': 'adlib-lyrics (Claude Code mod; https://tryadlib.web.app)' },
        })
        .catch(() => null)
      if (key !== track) return
      try {
        lyrics = res?.ok ? (pick(JSON.parse(res.text), song.duration) ?? 'missing') : 'offline'
      } catch {
        lyrics = 'offline' // a 200 that isn't JSON: a captive portal, a proxy
      }
      if (Array.isArray(lyrics) && !(await $.store.get('toldAboutAdlib'))) {
        await $.store.set('toldAboutAdlib', true)
        $.ui.toast('Lyrics by LRCLIB · Adlib puts them on your desktop: tryadlib.web.app', {
          timeoutMs: 8000,
        })
      }
    }

    const onPoll = async (polled: Polled) => {
      if (polled && 'denied' in polled) {
        if (!isWarned) {
          isWarned = true
          $.ui.toast(
            `adlib-lyrics: allow your terminal to control ${polled.denied} in System Settings › Privacy & Security › Automation`,
            { timeoutMs: 10000 },
          )
        }
        return
      }
      playing = polled
      polledAt = await $.clock.now()
      // Spotify sometimes reports an empty title mid-song: keep the song we have.
      if (!polled?.name || `${polled.artist}\n${polled.name}` === track) return
      track = `${polled.artist}\n${polled.name}`
      title = polled.artist ? `${polled.name} · ${polled.artist}` : polled.name
      lyrics = null
      // No artist (radio, ads) would match a stranger's song.
      if (polled.artist && layout !== 'off') void fetchLyrics(polled, track)
    }

    void (async () => {
      let buffer = ''
      const player = $.process.spawn({ argv: ['/usr/bin/osascript', '-l', 'JavaScript', '-e', NOW_PLAYING] })
      try {
        for await (const { text } of player) {
          const rows = (buffer + text).split('\n')
          buffer = rows.pop() ?? ''
          for (const row of rows) {
            try {
              await onPoll(JSON.parse(row))
            } catch {
              // osascript's own warnings are not JSON
            }
          }
        }
      } catch {
        // No osascript: not a Mac. The band simply never shows.
      } finally {
        playing = null
      }
    })()

    $.clock.every(250, async () => {
      if (!playing) return show(null)
      const t = playing.position + ((await $.clock.now()) - polledAt) / 1000
      // ponytail: dances at a fixed ~120 bpm on the song clock, as the app does; real tempo needs audio analysis.
      const pose = Math.floor(t * 2) & 1
      const words = Array.isArray(lyrics) ? lineAt(lyrics, t, playing.duration) : null
      const caption = typeof lyrics === 'string' ? CAPTIONS[lyrics] : null
      show({
        pose,
        ...(words ??
          (caption
            ? // "…but I can dance for you" only while the mascot is there to dance
              { above: title, sung: caption[0], rest: '', below: isDancing ? caption[1] : '' }
            : { above: '', sung: '', rest: title, below: '' })),
        ...(layout === 'line' ? { above: '', below: '' } : {}),
      })
    })

    return started
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const words = await read($, band)
    const hasMascot = isDancing && e.surface === 'terminal' // desktop has no Raster
    if (!words || e.props.hasSurvey || (layout === 'off' && !hasMascot)) return next(e)
    const { Box, Text } = $.ui.resolve(e)
    const isTall = layout === 'stack' || hasMascot // one row only for a bare line
    const text = layout !== 'off' && (
      <Box flexDirection="column" width={Math.max(1, e.props.bodyColumns - (hasMascot ? MASCOT_COLUMNS + 2 : 0))}>
        {isTall && <Text dimColor wrap="truncate-end">{words.above || ' '}</Text>}
        <Text wrap="truncate-end">
          <Text bold>{words.sung}</Text>
          <Text dimColor>{words.rest || (words.sung ? '' : ' ')}</Text>
        </Text>
        {isTall && <Text dimColor wrap="truncate-end">{words.below || ' '}</Text>}
      </Box>
    )
    if (e.surface !== 'terminal' || !hasMascot) return text || next(e)
    const { Raster } = $.ui.resolve(e)

    return (
      <Box>
        <Raster key="mascot" columns={MASCOT_COLUMNS} rows={MASCOT_ROWS} cells={MASCOT[words.pose] ?? MASCOT[0]!} />
        {text && <Box marginLeft={2}>{text}</Box>}
      </Box>
    )
  })
}
