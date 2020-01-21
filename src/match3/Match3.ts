import Field from './Field'
import Renderer from './Renderer'

type Match3Options = {
  columns?: number
  rows?: number
  colors?: number[]
  radius?: number
  gutter?: number
  backgroundColor?: number
  el?: HTMLElement
}

export default class Match3 {
  private field: Field
  private renderer: Renderer
  constructor({
    columns = 6,
    rows = 5,
    colors = [0xff7f7f, 0x7fbfff, 0x7fff7f],
    radius = 40,
    gutter = 10,
    backgroundColor,
    el,
  }: Match3Options = {}) {
    this.field = new Field(columns, rows, colors, radius)
    this.renderer = new Renderer(
      this.field,
      radius,
      gutter,
      backgroundColor,
      el,
    )

    this.renderer.on('swap', async (x1, y1, x2, y2) => {
      this.field.swap(x1, y1, x2, y2)
      this.deactivate()
      if (this.field.getClusters().length === 0) {
        this.field.swap(x1, y1, x2, y2)
        this.renderer.updateBallPositions()
      } else {
        while (this.field.getClusters().length > 0) {
          const removedBalls = this.field.resolveClusters()
          await this.renderer.removeBalls(removedBalls)
          const deltas = this.field.shift()
          const addedBalls = this.field.addBalls()
          await Promise.all([
            this.renderer.updateBallPositions(),
            this.renderer.addBalls(addedBalls, deltas),
          ])
        }
        if (!this.field.isMovable()) {
          const result = confirm('ゲームオーバーです。リセットしますか？')
          if (result) {
            this.reset()
          }
        }
      }
      this.activate()
    })
  }

  private mount(el: HTMLElement) {
    el.appendChild(this.getView())
  }

  public getView() {
    return this.renderer.getView()
  }

  public async reset() {
    await this.renderer.removeBalls(this.field.getAllBalls())
    this.field.initialize()
    this.renderer.initializeCells()
  }

  private deactivate() {
    this.getView().style.pointerEvents = 'none'
  }

  private activate() {
    this.getView().style.pointerEvents = ''
  }
}
