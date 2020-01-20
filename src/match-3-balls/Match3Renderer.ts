import * as PIXI from 'pixi.js'
import TWEEN from '@tweenjs/tween.js'
import Ball from './Ball'
import { getDistance } from './utils'

type BallPosition = {
  x: number
  y: number
}

type Coordinate = {
  column: number
  row: number
}

type Field = (Ball | null)[][]

type SwapHandler = (b1: Ball, b2: Ball) => void

export default class Match3Renderer {
  private pixiApp = new PIXI.Application({
    width: window.innerWidth,
    height: window.innerHeight,
    antialias: true,
    transparent: false,
    resolution: window.devicePixelRatio,
    autoDensity: true,
    backgroundColor: 0x464646,
  })
  private pixiContainer = new PIXI.Container()
  private staticBallPositions: BallPosition[][] = []
  private swapTargets: Ball[] = []
  private swapTarget: Ball | null = null
  private swapHandlers: SwapHandler[] = []

  constructor(
    public viewField: Field,
    private radius: number,
    private gutter: number,
  ) {
    this.initBalls()
    this.initPixi()
  }

  public destroy() {
    this.pixiApp.view.parentNode?.removeChild(this.pixiApp.view)
    TWEEN.removeAll()
    this.pixiApp.destroy()
  }

  private initBalls() {
    console.log(this.viewField)
    this.viewField.forEach((row, rowIndex) => {
      this.staticBallPositions.push([])
      row.forEach((ball, columnIndex) => {
        if (!ball) return
        const gap = this.radius * 2 + this.gutter
        const x = columnIndex * gap
        const y = rowIndex * gap
        this.staticBallPositions[rowIndex].push({ x, y })
        this.initBall(ball, x, y)
      })
    })
  }

  private initPixi() {
    const { pixiContainer, pixiApp } = this
    pixiContainer.sortableChildren = true
    pixiContainer.x = pixiApp.screen.width / 2 + this.radius
    pixiContainer.y = pixiApp.screen.height / 2 + this.radius
    pixiContainer.pivot.x = pixiContainer.width / 2
    pixiContainer.pivot.y = pixiContainer.height / 2
    pixiApp.stage.addChild(pixiContainer)
    document.body.appendChild(pixiApp.view)
    pixiApp.ticker.add(() => TWEEN.update())
  }

  private handleDragging(ball: Ball) {
    ball.on('dragstart', () => {
      const coordinate = this.getBallCoordinate(ball)
      if (!coordinate) return
      const { column, row } = coordinate
      const targets: (Ball | null)[] = [
        this.viewField[row - 1] && this.viewField[row - 1][column],
        this.viewField[row + 1] && this.viewField[row + 1][column],
        this.viewField[row][column + 1],
        this.viewField[row][column - 1],
      ]
      this.swapTargets = targets.filter<Ball>((ball): ball is Ball => !!ball)
    })
    ball.on('dragging', (x, y) => {
      ball.graphics.x = x
      ball.graphics.y = y
      this.swapTarget = null
      this.swapTargets.forEach(targetBall => {
        const { row, column } = this.getBallCoordinate(targetBall)!
        const staticPosition = this.staticBallPositions[row][column]
        const distance = getDistance(x, y, staticPosition.x, staticPosition.y)
        if (distance < this.radius) {
          const { row, column } = this.getBallCoordinate(ball)!
          const { x, y } = this.staticBallPositions[row][column]
          targetBall.moveTo(x, y, 100)
          this.swapTarget = targetBall
        } else {
          targetBall.moveTo(staticPosition.x, staticPosition.y, 100)
        }
      })
    })
    ball.on('dragend', () => {
      const coordinate = this.getBallCoordinate(ball)
      if (!coordinate) return
      if (this.swapTarget) {
        const coordinate = this.getBallCoordinate(this.swapTarget)
        const position = this.staticBallPositions[coordinate!.row][
          coordinate!.column
        ]
        ball.moveTo(position.x, position.y)
        this.swapHandlers.forEach(callback => {
          callback(ball, this.swapTarget!)
        })
      } else {
        // reset position
        const position = this.staticBallPositions[coordinate.row][
          coordinate.column
        ]
        ball.moveTo(position.x, position.y, 300, TWEEN.Easing.Elastic.Out)
      }

      this.swapTargets = []
      this.swapTarget = null
    })
  }

  public getBallCoordinate(ball: Ball): Coordinate | null {
    for (const [rowIndex, row] of this.viewField.entries()) {
      for (const [columnIndex, _ball] of row.entries()) {
        if (ball === _ball) {
          return { column: columnIndex, row: rowIndex }
        }
      }
    }
    return null
  }

  public on(eventType: 'swap', callback: SwapHandler) {
    if (eventType === 'swap') {
      this.swapHandlers.push(callback)
    }
  }

  public off(eventType: 'swap', callback: SwapHandler) {
    if (eventType === 'swap') {
      this.swapHandlers = this.swapHandlers.filter(cb => cb !== callback)
    }
  }

  public updateBallPositions() {
    return new Promise(resolve => {
      const promises = this.viewField.map(row => {
        return row.map(ball => {
          if (!ball) return
          const coordinate = this.getBallCoordinate(ball)
          if (!coordinate) return
          const position = this.staticBallPositions[coordinate.row][
            coordinate.column
          ]
          return ball.moveTo(position.x, position.y)
        })
      })

      Promise.all(promises.flat(Infinity)).then(resolve)
    })
  }

  public async removeBall(ball: Ball) {
    await ball.remove()
    this.pixiContainer.removeChild(ball.graphics)
  }

  public initBall(ball: Ball, x: number, y: number) {
    Object.assign(ball.graphics, { x, y })
    this.handleDragging(ball)
    this.pixiContainer.addChild(ball.graphics)
  }

  public async addBall(ball: Ball, emptyLength: number[]) {
    const { column, row } = this.getBallCoordinate(ball)!
    const { x, y } = this.staticBallPositions[row][column]
    this.initBall(
      ball,
      x,
      y - emptyLength[column] * this.radius * 2 + this.gutter,
    )
  }

  private runSpoon(spoon: Ball) {
    new TWEEN.Tween(spoon.graphics)
      .to({ x: 0 }, 100)
      .easing(TWEEN.Easing.Linear.None)
      .start()
  }

  public complete(spoon: Ball) {
    this.runSpoon(spoon)
    this.viewField.forEach(row => {
      row.forEach(ball => {
        if (ball && ball !== spoon) {
          this.removeBall(ball)
        }
      })
    })
  }
}
