import * as PIXI from 'pixi.js'
import TWEEN from '@tweenjs/tween.js'
import Ball from './Ball'

const BALL_GUTTER = 10
const BALL_RADIUS = 40

const getDistance = (x1: number, y1: number, x2: number, y2: number) =>
  Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))

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
    let swapTargets: Ball[] = []
    let swapped: Ball | null = null

    ball.on('dragstart', () => {
      console.log(ball.graphics.x, ball.graphics.y)
      const ballPosition = this.getBallPosition(ball)
      if (!ballPosition) return
      const { x, y } = ballPosition
      swapTargets = []
      swapTargets.push(this.field[y - 1] && this.field[y - 1][x])
      swapTargets.push(this.field[y + 1] && this.field[y + 1][x])
      swapTargets.push(this.field[y][x + 1])
      swapTargets.push(this.field[y][x - 1])
      swapTargets = swapTargets.filter(ball => !!ball)
    })

    ball.on('dragging', (x, y) => {
      ball.graphics.x = x
      ball.graphics.y = y
    })

    ball.on('dragend', () => {
      ball.resetPosition()
      swapped = null
      swapTargets = []
    })

    ball.on('dragging', (x, y) => {
      swapTargets.forEach(targetBall => {
        const distance = getDistance(
          x,
          y,
          targetBall.graphics.x,
          targetBall.graphics.y,
        )
        if (distance < 50) {
          if (swapped !== targetBall) {
            targetBall.moveTo(
              ball.dragStartPosition.x!,
              ball.dragStartPosition.y!,
              100,
            )
          }
          swapped = targetBall
        } else {
          /**
           * 初期位置と違う位置にいたら、初期位置に戻る
           * TODO: columnIndex, rowIndex から x, y を取得できるようにする
           *
           * 本来の位置と、表示上の位置を分けたほうがよい？
           */
        }
      })
    })
    return ball
  }

  private getBallPosition(ball: Ball): { x: number; y: number } | null {
    for (const [rowIndex, row] of this.field.entries()) {
      for (const [columnIndex, _ball] of row.entries()) {
        if (ball === _ball) {
          return { x: columnIndex, y: rowIndex }
        }
      }
    }
    return null
  }
}
