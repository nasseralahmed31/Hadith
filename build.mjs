import fs from 'fs';
import { build } from 'esbuild';

let html = fs.readFileSync('index.html', 'utf8');
const m = html.match(/<script type="module">([\s\S]*?)<\/script>/);
if (!m) throw new Error('script not found');

let js = m[1].replace(
  /https:\/\/www\.gstatic\.com\/firebasejs\/[\d.]+\/firebase-(app|firestore|auth)\.js/g,
  (_, n) => 'firebase/' + n
);
js =
  "import {LocalNotifications as __LN} from '@capacitor/local-notifications';\n" +
  "import {Capacitor as __CAP} from '@capacitor/core';\n" +
  'window.__LN=__LN;window.__CAP=__CAP;\n' +
  js;

fs.mkdirSync('www/fonts', { recursive: true });
fs.writeFileSync('app.src.js', js);
await build({
  entryPoints: ['app.src.js'],
  bundle: true,
  format: 'esm',
  minify: true,
  target: 'es2020',
  outfile: 'www/app.js',
});

const ranges = {
  arabic: 'U+0600-06FF,U+0750-077F,U+08A0-08FF,U+200C-200E,U+FB50-FDFF,U+FE70-FEFC',
  latin: 'U+0000-00FF,U+0131,U+0152-0153,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2212,U+FEFF',
};
let css = '';
for (const w of [400, 600, 700]) {
  for (const s of ['arabic', 'latin']) {
    const f = `cairo-${s}-${w}-normal.woff2`;
    const src = `node_modules/@fontsource/cairo/files/${f}`;
    if (!fs.existsSync(src)) { console.log('missing font', f); continue; }
    fs.copyFileSync(src, `www/fonts/${f}`);
    css += `@font-face{font-family:Cairo;font-weight:${w};font-display:swap;src:url(fonts/${f}) format('woff2');unicode-range:${ranges[s]}}`;
  }
}

html = html.replace(/<link[^>]*fonts\.googleapis[^>]*>/, '<style>' + css + '</style>');
html = html.replace(m[0], '<script type="module" src="app.js"></script>');
fs.writeFileSync('www/index.html', html);
console.log('built www/');
