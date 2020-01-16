import Playground, {
  transposeField,
  Field,
  Cluster,
  Movable,
} from './Playground'

describe('transposeField', () => {
  test('非破壊で行列を入れ替える', () => {
    const field: Field = [
      [0, 1, 2, 3],
      [4, 5, 6, 7],
      [8, 9, 10, 11],
      [12, 13, 14, 15],
    ]

    expect(transposeField(field)).toEqual([
      [0, 4, 8, 12],
      [1, 5, 9, 13],
      [2, 6, 10, 14],
      [3, 7, 11, 15],
    ])
    expect(field).toEqual(field)
  })
})

describe('Playground', () => {
  test('初期化時はクラスタが存在せず、かつ、操作可能な対象が1つ以上存在する', () => {
    const randRange = (min: number, max: number) =>
      Math.floor(Math.random() * (max - min + 1) + min)
    for (let i = 0; i < 1000; i++) {
      const playground = new Playground(
        randRange(4, 10),
        randRange(4, 10),
        randRange(4, 6),
      )
      expect(playground.getMovables()).not.toHaveLength(0)
      expect(playground.getClusters()).toHaveLength(0)
    }
  })
  describe('クラスタの取得', () => {
    test('行クラスタを正しく取得できる', () => {
      const playground = Playground.createManually([
        [0, 0, 0, 1, 2],
        [0, 1, 2, 3, 4],
        [1, 1, 1, 2, 3],
        [4, 4, 4, 4, 4],
        [0, 0, 3, 3, 3],
      ])

      const expectedClusters: Cluster[] = [
        { column: 0, row: 0, length: 3, horizontal: true },
        { column: 0, row: 2, length: 3, horizontal: true },
        { column: 0, row: 3, length: 5, horizontal: true },
        { column: 2, row: 4, length: 3, horizontal: true },
      ]

      expect(playground.getClusters()).toEqual(expectedClusters)
    })
    test('列クラスタを正しく取得できる', () => {
      const playground = Playground.createManually([
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

      expect(playground.getClusters()).toEqual(expected)
    })
    test('すべてのクラスタを正しく取得できる', () => {
      const playground = Playground.createManually([
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

      expect(playground.getClusters()).toEqual(expected)
    })
  })
  test('セルを入れ替える', () => {
    const playground = Playground.createManually([
      [0, 0, 0, 0, 0],
      [0, 0, 1, 0, 0],
      [0, 0, 2, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
    ])

    playground.swap(2, 1, 2, 2)

    expect(playground.getField()).toEqual([
      [0, 0, 0, 0, 0],
      [0, 0, 2, 0, 0],
      [0, 0, 1, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
    ])
  })

  test('非破壊でセルを入れ替えたフィールドを返す', () => {
    const playground = Playground.createManually([
      [0, 0, 0, 0, 0],
      [0, 0, 1, 0, 0],
      [0, 0, 2, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
    ])

    const swappedField = playground.drySwap(2, 1, 2, 2)

    expect(playground.getField()).toEqual([
      [0, 0, 0, 0, 0],
      [0, 0, 1, 0, 0],
      [0, 0, 2, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
    ])
    expect(swappedField).toEqual([
      [0, 0, 0, 0, 0],
      [0, 0, 2, 0, 0],
      [0, 0, 1, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
    ])
  })

  test('クラスタを削除し、下方向に詰める', () => {
    const _ = null
    const playground = Playground.createManually([
      [0, 0, 0, 0, 2],
      [1, 0, 2, 2, 2],
      [0, 0, 0, 1, 2],
      [1, 2, 3, 4, 0],
      [1, 0, 1, 1, 1],
      [2, 0, 2, 3, 4],
      [1, 0, 3, 4, 0],
    ])
    playground.shift()
    expect(playground.getField()).toEqual([
      [_, _, _, _, _],
      [_, _, _, _, _],
      [1, _, _, _, _],
      [1, _, _, 1, _],
      [1, _, 3, 4, 0],
      [2, _, 2, 3, 4],
      [1, 2, 3, 4, 0],
    ])
  })
  describe('操作可能な対象を見つける', () => {
    test('テストケース1', () => {
      const A = 999
      const B = 888
      const playground = Playground.createManually([
        [0, 1, 2, 3],
        [1, A, B, A],
        [2, B, A, B],
        [3, 4, 5, A],
      ])
      const expectedMovables: Movable[] = [
        { x1: 2, y1: 2, x2: 3, y2: 2 },
        { x1: 2, y1: 1, x2: 2, y2: 2 },
      ]
      expect(playground.getMovables()).toEqual(expectedMovables)
    })
    test('テストケース2', () => {
      const A = 999
      const B = 888
      /* eslint-disable prettier/prettier */
      const playground = Playground.createManually([
        //        0   1   2   3   4   5   6   7
        /* 0 */  [0 , A , 2 , 3 , 4 , 5 , 6 , B ],
        /* 1 */  [8 , 9 , A , 11, 12, A , A , B ],
        /* 2 */  [16, A , 18, A , 20, 21, B , A ],
        /* 3 */  [24, 25, A , 27, 28, 29, 30, 31],
        /* 4 */  [32, 33, 34, 35, 36, 37, B , 39],
        /* 5 */  [40, B , 42, A , 44, B , 46, B ],
        /* 6 */  [B , 49, 50, 51, A , 53, 54, 55],
        /* 7 */  [56, B , 58, A , 60, 61, 62, 63],
        /* 8 */  [64, B , 66, 67, 68, 69, 70, 71],
      ])
      /* eslint-enable prettier/prettier */
      const expectedMovables: Movable[] = [
        // horizontal
        { x1: 1, y1: 1, x2: 2, y2: 1 },
        { x1: 1, y1: 2, x2: 2, y2: 2 },
        { x1: 2, y1: 2, x2: 3, y2: 2 },
        { x1: 6, y1: 2, x2: 7, y2: 2 },
        { x1: 0, y1: 6, x2: 1, y2: 6 },
        { x1: 3, y1: 6, x2: 4, y2: 6 },
        // vertical
        { x1: 1, y1: 5, x2: 1, y2: 6 },
        { x1: 2, y1: 1, x2: 2, y2: 2 },
        { x1: 2, y1: 2, x2: 2, y2: 3 },
        { x1: 6, y1: 4, x2: 6, y2: 5 },
        { x1: 7, y1: 1, x2: 7, y2: 2 },
      ]
      expect(playground.getMovables()).toEqual(expectedMovables)
    })
  })
})
