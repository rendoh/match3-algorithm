import {
  transposeField,
  Field,
  FieldCell,
  getClusters,
  Cluster,
} from './Playground'

function createFieldByNumbers(source: number[][]): Field {
  return source.map(row => row.map(number => new FieldCell(number)))
}

function translateFieldToNumbers(source: Field): number[][] {
  return source.map(row => row.map(fieldCell => fieldCell.type))
}

describe('transposeField', () => {
  test('非破壊で行列を入れ替える', () => {
    const field: Field = createFieldByNumbers([
      [0, 1, 2, 3],
      [4, 5, 6, 7],
      [8, 9, 10, 11],
      [12, 13, 14, 15],
    ])
    const transposed = translateFieldToNumbers(transposeField(field))
    expect(transposed).toEqual([
      [0, 4, 8, 12],
      [1, 5, 9, 13],
      [2, 6, 10, 14],
      [3, 7, 11, 15],
    ])
    expect(field).toEqual(field)
  })
})

describe('getClusters', () => {
  test('行クラスタを正しく取得できる', () => {
    const field = createFieldByNumbers([
      [0, 0, 0, 1, 2],
      [0, 1, 2, 3, 4],
      [1, 1, 1, 2, 3],
      [4, 4, 4, 4, 4],
      [0, 0, 3, 3, 3],
    ])

    const expected: Cluster[] = [
      { column: 0, row: 0, length: 3, horizontal: true },
      { column: 0, row: 2, length: 3, horizontal: true },
      { column: 0, row: 3, length: 5, horizontal: true },
      { column: 2, row: 4, length: 3, horizontal: true },
    ]

    expect(getClusters(field)).toEqual(expected)
  })
  test('列クラスタを正しく取得できる', () => {
    const field = createFieldByNumbers([
      [0, 0, 1, 4, 0],
      [0, 1, 1, 4, 0],
      [0, 2, 1, 4, 3],
      [1, 3, 2, 4, 3],
      [2, 4, 3, 4, 3],
    ])

    const expected: Cluster[] = [
      { column: 0, row: 0, length: 3, horizontal: false },
      { column: 2, row: 0, length: 3, horizontal: false },
      { column: 3, row: 0, length: 5, horizontal: false },
      { column: 4, row: 2, length: 3, horizontal: false },
    ]

    expect(getClusters(field)).toEqual(expected)
  })
  test('すべてのクラスタを正しく取得できる', () => {
    const field = createFieldByNumbers([
      [0, 0, 0, 0, 2],
      [1, 0, 2, 2, 2],
      [0, 0, 0, 1, 2],
      [1, 2, 3, 4, 0],
      [1, 0, 1, 1, 1],
      [2, 0, 2, 3, 4],
      [1, 0, 3, 4, 0],
    ])

    const expected: Cluster[] = [
      { column: 0, row: 0, length: 4, horizontal: true },
      { column: 2, row: 1, length: 3, horizontal: true },
      { column: 0, row: 2, length: 3, horizontal: true },
      { column: 2, row: 4, length: 3, horizontal: true },
      { column: 1, row: 0, length: 3, horizontal: false },
      { column: 1, row: 4, length: 3, horizontal: false },
      { column: 4, row: 0, length: 3, horizontal: false },
    ]

    expect(getClusters(field)).toEqual(expected)
  })
})
