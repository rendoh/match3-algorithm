import Ball from './Ball'

type Cell = Ball | null
type Columns = Cell[]
type Rows = Columns[]

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

export default class Field {
  public rows: (Ball | null)[][] = []
  private clusters: Cluster[] = []
  private movables: Movable[] = []
  constructor(
    private columnLength: number,
    private rowLength: number,
    private colors: number[],
    private radius: number,
  ) {
    this.initialize()
  }

  public initialize() {
    let done = false
    while (!done) {
      this.rows = [...Array(this.rowLength)].map(() =>
        [...Array(this.columnLength)].map(
          () => new Ball(this.getRandomColor(), this.radius),
        ),
      )
      this.updateClusters()
      while (this.clusters.length > 0) {
        this.resolveClusters()
        this.shift()
        this.addBalls()
      }

      if (this.isMovable()) {
        done = true
      }
    }
  }

  private getRandomColor(): number {
    return this.colors[Math.floor(Math.random() * this.colors.length)]
  }

  public updateClusters() {
    this.clusters = getClusters(this.rows)
    this.updateMovables()
  }

  private updateMovables() {
    this.movables = getMovables(this.rows)
  }

  public isMovable() {
    return this.movables.length > 0
  }

  public resolveClusters(): Ball[] {
    const removedBalls: Ball[] = []
    this.clusters.forEach(cluster => {
      if (cluster.horizontal) {
        for (
          let column = cluster.column;
          column < cluster.column + cluster.length;
          column++
        ) {
          const cell = this.rows[cluster.row][column]
          if (cell) {
            removedBalls.push(cell)
          }
          this.rows[cluster.row][column] = null
        }
      } else {
        for (let row = cluster.row; row < cluster.row + cluster.length; row++) {
          const cell = this.rows[row][cluster.column]
          if (cell) {
            removedBalls.push(cell)
          }
          this.rows[row][cluster.column] = null
        }
      }
    })
    return removedBalls
  }

  public shift() {
    const rowLength = this.rows.length
    const transposedRows = transposeField(this.rows)
    const closedTransposedRows = transposedRows.map(column =>
      column.filter(cell => cell !== null),
    )
    const filledTransposedField: Rows = closedTransposedRows.map(column => {
      const closedRowLength = column.length
      const delta = rowLength - closedRowLength
      if (delta === 0) {
        return column
      }
      return [...Array(delta).fill(null), ...column]
    })
    this.rows = transposeField(filledTransposedField)
  }

  public addBalls(): Ball[] {
    const addedBalls: Ball[] = []
    this.rows = this.rows.map(row =>
      row.map(cell => {
        if (cell) return cell
        const newBall = new Ball(this.getRandomColor(), this.radius)
        addedBalls.push(newBall)
        return newBall
      }),
    )
    this.updateClusters()
    return addedBalls
  }

  public swap(x1: number, y1: number, x2: number, y2: number) {
    ;[this.rows[y1][x1], this.rows[y2][x2]] = [
      this.rows[y2][x2],
      this.rows[y1][x1],
    ]
    this.updateClusters()
  }

  public getClusters(): Readonly<Cluster[]> {
    return this.clusters
  }

  public getAllBalls(): Ball[] {
    return this.rows
      .map(row => row.map(cell => cell))
      .flat(Infinity)
      .filter(cell => cell instanceof Ball)
  }
}

function transposeField<T>(array: T[][]): T[][] {
  return array[0].map((_, columnIndex) => array.map(row => row[columnIndex]))
}

function getSwappedField(
  rows: Rows,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): Rows {
  return rows.map((row, rowIndex) =>
    row.map((cell, columnIndex) => {
      if (rowIndex === y1 && columnIndex === x1) {
        return rows[y2][x2]
      } else if (rowIndex === y2 && columnIndex === x2) {
        return rows[y1][x1]
      }
      return cell
    }),
  )
}

function getUnidirectionalClusters(rows: Rows, horizontal: boolean = true) {
  const targetRows = horizontal ? rows : transposeField(rows)
  return targetRows.reduce<Cluster[]>((clusters, row, rowIndex) => {
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

function getClusters(rows: Rows): Cluster[] {
  const horizontalClusters = getUnidirectionalClusters(rows)
  const verticalClusters = getUnidirectionalClusters(rows, false)
  return [...horizontalClusters, ...verticalClusters]
}

function getUnidirectionalMovables(
  rows: Rows,
  horizontal: boolean = true,
): Movable[] {
  const targetRows = horizontal ? rows : transposeField(rows)
  return targetRows.reduce<Movable[]>((movables, row, rowIndex) => {
    const rowMovables = row.reduce<Movable[]>((_movables, _, columnIndex) => {
      const swappedField = getSwappedField(
        targetRows,
        columnIndex,
        rowIndex,
        columnIndex + 1,
        rowIndex,
      )
      const clusters = getClusters(swappedField)
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

function getMovables(rows: Rows): Movable[] {
  const horizontalMovables = getUnidirectionalMovables(rows)
  const verticalMovables = getUnidirectionalMovables(rows, false)
  return [...horizontalMovables, ...verticalMovables]
}
