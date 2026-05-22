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

export async function readJsonBody(req, options = {}) {
  const maxBytes = options.maxBytes || 65536;
  let body = '';

  for await (const chunk of req) {
    body += chunk;

    if (Buffer.byteLength(body) > maxBytes) {
      const error = new Error('Request body is too large');
      error.code = 'BODY_TOO_LARGE';
      throw error;
    }
  }

  if (!body.trim()) {
    return {};
  }

  return JSON.parse(body);
}
