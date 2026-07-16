export function getEnv() {
  const port = Number.parseInt(process.env.PORT || '3001', 10);
  const nodeEnv = process.env.NODE_ENV || 'development';
  return {
    nodeEnv,
    port: Number.isFinite(port) ? port : 3001,
    apiPrefix: '/api/v1',
    // Secure cookies require HTTPS. Set COOKIE_SECURE=true once the VPS serves
    // over TLS (staging or production). Defaults on for production.
    cookieSecure: process.env.COOKIE_SECURE === 'true' || nodeEnv === 'production',
    // Outbound mail. 'none' (default) sends nothing and lets non-production fall
    // back to the dev verification token; 'resend' uses the Resend HTTP API.
    mailProvider: process.env.MAIL_PROVIDER || 'none',
    resendApiKey: process.env.RESEND_API_KEY || '',
    // Verified sender, e.g. "BandKit <noreply@yourdomain>".
    mailFrom: process.env.MAIL_FROM || '',
    // Public origin used to build links in emails (no trailing slash).
    appBaseUrl: (process.env.APP_BASE_URL || 'https://bandkitdev.mywire.org').replace(/\/+$/, ''),
    // Кто имеет право говорить нам, чей это запрос. `clientIp()` доверяет
    // `x-forwarded-for` только если сокет пришёл с одного из этих адресов; для всех
    // остальных заголовок — это заявление клиента о самом себе, то есть ничто.
    // По умолчанию loopback: node слушает `127.0.0.1`, поэтому единственный, кто может
    // быть его пиром в проде, — свой же nginx. Пустое значение отключает доверие вовсе.
    trustedProxyIps: (process.env.TRUSTED_PROXY_IPS ?? '127.0.0.1,::1')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
    // Where uploaded document files live. Must stay OUTSIDE the web root — files
    // are served only through the permission-checked proxy (Security §6).
    filesDir: process.env.FILES_DIR || '/var/lib/bandkit/files',
    maxUploadBytes: Number.parseInt(process.env.MAX_UPLOAD_BYTES || '', 10) || 25 * 1024 * 1024
  };
}
