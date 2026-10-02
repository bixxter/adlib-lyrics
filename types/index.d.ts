/** The three rows beside the mascot; the middle one is `sung` (bold) then `rest` (dim). */
export type AdlibWords = { above: string; sung: string; rest: string; below: string }
export type AdlibBand = AdlibWords & { pose: number }

declare module 'claude-code' {
  interface PluginState {
    'adlib-lyrics': { band: AdlibBand | null }
  }
}
