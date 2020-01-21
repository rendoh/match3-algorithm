import { Graphics, interaction } from 'pixi.js'
import TWEEN from '@tweenjs/tween.js'

type DragStartHandler = () => void
type DraggingHandler = (x: number, y: number) => void
type DragEndHandler = (x: number, y: number) => void

export default class Ball {
  public graphics = new Graphics()
  private dragging = false

  private dragStartHandlers: DragStartHandler[] = []
  private draggingHandlers: DraggingHandler[] = []
  private dragEndHandlers: DragEndHandler[] = []

  constructor(public color: number = 0x888888, private radius: number) {
    this.initGraphics()
    this.initInteractions()
  }

  private initGraphics() {
    const { graphics, color, radius } = this
    graphics.beginFill(color)
    graphics.drawCircle(0, 0, radius)
    graphics.endFill()

    graphics.zIndex = 0
    graphics.interactive = true
    graphics.cursor = 'grab'
  }

  private initInteractions() {
    const handleDragEnd = (event: interaction.InteractionEvent) => {
      const { x, y } = event.data.getLocalPosition(this.graphics.parent)
      this.dragging = false
      this.graphics.zIndex = 0
      this.graphics.cursor = 'grab'
      this.dragEndHandlers.forEach(cb => cb(x, y))
    }
    this.graphics
      .on('pointerdown', () => {
        this.dragging = true
        this.graphics.zIndex = 1
        this.graphics.cursor = 'grabbing'
        this.dragStartHandlers.forEach(cb => cb())
      })
      .on('pointerup', handleDragEnd)
      .on('pointerupoutside', handleDragEnd)
      .on('pointermove', (event: interaction.InteractionEvent) => {
        if (!this.dragging) return
        const { x, y } = event.data.getLocalPosition(this.graphics.parent)
        this.draggingHandlers.forEach(cb => cb(x, y))
      })
  }

  public on(eventType: 'dragstart', callback: DragStartHandler): Ball
  public on(eventType: 'dragging', callback: DraggingHandler): Ball
  public on(eventType: 'dragend', callback: DragEndHandler): Ball
  public on(
    eventType: 'dragstart' | 'dragging' | 'dragend',
    callback: DragStartHandler | DraggingHandler | DragEndHandler,
  ): Ball {
    if (eventType === 'dragstart') {
      this.dragStartHandlers.push(callback as DragStartHandler)
    } else if (eventType === 'dragging') {
      this.draggingHandlers.push(callback)
    } else if (eventType === 'dragend') {
      this.dragEndHandlers.push(callback)
    }
    return this
  }

  public off(eventType: 'dragstart', callback: DragStartHandler): Ball
  public off(eventType: 'dragging', callback: DraggingHandler): Ball
  public off(eventType: 'dragend', callback: DragEndHandler): Ball
  public off(
    eventType: 'dragstart' | 'dragging' | 'dragend',
    callback: DragStartHandler | DraggingHandler | DragEndHandler,
  ): Ball {
    if (eventType === 'dragstart') {
      this.dragStartHandlers = this.dragStartHandlers.filter(
        _callback => _callback !== callback,
      )
    } else if (eventType === 'dragging') {
      this.draggingHandlers = this.draggingHandlers.filter(
        _callback => _callback !== callback,
      )
    } else if (eventType === 'dragend') {
      this.dragEndHandlers = this.dragEndHandlers.filter(
        _callback => _callback !== callback,
      )
    }
    return this
  }

  public moveTo(
    x: number,
    y: number,
    duration: number = 450,
    easing: (k: number) => number = TWEEN.Easing.Cubic.Out,
  ) {
    if (duration === 0) {
      this.graphics.x = x
      this.graphics.y = y
      return
    }

    return new Promise(resolve => {
      new TWEEN.Tween(this.graphics)
        .to({ x, y }, duration)
        .easing(easing)
        .onComplete(resolve)
        .start()
    })
  }

  public remove(
    duration: number = 450,
    easing: (k: number) => number = TWEEN.Easing.Back.In,
  ) {
    return new Promise(resolve => {
      new TWEEN.Tween(this.graphics.scale)
        .to({ x: 0, y: 0 }, duration)
        .easing(easing)
        .onComplete(resolve)
        .start()
    })
  }

  public appear(
    duration: number = 450,
    easing: (k: number) => number = TWEEN.Easing.Back.Out,
  ) {
    this.graphics.scale.x = 0
    this.graphics.scale.y = 0
    return new Promise(resolve => {
      new TWEEN.Tween(this.graphics.scale)
        .to({ x: 1, y: 1 }, duration)
        .easing(easing)
        .onComplete(resolve)
        .start()
    })
  }
}
