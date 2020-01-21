import Match3 from './match3/Match3'

const match3 = new Match3({
  el: document.body,
})

window.reset = () => match3.reset()

declare global {
  interface Window {
    reset: any
  }
}
