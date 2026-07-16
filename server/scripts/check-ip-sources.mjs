// Запрещает добывать IP клиента где-либо, кроме `clientIp()` в src/shared/auth.js.
//
// Зачем механическая проверка, а не договорённость. Ровно это правило уже держалось на
// внимательности — и не удержалось: `clientIp()` брала первый элемент `x-forwarded-for`,
// то есть значение, которым управляет клиент, и молча писала его в `sessions.ip`. Одна
// доверенная точка стоит чего-то только если обойти её нельзя. Второй потребитель IP
// (abuse detection, логи, forensic) появится не сегодня и не от того, кто читал этот
// комментарий.
//
// Проверка текстовая, а не семантическая: она ловит того, кто пишет `req.socket.remoteAddress`
// в новом хендлере, и не претендует на большее. Обойти её при желании можно — но не
// случайно, а это и есть цель.
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ALLOWED = path.join(ROOT, 'src', 'shared', 'auth.js');

const FORBIDDEN = [
  { pattern: /x-forwarded-for/i, hint: 'заголовок читается только внутри clientIp()' },
  { pattern: /x-real-ip/i, hint: 'заголовок читается только внутри clientIp()' },
  { pattern: /\.remoteAddress\b/, hint: 'адрес сокета читается только внутри clientIp()' },
  { pattern: /\breq\.ip\b/, hint: 'у node-сервера нет req.ip; нужен clientIp(req)' }
];

async function* jsFiles(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* jsFiles(full);
    else if (/\.(js|mjs)$/.test(entry.name)) yield full;
  }
}

// Комментарий, обсуждающий заголовок, — не чтение заголовка. Без этого проверка ругалась
// бы на объяснение самого правила, и первым, что сделал бы следующий человек, было бы
// удаление объяснения.
function isComment(line) {
  const trimmed = line.trim();
  return trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*');
}

const violations = [];
for (const dir of ['src', 'scripts']) {
  for await (const file of jsFiles(path.join(ROOT, dir))) {
    // Тесты clientIp() обязаны подделывать заголовок — в этом их работа.
    if (file === ALLOWED || file.endsWith('.test.js') || file === fileURLToPath(import.meta.url)) continue;
    const lines = (await readFile(file, 'utf8')).split('\n');
    lines.forEach((line, index) => {
      if (isComment(line)) return;
      for (const { pattern, hint } of FORBIDDEN) {
        if (pattern.test(line)) {
          violations.push(`${path.relative(ROOT, file)}:${index + 1} — ${hint}\n    ${line.trim()}`);
        }
      }
    });
  }
}

if (violations.length) {
  console.error('IP-адрес клиента добывается в обход clientIp():\n');
  console.error(violations.join('\n'));
  console.error('\nЕдинственный источник — clientIp(req) из src/shared/auth.js.');
  process.exit(1);
}
console.log('check-ip-sources: ok — clientIp() остаётся единственным источником IP');
