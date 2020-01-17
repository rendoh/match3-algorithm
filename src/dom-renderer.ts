import Playground, { Cluster } from './match3/Playground'

export default function initDOMRenderer(playground: Playground) {
  const root = document.createElement('div')
  document.body.appendChild(root)
  function render() {
    for (let i = 0; i < root.children.length; i++) {
      root.children[i].parentNode?.removeChild(root.children[i])
    }
    const wrapper = document.createElement('div')
    wrapper.classList.add('playground')
    playground.getField().forEach(row => {
      const rowElement = document.createElement('div')
      rowElement.classList.add('row')
      row.forEach(cell => {
        const cellElement = document.createElement('div')
        cellElement.classList.add('cell')
        cellElement.textContent =
          typeof cell === 'number' ? cell.toString() : ''
        rowElement.appendChild(cellElement)
      })
      wrapper.appendChild(rowElement)
    })

    root.appendChild(wrapper)
  }

  function getFieldAsElement() {
    return Array.from(document.querySelectorAll('.row')).map(rowElement => {
      return Array.from(rowElement.querySelectorAll('.cell')).map(
        cellElement => cellElement,
      )
    })
  }

  function sleep(ms: number) {
    return new Promise(resolve => {
      setTimeout(resolve, ms)
    })
  }

  function activate() {
    let fromX: number | null = null
    let fromY: number | null = null

    getFieldAsElement().forEach((row, rowIndex) => {
      row.forEach((cell, columnIndex) => {
        cell.addEventListener('click', async () => {
          if (typeof fromX === 'number' && typeof fromY === 'number') {
            if (fromX !== columnIndex || fromY !== rowIndex) {
              playground.swap(fromX, fromY, columnIndex, rowIndex)
              const clusters = playground.getClusters()
              render()
              if (clusters.length > 0) {
                await resolve()
                activate()
              } else {
                playground.swap(columnIndex, rowIndex, fromX, fromY)
                update()
              }
            }
            fromX = null
            fromY = null
            document
              .querySelectorAll('.is-selected')
              .forEach(selected => selected.classList.remove('is-selected'))
          } else {
            fromX = columnIndex
            fromY = rowIndex
            cell.classList.add('is-selected')
          }
        })
      })
    })
  }

  function checkClusters(clusters: Cluster[]) {
    const currentViewElement = getFieldAsElement()
    clusters.forEach(cluster => {
      if (cluster.horizontal) {
        for (
          let column = cluster.column;
          column < cluster.column + cluster.length;
          column++
        ) {
          currentViewElement[cluster.row][column].classList.add('is-cluster')
        }
      } else {
        for (let row = cluster.row; row < cluster.row + cluster.length; row++) {
          currentViewElement[row][cluster.column].classList.add('is-cluster')
        }
      }
    })
  }

  async function resolve() {
    let clusters = playground.getClusters()
    while (clusters.length > 0) {
      checkClusters(clusters)
      await sleep(500)
      playground.resolveCurrentFrame()
      render()
      clusters = playground.getClusters()
    }
  }

  function update() {
    render()
    activate()
  }

  update()
}
