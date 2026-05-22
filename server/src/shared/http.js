export function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store'
  });
  res.end(body);
}

export function sendError(res, statusCode, code, message, details = {}) {
  sendJson(res, statusCode, {
    error: {
      code,
      message,
      details
    }
  });
}

export function notFound(res) {
  sendError(res, 404, 'NOT_FOUND', 'Endpoint not found');
}
