// Gera o .zip do jogo para subir no itch.io: DuelLegendsArena_web_vX.Y.zip
// Uso (na raiz do repositório): node ferramentas/zip-itch.js [pasta-saida]
//   pasta-saida: padrão é a pasta acima do repositório (fora do git)
// Monta o index.html antes (node build.js) e pega a versão do README ("Versão atual: **X.Y**").
// Sem dependências: o zip é escrito à mão com o zlib do Node.
const fs = require('fs'), path = require('path'), zlib = require('zlib'), { execFileSync } = require('child_process');

const raiz = path.resolve(__dirname, '..');
const ARQUIVOS = ['index.html', 'icon-192.png', 'icon-512.png', 'manifest.webmanifest', 'privacidade.html'];

execFileSync(process.execPath, [path.join(raiz, 'build.js')], { stdio: 'inherit' });
const ver = (fs.readFileSync(path.join(raiz, 'README.md'), 'utf8').match(/Versão atual: \*\*([\d.]+)\*\*/) || [])[1];
if (!ver) throw new Error('Não achei "Versão atual: **X.Y**" no README.md');
const saida = path.join(path.resolve(process.argv[2] || path.join(raiz, '..')), `DuelLegendsArena_web_v${ver}.zip`);

const crcTab = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = zlib.crc32 || (b => { let c = ~0; for (const x of b) c = crcTab[(c ^ x) & 255] ^ (c >>> 8); return (~c) >>> 0; });

const d = new Date(), hora = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
const data = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
const locais = [], central = [];
let pos = 0;
for (const nome of ARQUIVOS) {
  const bruto = fs.readFileSync(path.join(raiz, nome)), comp = zlib.deflateRawSync(bruto, { level: 9 }), n = Buffer.from(nome);
  const crc = crc32(bruto);
  const h = Buffer.alloc(30); h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt16LE(0x0800, 6); h.writeUInt16LE(8, 8);
  h.writeUInt16LE(hora, 10); h.writeUInt16LE(data, 12); h.writeUInt32LE(crc, 14); h.writeUInt32LE(comp.length, 18); h.writeUInt32LE(bruto.length, 22); h.writeUInt16LE(n.length, 26);
  const c = Buffer.alloc(46); c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt16LE(0x0800, 8); c.writeUInt16LE(8, 10);
  c.writeUInt16LE(hora, 12); c.writeUInt16LE(data, 14); c.writeUInt32LE(crc, 16); c.writeUInt32LE(comp.length, 20); c.writeUInt32LE(bruto.length, 24); c.writeUInt16LE(n.length, 28); c.writeUInt32LE(pos, 42);
  locais.push(h, n, comp); central.push(c, n);
  pos += 30 + n.length + comp.length;
}
const tamCentral = central.reduce((s, b) => s + b.length, 0);
const fim = Buffer.alloc(22); fim.writeUInt32LE(0x06054b50, 0); fim.writeUInt16LE(ARQUIVOS.length, 8); fim.writeUInt16LE(ARQUIVOS.length, 10); fim.writeUInt32LE(tamCentral, 12); fim.writeUInt32LE(pos, 16);
fs.writeFileSync(saida, Buffer.concat([...locais, ...central, fim]));
console.log(`Pronto: ${saida} (${(fs.statSync(saida).size / 1024).toFixed(0)} KB, versão ${ver})`);
