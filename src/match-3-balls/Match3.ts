import * as PIXI from 'pixi.js'
import TWEEN from '@tweenjs/tween.js'
import Ball from './Ball'

const BALL_GUTTER = 10
const BALL_RADIUS = 40

export default class Match3 {
  private pixiApp = new PIXI.Application({
    width: window.innerWidth,
    height: window.innerHeight,
    antialias: true,
    transparent: false,
    resolution: window.devicePixelRatio,
    autoDensity: true,
    backgroundColor: 0x333333,
  })
  private pixiContainer = new PIXI.Container()
  private field: Ball[][] = []
  constructor(
    private columns: number,
    private rows: number,
    private colors: number[],
  ) {
    this.initField()
    this.initView()
  }

  public destroy() {
    this.pixiApp.destroy()
  }

  private initView() {
    const { pixiContainer, pixiApp } = this
    this.field.forEach((row, rowIndex) => {
      row.forEach((ball, columnIndex) => {
        const gap = BALL_RADIUS * 2 + BALL_GUTTER
        ball.graphics.x = columnIndex * gap
        ball.graphics.y = rowIndex * gap
      })
    })

    pixiContainer.sortableChildren = true
    pixiContainer.x = pixiApp.screen.width / 2
    pixiContainer.y = pixiApp.screen.height / 2
    pixiContainer.pivot.x = pixiContainer.width / 2
    pixiContainer.pivot.y = pixiContainer.height / 2
    pixiApp.stage.addChild(pixiContainer)
    document.body.appendChild(pixiApp.view)
    pixiApp.ticker.add(() => TWEEN.update())
  }

  private initField() {
    const { columns, rows, colors } = this
    const done = false

    // while (!done) {
    this.field = [...Array(rows)].map(() =>
      [...Array(columns)].map(() => this.createBall()),
    )
    // }
  }

  public getField(): Readonly<Ball[][]> {
    return this.field
  }

  private getRandomColor(): number {
    return this.colors[Math.floor(Math.random() * this.colors.length)]
  }

  private createBall(): Ball {
    const ball = new Ball(this.getRandomColor(), BALL_RADIUS)
    this.pixiContainer.addChild(ball.graphics)

    ball.on('dragstart', () => {
      console.log(ball.graphics.x, ball.graphics.y)
    })

    ball.on('dragging', (x, y) => {
      ball.graphics.x = x
      ball.graphics.y = y
    })

    ball.on('dragend', () => {
      ball.resetPosition()
    })

    ball.on('dragging', (x, y) => {
      console.log(x, y)
    })
    return ball
  }

  private getBallPosition(ball): { x: number; y: number } {}
}
