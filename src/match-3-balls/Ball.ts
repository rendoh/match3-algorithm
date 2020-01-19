import * as PIXI from 'pixi.js'
import TWEEN from '@tweenjs/tween.js'

type DragHandler = (x: number, y: number) => void

export default class Ball {
  public graphics = new PIXI.Graphics()
  public dragging = false
  public dragStartPosition: { x: number | null; y: number | null } = {
    x: null,
    y: null,
  }

  private dragStartHandlers: DragHandler[] = []
  private dragEndHandlers: DragHandler[] = []
  private draggingHandlers: DragHandler[] = []

  constructor(public color: number = 0x888888, radius: number) {
    const { graphics } = this
    graphics.beginFill(color)
    graphics.drawCircle(0, 0, radius)
    graphics.endFill()

    graphics.zIndex = 0
    graphics.interactive = true
    graphics.cursor = 'grab'

    const dragend = (event: PIXI.interaction.InteractionEvent) => {
      const pisition = event.data.getLocalPosition(graphics.parent)
      this.dragEndHandlers.forEach(cb => cb(pisition.x, pisition.y))
      this.dragging = false
      this.dragStartPosition = {
        x: null,
        y: null,
      }
      this.graphics.zIndex = 0
      this.graphics.cursor = 'grab'
    }

    graphics.on('pointerdown', (event: PIXI.interaction.InteractionEvent) => {
      this.dragging = true
      this.dragStartPosition = {
        x: this.graphics.x,
        y: this.graphics.y,
      }
      this.graphics.zIndex = 1
      this.graphics.cursor = 'grabbing'
      const position = event.data.getLocalPosition(graphics.parent)
      this.dragStartHandlers.forEach(cb => cb(position.x, position.y))
    })

    graphics.on('pointerup', dragend)
    graphics.on('pointerupoutside', dragend)

    graphics.on('pointermove', (event: PIXI.interaction.InteractionEvent) => {
      if (!this.dragging) return
      const position = event.data.getLocalPosition(graphics.parent)
      this.draggingHandlers.forEach(cb => cb(position.x, position.y))
    })
  }

  public resetPosition(duration: number = 450) {
    return new Promise(resolve => {
      new TWEEN.Tween(this.graphics)
        .to(
          {
            x: this.dragStartPosition.x,
            y: this.dragStartPosition.y,
          },
          duration,
        )
        .easing(TWEEN.Easing.Elastic.Out)
        .onComplete(resolve)
        .start()
    })
  }

  public on(
    eventType: 'dragstart' | 'dragend' | 'dragging',
    callback: DragHandler,
  ) {
    if (eventType === 'dragstart') {
      this.dragStartHandlers.push(callback)
    } else if (eventType === 'dragend') {
      this.dragEndHandlers.push(callback)
    } else if (eventType === 'dragging') {
      this.draggingHandlers.push(callback)
    }
  }

  public off(
    eventType: 'dragstart' | 'dragend' | 'dragging',
    callback: DragHandler,
  ) {
    if (eventType === 'dragstart') {
      this.dragStartHandlers = this.dragStartHandlers.filter(
        cb => cb !== callback,
      )
    } else if (eventType === 'dragend') {
      this.dragEndHandlers = this.dragEndHandlers.filter(cb => cb !== callback)
    } else if (eventType === 'dragging') {
      this.draggingHandlers = this.draggingHandlers.filter(
        cb => cb !== callback,
      )
    }
  }

  public moveTo(x: number, y: number, duration: number = 450) {
    if (duration === 0) {
      this.graphics.x = x
      this.graphics.y = y
      return
    }

    return new Promise(resolve => {
      new TWEEN.Tween(this.graphics)
        .to({ x, y }, duration)
        .onComplete(resolve)
        .start()
    })
  }
}
