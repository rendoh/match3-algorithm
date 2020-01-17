import * as PIXI from 'pixi.js'
import Playground from './match3/Playground'
import TWEEN from '@tweenjs/tween.js'

const CANVAS_WIDTH = window.innerWidth
const CANVAS_HEIGHT = window.innerHeight
const BALL_RADIUS = 40
const BALL_GUTTER = 10
const COLORS = [0xda6836, 0x6ca4a9, 0xb94c76, 0x8a966f]

const playground = new Playground(7, 7, COLORS.length)

const app = new PIXI.Application({
  width: CANVAS_WIDTH,
  height: CANVAS_HEIGHT,
  antialias: true,
  transparent: true,
  resolution: window.devicePixelRatio,
  autoDensity: true,
})
app.ticker.add(() => {
  TWEEN.update()
})
document.body.appendChild(app.view)

{
  const field = playground.getField()
  const container = new PIXI.Container()
  container.sortableChildren = true
  app.stage.addChild(container)

  field.forEach((row, rowIndex) => {
    row.forEach((cell, columnIndex) => {
      type BallState = {
        data: PIXI.interaction.InteractionData | null
        dragging: boolean
        initialX: number | null
        initialY: number | null
      }
      const state: BallState = {
        data: null,
        dragging: false,
        initialX: null,
        initialY: null,
      }
      const graphics = new PIXI.Graphics()
      if (typeof cell !== 'number') {
        return
      }
      graphics.x = columnIndex * (BALL_RADIUS * 2 + BALL_GUTTER)
      graphics.y = rowIndex * (BALL_RADIUS * 2 + BALL_GUTTER)
      graphics.zIndex = 0
      graphics.buttonMode = true
      graphics.interactive = true
      graphics.beginFill(COLORS[cell])
      graphics.drawCircle(0, 0, BALL_RADIUS)
      graphics.endFill()
      graphics.on('pointerdown', (event: PIXI.interaction.InteractionEvent) => {
        state.data = event.data
        state.dragging = true
        state.initialX = graphics.x
        state.initialY = graphics.y
        graphics.zIndex = 1
      })
      function resetPosition() {
        new TWEEN.Tween(graphics)
          .to(
            {
              x: state.initialX,
              y: state.initialY,
            },
            300,
          )
          .easing(TWEEN.Easing.Elastic.Out)
          .start()
        state.dragging = false
        state.data = null
        state.initialX = null
        state.initialY = null
        graphics.zIndex = 0
      }
      graphics.on('pointerup', resetPosition)
      graphics.on('pointerupoutside', resetPosition)
      graphics.on('pointermove', () => {
        if (
          !state.dragging ||
          !state.data ||
          typeof state.initialX !== 'number' ||
          typeof state.initialY !== 'number'
        )
          return
        const newPosition = state.data.getLocalPosition(graphics.parent)
        // const deltaX = newPosition.x - state.initialX
        // const deltaY = newPosition.y - state.initialY
        // const distance = Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2))
        // if (distance > BALL_RADIUS * 3) {
        //   state.dragging = false
        //   state.data = null
        //   state.initialX = null
        //   state.initialY = null
        //   graphics.zIndex = 0
        //   return
        // }
        graphics.x = newPosition.x
        graphics.y = newPosition.y
        graphics.zIndex = 1
      })
      container.addChild(graphics)
    })
  })
  container.x = app.screen.width / 2
  container.y = app.screen.height / 2
  container.pivot.x = container.width / 2
  container.pivot.y = container.height / 2
}
