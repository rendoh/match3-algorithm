import Match3 from './Match3'

jest.mock('pixi.js')

describe('test', () => {
  test('test', () => {
    const match3 = new Match3()
    expect(match3).toBe(match3)
  })
})
