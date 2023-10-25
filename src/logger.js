let logStr = ""

export function log(message) {
  console.log('[LOG]', message)
  logStr = `${message}\n${logStr}`
}

export function getLog() {
  return logStr;
}



