export function getEnv() {
  const port = Number.parseInt(process.env.PORT || '3001', 10);
  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: Number.isFinite(port) ? port : 3001,
    apiPrefix: '/api/v1'
  };
}
