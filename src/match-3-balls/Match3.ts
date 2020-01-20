import Ball from './Ball'
import Match3Renderer from './Match3Renderer'
import { pickUpRandomValue } from './utils'

type Options = {
  columns?: number
  rows?: number
  colors?: number[]
  radius?: number
  gutter?: number
}

export default class Match3 {
  private field: Ball[][] = []
  private renderer: Match3Renderer
  constructor({
    columns = 6,
    rows = 6,
    colors = [0xff7f7f, 0x7fbfff, 0x7fff7f, 0xffbf7f, 0xbf7fff],
    radius = 40,
    gutter = 10,
  }: Options) {
    this.field = [...Array(rows)].map(() =>
      [...Array(columns)].map(
        () => new Ball(pickUpRandomValue(colors), radius),
      ),
    )
    this.renderer = new Match3Renderer(this.field, radius, gutter)
  }

  public destroy() {
    this.renderer.destroy()
  }

  public getField(): Readonly<Ball[][]> {
    return this.field
  }
}
