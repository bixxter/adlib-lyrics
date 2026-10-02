import { expect, test } from 'claude-code/testing'

const PROPS = {
  hasSurvey: false,
  isWorking: false,
  maxRows: 12,
  bodyColumns: 80,
  scroll: { offset: 0, bodyRows: 11, contentRows: 0 },
} as never

test('the mascot dances beside the lyrics on the terminal; desktop gets the lyrics alone', async ($, on) => {
  // Beneath the plugin the test stands in for the engine's state; the kit unwraps one `value`.
  const band = { pose: 1, above: 'Tell me why you did it', sung: 'Every', rest: ' dream', below: '' }
  on('state.get', () => ({ value: { value: band, version: 1 } }))
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ plugin: 'adlib-lyrics', surface, component: 'AbovePrompt', props: PROPS })
    expect((await ui.find({ type: 'Text', text: 'Every dream' }))?.text).toBe('Every dream')
    expect((await ui.find({ key: 'mascot' }))?.type).toBe(surface === 'terminal' ? 'Raster' : undefined)
    await ui.unmount()
  }
})

const texts = async (ui: { findAll: (q: { type: 'Text' }) => Promise<{ text?: string }[]> }) =>
  (await ui.findAll({ type: 'Text' })).map(found => found.text)

test('lyrics: line without the mascot is one row', { options: { lyrics: 'line', mascot: false } }, async ($, on) => {
  on('state.get', () => ({ value: { value: { pose: 0, above: '', sung: 'Every', rest: ' dream', below: '' }, version: 1 } }))
  const ui = await $.ui.mount({ plugin: 'adlib-lyrics', surface: 'terminal', component: 'AbovePrompt', props: PROPS })
  expect(await ui.find({ key: 'mascot' })).toBeUndefined()
  expect((await texts(ui))[0]).toBe('Every dream')
  expect(await texts(ui)).toHaveLength(3) // the row and its two styled runs, no rows above or below
})

test('lyrics: off leaves the mascot dancing alone', { options: { lyrics: 'off' } }, async ($, on) => {
  on('state.get', () => ({ value: { value: { pose: 0, above: 'a', sung: 'Every', rest: ' dream', below: 'b' }, version: 1 } }))
  const ui = await $.ui.mount({ plugin: 'adlib-lyrics', surface: 'terminal', component: 'AbovePrompt', props: PROPS })
  expect((await ui.find({ key: 'mascot' }))?.type).toBe('Raster')
  expect(await texts(ui)).toEqual([])
})
