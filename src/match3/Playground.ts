export type Field = (number | null)[][]

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

/**
 * 行列を入れ替えたフィールドを返す
 */
export function transposeField(field: Field): Field {
  return field[0].map((_, columnIndex) => field.map(row => row[columnIndex]))
}

function getRandomInt(max: number): number {
  return Math.floor(Math.random() * max)
}

export default class Playground {
  private field: Field = []

  public static createManually(field: Field): Playground {
    const playground = new Playground(field.length, field[0].length)
    playground.field = field
    return playground
  }

  constructor(columns: number, rows: number, max: number = 5) {
    if (max < 4) {
      throw new RangeError('The `max` argument must be more than 3.')
    }
    this.createField(columns, rows, max)
  }

  private createField(columns: number, rows: number, max: number) {
    for (let row = 0; row < rows; row++) {
      this.field[row] = []
      for (let column = 0; column < columns; column++) {
        this.field[row][column] = getRandomInt(max)
      }
    }
  }

  public swap(x1: number, y1: number, x2: number, y2: number) {
    ;[this.field[y1][x1], this.field[y2][x2]] = [
      this.field[y2][x2],
      this.field[y1][x1],
    ]
  }

  public drySwap(
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

  public getField(): Readonly<Field> {
    return this.field
  }

  private getUnidirectionalClusters(
    field: Field,
    horizontal: boolean = true,
  ): Cluster[] {
    const targetField = horizontal ? field : transposeField(field)
    return targetField.reduce<Cluster[]>((clusters, row, rowIndex) => {
      let mathces = 1
      const rowClusters = row.reduce<Cluster[]>(
        (_clusters, cell, columnIndex) => {
          let done = false
          const nextCell = row[columnIndex + 1]
          if (typeof nextCell === 'number' && cell === nextCell) {
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
        const swappedField = this.drySwap(
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

  public getMovables(): Movable[] {
    const horizontalMovables = this.getUnidirectionalMovables()
    const verticalMovables = this.getUnidirectionalMovables(false)
    return [...horizontalMovables, ...verticalMovables]
  }

  private removeClusters() {
    const clusters = this.getClusters()
    clusters.forEach(cluster => {
      if (cluster.horizontal) {
        for (
          let column = cluster.column;
          column < cluster.column + cluster.length;
          column++
        ) {
          this.field[cluster.row][column] = null
        }
      } else {
        for (let row = cluster.row; row < cluster.row + cluster.length; row++) {
          this.field[row][cluster.column] = null
        }
      }
    })
  }

  public shift() {
    this.removeClusters()
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
    this.field = shiftedField
  }
}
