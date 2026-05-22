export function logInfo(message, meta = {}) {
  const entry = {
    level: 'info',
    message,
    meta,
    at: new Date().toISOString()
  };
  console.log(JSON.stringify(entry));
}

export function logError(message, error, meta = {}) {
  const entry = {
    level: 'error',
    message,
    meta,
    error: {
      name: error?.name || 'Error',
      message: error?.message || String(error)
    },
    at: new Date().toISOString()
  };
  console.error(JSON.stringify(entry));
}
