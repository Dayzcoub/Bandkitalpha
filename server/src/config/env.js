export function getEnv() {
  const port = Number.parseInt(process.env.PORT || '3001', 10);
  const nodeEnv = process.env.NODE_ENV || 'development';
  return {
    nodeEnv,
    port: Number.isFinite(port) ? port : 3001,
    apiPrefix: '/api/v1',
    // Secure cookies require HTTPS. Set COOKIE_SECURE=true once the VPS serves
    // over TLS (staging or production). Defaults on for production.
    cookieSecure: process.env.COOKIE_SECURE === 'true' || nodeEnv === 'production'
  };
}
