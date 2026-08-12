#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const OUT_DIR = path.join(__dirname, '..', 'src', 'assets', 'icons');

const THEME = { r: 25, g: 118, b: 210 };   // #1976d2
const ACCENT = { r: 255, g: 255, b: 255 }; // white circle

function crc32(buf) {
  const table = crc32.table || (crc32.table = makeCrcTable());
  let c = -1;
  for (let i = 0; i < buf.length; i++) {
    c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ -1) >>> 0;
}

function makeCrcTable() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c;
  }
  return table;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function createPng(width, height, draw) {
  const rowSize = width * 3;
  const image = Buffer.alloc((rowSize + 1) * height);
  let p = 0;
  for (let y = 0; y < height; y++) {
    image[p++] = 0; // filter: None
    for (let x = 0; x < width; x++) {
      const { r, g, b } = draw(x, y, width, height);
      image[p++] = r;
      image[p++] = g;
      image[p++] = b;
    }
  }

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 2;  // color type RGB
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace

  const ihdr = chunk('IHDR', ihdrData);
  const compressed = zlib.deflateSync(image, { level: 9 });
  const idat = chunk('IDAT', compressed);
  const iend = chunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function iconPixel(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(w, h) * 0.3;
  const dx = x - cx;
  const dy = y - cy;
  const inside = dx * dx + dy * dy <= r * r;
  return inside ? ACCENT : THEME;
}

function touchIconPixel(x, y, w, h) {
  // leave more padding for iOS rounding/cropping
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(w, h) * 0.26;
  const dx = x - cx;
  const dy = y - cy;
  const inside = dx * dx + dy * dy <= r * r;
  return inside ? ACCENT : THEME;
}

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
for (const size of sizes) {
  const png = createPng(size, size, iconPixel);
  fs.writeFileSync(path.join(OUT_DIR, `icon-${size}.png`), png);
  console.log(`Generated icon-${size}.png`);
}

const apple = createPng(180, 180, touchIconPixel);
fs.writeFileSync(path.join(OUT_DIR, 'apple-touch-icon.png'), apple);
console.log('Generated apple-touch-icon.png');
