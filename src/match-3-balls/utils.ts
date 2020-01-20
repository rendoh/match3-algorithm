export function pickUpRandomValue<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

export const getDistance = (x1: number, y1: number, x2: number, y2: number) =>
  Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))

export function transposeField<T>(array: T[][]): T[][] {
  return array[0].map((_, columnIndex) => array.map(row => row[columnIndex]))
}
