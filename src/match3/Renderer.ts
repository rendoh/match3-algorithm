import { Application, Container } from 'pixi.js'
import TWEEN from '@tweenjs/tween.js'
import Field from './Field'
import Ball from './Ball'

type Position = {
  x: number
  y: number
}

type Coordinate = {
  column: number
  row: number
}

type SwapHandler = (x1: number, y1: number, x2: number, y2: number) => void

/**
 * 2点間の距離を求める
 */
export const getDistance = (x1: number, y1: number, x2: number, y2: number) =>
  Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))

export default class Renderer {
  private app: Application
  private container = new Container()
  private staticCellPositions: Position[][] = []
  private swappables: Ball[] = []
  private swapTarget: Ball | null = null
  private swapHandlers: SwapHandler[] = []

  constructor(
    private field: Field,
    private radius: number,
    private gutter: number,
    backgroundColor: number = 0xffffff,
  ) {
    this.app = new Application({
      width: window.innerWidth,
      height: window.innerHeight,
      antialias: true,
      transparent: false,
      resolution: window.devicePixelRatio,
      autoDensity: true,
      backgroundColor,
    })
    this.initStaticPositions()
    this.initializeCells()
    this.initPixi()
  }

  private initPixi() {
    this.container.sortableChildren = true
    this.container.x = this.app.screen.width / 2
    this.container.y = this.app.screen.height / 2
    this.container.pivot.x = this.container.width / 2
    this.container.pivot.y = this.container.height / 2
    this.app.stage.addChild(this.container)
    this.app.ticker.add(() => TWEEN.update())
  }

  private initStaticPositions() {
    this.staticCellPositions = this.field.rows.map((row, rowIndex) => {
      return row.map((_, columnIndex) => {
        const gap = this.radius * 2 + this.gutter
        const x = columnIndex * gap
        const y = rowIndex * gap
        return { x, y }
      })
    })
  }

  public initializeCells() {
    this.container.removeChildren()
    this.field.rows.forEach((row, rowIndex) => {
      row.forEach((cell, columnIndex) => {
        if (!cell) return
        const position = this.getStaticPositionByCoordinate(
          columnIndex,
          rowIndex,
        )
        this.initBall(cell, position)
        cell.appear()
      })
    })
  }

  public getView() {
    return this.app.view
  }

  private initBall(ball: Ball, position: Position) {
    Object.assign(ball.graphics, position)
    this.container.addChild(ball.graphics)
    this.handleDragging(ball)
  }

  private handleDragging(ball: Ball) {
    ball
      .on('dragstart', () => {
        const coordinate = this.getCoordinate(ball)
        if (!coordinate) return
        const { column, row } = coordinate
        this.swappables = [
          this.field.rows[row - 1] && this.field.rows[row - 1][column],
          this.field.rows[row + 1] && this.field.rows[row + 1][column],
          this.field.rows[row][column + 1],
          this.field.rows[row][column - 1],
        ].filter<Ball>((ball): ball is Ball => !!ball)
      })
      .on('dragging', (x, y) => {
        ball.graphics.x = x
        ball.graphics.y = y
        this.swapTarget = null
        this.swappables.forEach(swappable => {
          const swappableStaticPosition = this.getStaticPositionByBall(
            swappable,
          )
          if (!swappableStaticPosition) return
          const distance = getDistance(
            x,
            y,
            swappableStaticPosition.x,
            swappableStaticPosition.y,
          )
          if (distance < this.radius) {
            const draggingBallStaticPosition = this.getStaticPositionByBall(
              ball,
            )
            if (!draggingBallStaticPosition) return
            swappable.moveTo(
              draggingBallStaticPosition.x,
              draggingBallStaticPosition.y,
            )
            this.swapTarget = swappable
          } else {
            swappable.moveTo(
              swappableStaticPosition.x,
              swappableStaticPosition.y,
            )
          }
        })
      })
      .on('dragend', () => {
        if (this.swapTarget) {
          const swappedStaticPosition = this.getStaticPositionByBall(
            this.swapTarget,
          )
          if (!swappedStaticPosition) return
          ball.moveTo(swappedStaticPosition.x, swappedStaticPosition.y)
          const swapTargetCoordinate = this.getCoordinate(this.swapTarget)
          const ballCoordinate = this.getCoordinate(ball)
          if (swapTargetCoordinate && ballCoordinate) {
            this.swapHandlers.forEach(callback => {
              callback(
                ballCoordinate.column,
                ballCoordinate.row,
                swapTargetCoordinate.column,
                swapTargetCoordinate.row,
              )
            })
          }
        } else {
          const dragStartPosition = this.getStaticPositionByBall(ball)
          if (!dragStartPosition) return
          ball.moveTo(
            dragStartPosition.x,
            dragStartPosition.y,
            450,
            TWEEN.Easing.Elastic.Out,
          )
        }

        this.swappables = []
        this.swapTarget = null
      })
  }

  private getCoordinate(ball: Ball): Coordinate | null {
    for (const [rowIndex, row] of this.field.rows.entries()) {
      for (const [columnIndex, cell] of row.entries()) {
        if (ball === cell) {
          return { column: columnIndex, row: rowIndex }
        }
      }
    }
    return null
  }

  private getStaticPositionByCoordinate(columnIndex: number, rowIndex: number) {
    return this.staticCellPositions[rowIndex][columnIndex]
  }

  private getStaticPositionByBall(ball: Ball): Position | null {
    const coordinate = this.getCoordinate(ball)
    if (!coordinate) return null
    const { column, row } = coordinate
    return this.getStaticPositionByCoordinate(column, row)
  }

  public on(eventType: 'swap', callback: SwapHandler) {
    if (eventType === 'swap') {
      this.swapHandlers.push(callback)
    }
  }

  public off(eventType: 'swap', callback: SwapHandler) {
    if (eventType === 'swap') {
      this.swapHandlers = this.swapHandlers.filter(
        _callback => _callback !== callback,
      )
    }
  }

  public updateBallPositions() {
    return new Promise(resolve => {
      const promises = this.field.rows.map(row => {
        return row.map(cell => {
          if (!cell) return
          const position = this.getStaticPositionByBall(cell)
          if (!position) return
          return cell.moveTo(position.x, position.y)
        })
      })

      Promise.all(promises.flat(Infinity)).then(resolve)
    })
  }

  public addBalls(balls: Ball[], deltas: number[]) {
    const gap = this.radius * 2 + this.gutter
    return new Promise(resolve => {
      Promise.all(
        this.field.rows
          .map(row => {
            return row.map((cell, cellIndex) => {
              if (cell && balls.includes(cell)) {
                const delta = deltas[cellIndex]
                const position = this.getStaticPositionByBall(cell)
                if (!position) return
                const shiftedPosition = {
                  x: position.x,
                  y: position.y - delta * gap,
                }
                this.initBall(cell, shiftedPosition)
                cell.appear()
                return cell.moveTo(position.x, position.y)
              }
            })
          })
          .flat(Infinity),
      ).then(resolve)
    })
  }

  public removeBalls(balls: Ball[]) {
    return new Promise(resolve => {
      Promise.all(
        balls.map(async ball => {
          await ball.remove()
          this.container.removeChild(ball.graphics)
        }),
      ).then(resolve)
    })
  }
}
