// `node --test src/shared/auth.test.js` (стдлибный раннер — зависимостей не добавляет).
//
// Тесты только на clientIp(): это граница доверия, а у неё был баг, который никто бы не
// заметил глазами — форжированный адрес выглядит в БД точно так же, как настоящий.
import test from 'node:test';
import assert from 'node:assert/strict';

import { clientIp } from './auth.js';

// Минимальный дубль того, что читает clientIp: пир сокета и заголовки.
function request({ peer, forwarded }) {
  return {
    socket: { remoteAddress: peer },
    headers: forwarded === undefined ? {} : { 'x-forwarded-for': forwarded }
  };
}

test('за доверенным прокси берётся адрес, дописанный nginx справа', () => {
  // Именно так выглядит $proxy_add_x_forwarded_for: клиентское слева, настоящее справа.
  const req = request({ peer: '127.0.0.1', forwarded: '203.0.113.9' });
  assert.equal(clientIp(req), '203.0.113.9');
});

test('подделанный x-forwarded-for не подменяет адрес — это и был баг', () => {
  // Клиент прислал "1.2.3.4", nginx дописал настоящий 203.0.113.9.
  const req = request({ peer: '127.0.0.1', forwarded: '1.2.3.4, 203.0.113.9' });
  assert.equal(clientIp(req), '203.0.113.9');
  assert.notEqual(clientIp(req), '1.2.3.4');
});

test('несколько подделанных хопов не сдвигают ответ', () => {
  const req = request({ peer: '127.0.0.1', forwarded: '1.2.3.4, 5.6.7.8, 9.9.9.9, 203.0.113.9' });
  assert.equal(clientIp(req), '203.0.113.9');
});

test('от недоверенного пира заголовок игнорируется целиком', () => {
  // Прямое подключение (node открыт наружу, или прокси не в списке): всё, что клиент
  // говорит о себе, — не доказательство.
  const req = request({ peer: '198.51.100.7', forwarded: '1.2.3.4' });
  assert.equal(clientIp(req), '198.51.100.7');
});

test('loopback через IPv6-сокет остаётся доверенным', () => {
  // ::ffff:127.0.0.1 — тот же nginx. Без нормализации мы вернули бы адрес прокси.
  const req = request({ peer: '::ffff:127.0.0.1', forwarded: '1.2.3.4, 203.0.113.9' });
  assert.equal(clientIp(req), '203.0.113.9');
});

test('IPv4-mapped адрес клиента разворачивается', () => {
  const req = request({ peer: '127.0.0.1', forwarded: '::ffff:203.0.113.9' });
  assert.equal(clientIp(req), '203.0.113.9');
});

test('без заголовка за прокси возвращается пир', () => {
  const req = request({ peer: '127.0.0.1' });
  assert.equal(clientIp(req), '127.0.0.1');
});

test('мусор в последнем элементе не попадает в базу', () => {
  const req = request({ peer: '127.0.0.1', forwarded: '203.0.113.9, not-an-ip' });
  assert.equal(clientIp(req), '127.0.0.1');
});

test('пустой заголовок не роняет и не подменяет', () => {
  assert.equal(clientIp(request({ peer: '127.0.0.1', forwarded: '' })), '127.0.0.1');
  assert.equal(clientIp(request({ peer: '127.0.0.1', forwarded: ' , ' })), '127.0.0.1');
});

test('отсутствие сокета даёт null, а не строку', () => {
  assert.equal(clientIp({ headers: {}, socket: undefined }), null);
});

test('TRUSTED_PROXY_IPS=пусто отключает доверие к заголовку', (t) => {
  const previous = process.env.TRUSTED_PROXY_IPS;
  process.env.TRUSTED_PROXY_IPS = '';
  t.after(() => {
    if (previous === undefined) delete process.env.TRUSTED_PROXY_IPS;
    else process.env.TRUSTED_PROXY_IPS = previous;
  });
  const req = request({ peer: '127.0.0.1', forwarded: '1.2.3.4, 203.0.113.9' });
  assert.equal(clientIp(req), '127.0.0.1');
});
