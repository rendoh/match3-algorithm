export type Field = number[][]

export type Cluster = {
  column: number
  row: number
  length: number
  horizontal: boolean
}

/**
 * 行列を入れ替えたフィールドを返す
 */
export function transposeField(field: Field): Field {
  return field[0].map((_, columnIndex) => field.map(row => row[columnIndex]))
}

function _getClusters(field: Field, horizontal: boolean = true): Cluster[] {
  const targetField = horizontal ? field : transposeField(field)
  return targetField.reduce<Cluster[]>((clusters, row, rowIndex) => {
    let mathces = 1
    const rowClusters = row.reduce<Cluster[]>(
      (_clusters, column, columnIndex) => {
        let done = false
        const nextColumn = row[columnIndex + 1]
        if (typeof nextColumn === 'number' && column === nextColumn) {
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

export function getClusters(field: Field): Cluster[] {
  const horizontalClusters = _getClusters(field)
  const verticalClusters = _getClusters(field, false)
  return [...horizontalClusters, ...verticalClusters]
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
        this.field[row][column] = Math.floor(Math.random() * max)
      }
    }
  }

  public swap(x1: number, y1: number, x2: number, y2: number) {
    ;[this.field[y1][x1], this.field[y2][x2]] = [
      this.field[y2][x2],
      this.field[y1][x1],
    ]
  }

  public drySwap(x1: number, y1: number, x2: number, y2: number): Field {
    return this.field.map((row, rowIndex) =>
      row.map((column, columnIndex) => {
        if (rowIndex === y1 && columnIndex === x1) {
          return this.field[y2][x2]
        } else if (rowIndex === y2 && columnIndex === x2) {
          return this.field[y1][x1]
        }
        return column
      }),
    )
  }

  public getField(): Readonly<Field> {
    return this.field
  }
}
