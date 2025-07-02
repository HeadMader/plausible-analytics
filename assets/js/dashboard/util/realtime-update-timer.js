const DEFAULT_INTERVAL = 30
const tickEvent = new Event('tick')

let timerInterval = null

function getIntervalFromURL() {
  const params = new URLSearchParams(window.location.search)
  const intervalParam = params.get('interval')

  const interval = parseInt(intervalParam, 10)
  
  return !isNaN(interval) && interval > 0 ? interval * 1000 : DEFAULT_INTERVAL * 1000
}

export function start() {
  stop()
  
  timerInterval = setInterval(() => {
    document.dispatchEvent(tickEvent)
  }, getIntervalFromURL())
  
  window.addEventListener('interval-change', updateInterval)
}

export function stop() {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
  window.removeEventListener('interval-change', updateInterval)
}

function updateInterval() {
  if (timerInterval) {
    stop()
    start()
  }
}

export function notifyIntervalChange() {
  window.dispatchEvent(new Event('interval-change'))
}