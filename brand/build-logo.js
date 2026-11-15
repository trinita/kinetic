// Generates Kinetic logo SVGs (concept B + lowercase wordmark) with text outlined to paths.
// usage: node build.js <fontsDir> <outDir>
const fs = require('fs');
const path = require('path');
const opentype = require('opentype.js'); // npm i opentype.js@1.3.4; fonts: Fraunces opsz144 wght600, Plus Jakarta Sans 700 static TTFs from Google Fonts;

const [fontsDir, outDir] = process.argv.slice(2);
const fraunces = opentype.loadSync(path.join(fontsDir, 'fraunces.ttf'));
const jakarta = opentype.loadSync(path.join(fontsDir, 'jakarta.ttf'));

const C = { walnut: '#3E2B20', jati: '#B07A45', oak: '#D9B98C', krem: '#F6F0E6', lumut: '#5E6B4A' };

// ---- text → path with tracking + kerning
function textPath(font, str, size, tracking, x0, baseline) {
  let x = x0, d = '', prev = null;
  const scale = size / font.unitsPerEm;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const ch of str) {
    const g = font.charToGlyph(ch);
    if (prev) x += font.getKerningValue(prev, g) * scale;
    const p = g.getPath(x, baseline, size);
    const bb = p.getBoundingBox();
    if (bb.x1 < bb.x2) { minX = Math.min(minX, bb.x1); minY = Math.min(minY, bb.y1); maxX = Math.max(maxX, bb.x2); maxY = Math.max(maxY, bb.y2); }
    d += p.toPathData(2);
    x += g.advanceWidth * scale + tracking;
    prev = g;
  }
  return { d, bbox: { x1: minX, y1: minY, x2: maxX, y2: maxY } };
}

// ---- icon (concept B "Sambungan"), drawn in a 120 box; content spans ~x27..107, y16..104
const UPPER = 'x1="50" y1="68" x2="102" y2="8"';
const LOWER = 'x1="60" y1="58" x2="104" y2="116"';
const GRAIN = [
  'M32 20 C31 40 34 52 32 70 S33 92 32 100',
  'M37 20 C38 34 35 48 37 62 C39 76 36 88 37 100',
  'M42 20 C41 30 43 44 42 56 C41 70 43 86 42 100',
];
function icon(p, colors, mono = false) {
  // p = id prefix, so several icons can live in one document
  const grainMask = mono
    ? `<mask id="${p}g" maskUnits="userSpaceOnUse" x="0" y="0" width="120" height="120"><rect width="120" height="120" fill="#fff"/><g fill="none" stroke="#000" stroke-width="1.3" stroke-linecap="round">${GRAIN.map(d => `<path d="${d}"/>`).join('')}</g></mask>`
    : '';
  return `<defs>
    <clipPath id="${p}c"><rect x="0" y="16" width="120" height="88"/></clipPath>
    <mask id="${p}lo" maskUnits="userSpaceOnUse" x="0" y="0" width="120" height="120"><rect width="120" height="120" fill="#fff"/><line ${UPPER} stroke="#000" stroke-width="23"/><rect x="24" y="14" width="26" height="92" fill="#000"/></mask>
    <mask id="${p}up" maskUnits="userSpaceOnUse" x="0" y="0" width="120" height="120"><rect width="120" height="120" fill="#fff"/><rect x="24" y="14" width="26" height="92" fill="#000"/></mask>
    ${grainMask}
  </defs>
  <g clip-path="url(#${p}c)">
    <g mask="url(#${p}lo)"><line ${LOWER} stroke="${colors.arm2}" stroke-width="17"/></g>
    <g mask="url(#${p}up)"><line ${UPPER} stroke="${colors.arm1}" stroke-width="17"/></g>
  </g>
  <rect x="27" y="16" width="20" height="88" rx="1.5" fill="${colors.plank}"${mono ? ` mask="url(#${p}g)"` : ''}/>
  ${mono ? '' : `<g fill="none" stroke="${colors.grain}" stroke-width="1.3" stroke-linecap="round">${GRAIN.map(d => `<path d="${d}"/>`).join('')}</g>`}`;
}
const ICON_BOX = { x: 27, y: 16, w: 80, h: 88 }; // visible content bounds

const LIGHT = { plank: C.walnut, grain: C.jati, arm1: C.jati, arm2: C.lumut, name: C.walnut, tag: C.jati };
const DARK = { plank: C.oak, grain: C.jati, arm1: C.jati, arm2: C.krem, name: C.krem, tag: C.oak };
const MONO = (c) => ({ plank: c, grain: c, arm1: c, arm2: c, name: c, tag: c });

const svg = (vb, body, title) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" role="img" aria-label="${title}"><title>${title}</title>${body}</svg>\n`;
const r = (n) => Math.round(n * 100) / 100;

// ---- wordmark block: "kinetic" + "BENGKEL KAYU" (tagline optional)
function wordmark(colors, withTag = true) {
  const name = textPath(fraunces, 'kinetic', 100, -2, 0, 100);
  let body = `<path fill="${colors.name}" d="${name.d}"/>`;
  let bb = { ...name.bbox };
  if (withTag) {
    const tag = textPath(jakarta, 'BENGKEL KAYU', 26, 9, name.bbox.x1 + 2, name.bbox.y2 + 17 + 26 * 0.72);
    body += `<path fill="${colors.tag}" d="${tag.d}"/>`;
    bb = { x1: Math.min(bb.x1, tag.bbox.x1), y1: bb.y1, x2: Math.max(bb.x2, tag.bbox.x2), y2: tag.bbox.y2 };
  }
  return { body, bb };
}

const files = {};

// standalone icons (square, a little padding)
const sq = `19 12 96 96`;
files['kinetic-icon.svg'] = svg(sq, icon('i', LIGHT), 'Kinetic');
files['kinetic-icon-dark.svg'] = svg(sq, icon('i', DARK), 'Kinetic');
files['kinetic-icon-mono.svg'] = svg(sq, icon('i', MONO(C.walnut), true), 'Kinetic');

// favicon: icon on a krem rounded square
files['favicon.svg'] = svg('0 0 96 96', `<rect width="96" height="96" rx="20" fill="${C.krem}"/><g transform="translate(-17.5 -10.6) scale(0.977)">${icon('f', LIGHT)}</g>`, 'Kinetic');

// wordmark only
for (const [suffix, colors] of [['', LIGHT], ['-dark', DARK], ['-mono', MONO(C.walnut)]]) {
  const { body, bb } = wordmark(colors, false);
  const pad = 4;
  files[`kinetic-wordmark${suffix}.svg`] = svg(`${r(bb.x1 - pad)} ${r(bb.y1 - pad)} ${r(bb.x2 - bb.x1 + 2 * pad)} ${r(bb.y2 - bb.y1 + 2 * pad)}`, body, 'kinetic');
}

// horizontal lockup: icon + wordmark + tagline
for (const [suffix, colors, mono] of [['', LIGHT, false], ['-dark', DARK, false], ['-mono', MONO(C.walnut), true], ['-white', MONO('#FFFFFF'), true]]) {
  const { body, bb } = wordmark(colors, true);
  const h = bb.y2 - bb.y1;
  const s = h / ICON_BOX.h;                       // icon content as tall as the text block
  const gap = 34;
  const iconW = ICON_BOX.w * s;
  const tx = bb.x1 - gap - iconW - ICON_BOX.x * s;
  const ty = bb.y1 - ICON_BOX.y * s;
  const iconG = `<g transform="translate(${r(tx)} ${r(ty)}) scale(${r(s * 1000) / 1000})">${icon('l', colors, mono)}</g>`;
  const pad = 6;
  const x1 = bb.x1 - gap - iconW - pad;
  files[`kinetic-logo${suffix}.svg`] = svg(`${r(x1)} ${r(bb.y1 - pad)} ${r(bb.x2 - x1 + pad)} ${r(h + 2 * pad)}`, iconG + body, 'Kinetic — Bengkel Kayu');
}

fs.mkdirSync(outDir, { recursive: true });
for (const [name, content] of Object.entries(files)) fs.writeFileSync(path.join(outDir, name), content);
console.log(Object.keys(files).join('\n'));
