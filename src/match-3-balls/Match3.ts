import Ball from './Ball'
import Match3Renderer from './Match3Renderer'
import { pickUpRandomValue, transposeField } from './utils'

type Options = {
  columns?: number
  rows?: number
  colors?: number[]
  radius?: number
  gutter?: number
}

export type Cluster = {
  column: number
  row: number
  length: number
  horizontal: boolean
}

export type Movable = {
  x1: number
  y1: number
  x2: number
  y2: number
}

type Field = (Ball | null)[][]

export default class Match3 {
  private field: Field = []
  private renderer: Match3Renderer
  private colors: number[] = []
  private radius: number
  private clusters: Cluster[] = []

  constructor({
    columns = 6,
    rows = 6,
    colors = [0xff7f7f, 0x7fbfff, 0x7fff7f],
    radius = 40,
    gutter = 10,
  }: Options) {
    this.colors = colors
    this.radius = radius
    this.init(columns, rows, gutter)
  }

  private async init(columns: number, rows: number, gutter: number) {
    let done = false
    while (!done) {
      this.field = [...Array(rows)].map(() =>
        [...Array(columns)].map(
          () => new Ball(pickUpRandomValue(this.colors), this.radius),
        ),
      )

      let clusters = this.getClusters()
      while (clusters.length > 0) {
        await this.resolveCurrentFrame()
        clusters = this.getClusters()
      }

      if (this.getMovables().length > 0) {
        done = true
      }
    }
    this.renderer = new Match3Renderer(this.field, this.radius, gutter)
    this.renderer.on('swap', async (b1, b2) => {
      this.swapBalls(b1, b2)
      let clusters = this.getClusters()
      while (clusters.length > 0) {
        await this.resolveCurrentFrame()
        await this.renderer.updateBallPositions()
        clusters = this.getClusters()
      }
    })
  }

  public destroy() {
    this.renderer.destroy()
  }

  public getField(): Readonly<Field> {
    return this.field
  }

  private swapByCoordinates(x1: number, y1: number, x2: number, y2: number) {
    ;[this.field[y1][x1], this.field[y2][x2]] = [
      this.field[y2][x2],
      this.field[y1][x1],
    ]
  }

  private drySwapByCoordinates(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    field: Field = this.field,
  ): Field {
    return field.map((row, rowIndex) =>
      row.map((cell, columnIndex) => {
        if (rowIndex === y1 && columnIndex === x1) {
          return field[y2][x2]
        } else if (rowIndex === y2 && columnIndex === x2) {
          return field[y1][x1]
        }
        return cell
      }),
    )
  }

  private swapBalls(ball1: Ball, ball2: Ball) {
    const coordinate1 = this.renderer.getBallCoordinate(ball1)!
    const coordinate2 = this.renderer.getBallCoordinate(ball2)!
    this.swapByCoordinates(
      coordinate1.column,
      coordinate1.row,
      coordinate2.column,
      coordinate2.row,
    )
  }

  private getUnidirectionalClusters(
    field: Field,
    horizontal: boolean = true,
  ): Cluster[] {
    const targetField = horizontal ? field : transposeField(field)
    return targetField.reduce<Cluster[]>((clusters, row, rowIndex) => {
      let mathces = 1
      const rowClusters = row.reduce<Cluster[]>(
        (_clusters, ball, columnIndex) => {
          let done = false
          const nextBall = row[columnIndex + 1]
          if (ball && nextBall && ball.color === nextBall.color) {
            mathces += 1
          } else {
            done = true
          }
          if (done) {
            if (mathces >= 3) {
              let column = columnIndex + 1 - mathces
              let row = rowIndex
              if (!horizontal) {
                ;[column, row] = [row, column]
              }
              const cluster: Cluster = {
                column,
                row,
                length: mathces,
                horizontal,
              }
              mathces = 1
              return [..._clusters, cluster]
            }
            mathces = 1
          }

          return _clusters
        },
        [],
      )
      return [...clusters, ...rowClusters]
    }, [])
  }

  public getClusters(field: Field = this.field): Cluster[] {
    const horizontalClusters = this.getUnidirectionalClusters(field)
    const verticalClusters = this.getUnidirectionalClusters(field, false)
    return [...horizontalClusters, ...verticalClusters]
  }

  private getUnidirectionalMovables(horizontal: boolean = true): Movable[] {
    const targetField = horizontal ? this.field : transposeField(this.field)
    return targetField.reduce<Movable[]>((movables, row, rowIndex) => {
      const rowMovables = row.reduce<Movable[]>((_movables, _, columnIndex) => {
        const swappedField = this.drySwapByCoordinates(
          columnIndex,
          rowIndex,
          columnIndex + 1,
          rowIndex,
          targetField,
        )
        const clusters = this.getClusters(swappedField)
        if (clusters.length === 0) {
          return _movables
        }
        const movable: Movable = {
          x1: columnIndex,
          y1: rowIndex,
          x2: columnIndex + 1,
          y2: rowIndex,
        }
        if (!horizontal) {
          ;[movable.x1, movable.y1] = [movable.y1, movable.x1]
          ;[movable.x2, movable.y2] = [movable.y2, movable.x2]
        }
        return [..._movables, movable]
      }, [])
      return [...movables, ...rowMovables]
    }, [])
  }

  private getMovables(): Movable[] {
    const horizontalMovables = this.getUnidirectionalMovables()
    const verticalMovables = this.getUnidirectionalMovables(false)
    return [...horizontalMovables, ...verticalMovables]
  }

  private removeClusters() {
    return new Promise(resolve => {
      const clusters = this.getClusters()
      const stack: Promise<void>[] = []
      clusters.forEach(cluster => {
        if (cluster.horizontal) {
          for (
            let column = cluster.column;
            column < cluster.column + cluster.length;
            column++
          ) {
            const ball = this.field[cluster.row][column]
            if (ball) {
              const promise = this.renderer?.removeBall(ball)
              stack.push(promise)
            }
            this.field[cluster.row][column] = null
          }
        } else {
          for (
            let row = cluster.row;
            row < cluster.row + cluster.length;
            row++
          ) {
            const ball = this.field[row][cluster.column]
            if (ball) {
              const promise = this.renderer?.removeBall(ball)
              stack.push(promise)
            }
            this.field[row][cluster.column] = null
          }
        }
      })
      Promise.all(stack).then(resolve)
    })
  }

  private async shift() {
    await this.removeClusters()
    const rowLength = this.field.length
    const transposedField = transposeField(this.field)
    const closedTransposedField = transposedField.map(column =>
      column.filter(cell => cell !== null),
    )
    const filledTransposedField: Field = closedTransposedField.map(column => {
      const closedRowLength = column.length
      const delta = rowLength - closedRowLength
      if (delta === 0) {
        return column
      }
      return [...Array(delta).fill(null), ...column]
    })
    const shiftedField = transposeField(filledTransposedField)
    this.setField(shiftedField)
  }

  private async resolveCurrentFrame() {
    await this.shift()
    this.setField(
      this.field.map(row =>
        row.map(
          ball => ball || new Ball(pickUpRandomValue(this.colors), this.radius),
        ),
      ),
    )
  }

  private setField(field: Field) {
    this.field = field
    if (this.renderer) {
      this.renderer.viewField = field
    }
  }
}
