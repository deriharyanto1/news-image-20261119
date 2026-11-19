// THE WORLD TODAY — Thursday 19 November 2026
// One-page newspaper front page, drawn entirely in code.
// Node 22 stdlib only. No network. Deterministic output.
import * as fs from 'node:fs';
import * as crypto from 'node:crypto';

// ---------------------------------------------------------------- canvas
const W = 1024;
const H = 1024;
const img = new Uint8Array(W * H * 3);

const PAPER: [number, number, number] = [247, 242, 231];
const INK: [number, number, number] = [22, 22, 22];
const RED: [number, number, number] = [176, 32, 32];
const GREY: [number, number, number] = [122, 112, 96];
const BLUE: [number, number, number] = [28, 58, 118];
const DARKBLUE: [number, number, number] = [16, 30, 54];
const SKY: [number, number, number] = [168, 196, 224];
const SAND: [number, number, number] = [214, 196, 158];
const GREEN: [number, number, number] = [44, 96, 54];
const GOLD: [number, number, number] = [196, 152, 40];
const WHITE: [number, number, number] = [252, 250, 246];

function fill(c: [number, number, number]): void {
  for (let i = 0; i < W * H; i++) {
    img[i * 3] = c[0];
    img[i * 3 + 1] = c[1];
    img[i * 3 + 2] = c[2];
  }
}

function px(x: number, y: number, c: [number, number, number]): void {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  img[i] = c[0];
  img[i + 1] = c[1];
  img[i + 2] = c[2];
}

function fillRect(x: number, y: number, w: number, h: number, c: [number, number, number]): void {
  const x0 = Math.max(0, Math.floor(x));
  const y0 = Math.max(0, Math.floor(y));
  const x1 = Math.min(W, Math.ceil(x + w));
  const y1 = Math.min(H, Math.ceil(y + h));
  for (let yy = y0; yy < y1; yy++) {
    for (let xx = x0; xx < x1; xx++) {
      const i = (yy * W + xx) * 3;
      img[i] = c[0];
      img[i + 1] = c[1];
      img[i + 2] = c[2];
    }
  }
}

function hline(x: number, y: number, w: number, t: number, c: [number, number, number]): void {
  fillRect(x, y, w, t, c);
}

function vline(x: number, y: number, h: number, t: number, c: [number, number, number]): void {
  fillRect(x, y, t, h, c);
}

// Bresenham line with a square brush of side t
function line(x0: number, y0: number, x1: number, y1: number, t: number, c: [number, number, number]): void {
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  let x = x0;
  let y = y0;
  const r = Math.floor(t / 2);
  for (;;) {
    for (let yy = -r; yy <= r; yy++) {
      for (let xx = -r; xx <= r; xx++) px(x + xx, y + yy, c);
    }
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x += sx; }
    if (e2 < dx) { err += dx; y += sy; }
  }
}

// ---------------------------------------------------------------- font
// Stroke font on a 5 x 7 grid (x 0..4, y 0..6, y=0 is the top).
// Each glyph: strokes separated by '|', points "x,y" separated by spaces.
// A one-point stroke draws a dot. Designed from scratch for this entry.
const GLYPHS: Record<string, string> = {
  'A': '0,6 0,0 4,0 4,6|0,3 4,3',
  'B': '0,6 0,0 3,0 4,1 4,2 3,3 0,3|3,3 4,4 4,5 3,6 0,6',
  'C': '4,1 3,0 1,0 0,1 0,5 1,6 3,6 4,5',
  'D': '0,0 0,6 3,6 4,5 4,1 3,0 0,0',
  'E': '4,0 0,0 0,6 4,6|0,3 3,3',
  'F': '0,6 0,0 4,0|0,3 3,3',
  'G': '4,1 3,0 1,0 0,1 0,5 1,6 3,6 4,5 4,3 2,3',
  'H': '0,0 0,6|4,0 4,6|0,3 4,3',
  'I': '0,0 4,0|2,0 2,6|0,6 4,6',
  'J': '4,0 4,5 3,6 1,6 0,5',
  'K': '0,0 0,6|4,0 0,3|1,4 4,6',
  'L': '0,0 0,6 4,6',
  'M': '0,6 0,0 2,3 4,0 4,6',
  'N': '0,6 0,0 4,6 4,0',
  'O': '1,0 3,0 4,1 4,5 3,6 1,6 0,5 0,1 1,0',
  'P': '0,6 0,0 3,0 4,1 4,2 3,3 0,3',
  'Q': '1,0 3,0 4,1 4,5 3,6 1,6 0,5 0,1 1,0|3,4 4,6',
  'R': '0,6 0,0 3,0 4,1 4,2 3,3 0,3|1,3 4,6',
  'S': '4,1 3,0 1,0 0,1 0,2 4,4 4,5 3,6 1,6 0,5',
  'T': '0,0 4,0|2,0 2,6',
  'U': '0,0 0,5 1,6 3,6 4,5 4,0',
  'V': '0,0 2,6 4,0',
  'W': '0,0 0,6 2,3 4,6 4,0',
  'X': '0,0 4,6|4,0 0,6',
  'Y': '0,0 2,3 4,0|2,3 2,6',
  'Z': '0,0 4,0 0,6 4,6',
  '0': '1,0 3,0 4,1 4,5 3,6 1,6 0,5 0,1 1,0|0,5 4,1',
  '1': '1,1 2,0 2,6|0,6 4,6',
  '2': '0,1 1,0 3,0 4,1 4,2 0,6 4,6',
  '3': '0,1 1,0 3,0 4,1 4,2 3,3 0,3|3,3 4,4 4,5 3,6 1,6 0,5',
  '4': '0,0 0,3 4,3|3,0 3,6',
  '5': '4,0 0,0 0,3 3,3 4,4 4,5 3,6 1,6 0,5',
  '6': '4,0 3,0 1,1 0,2 0,5 1,6 3,6 4,5 4,4 3,3 0,3',
  '7': '0,0 4,0 3,2 2,6',
  '8': '1,0 3,0 4,1 4,2 3,3 1,3 0,2 0,1 1,0|1,3 3,3 4,4 4,5 3,6 1,6 0,5 0,4 1,3',
  // 9: closed bowl on top, single stem down the right side. Never a double loop.
  '9': '1,0 3,0 4,1 4,2 3,3 1,3 0,2 0,1 1,0|4,2 4,6',
  ' ': '',
  '.': '2,6 2,6',
  ',': '2,5 2,6 1,7',
  "'": '2,0 2,2',
  '$': '2,0 2,6|4,1 3,0 1,0 0,1 0,2 4,4 4,5 3,6 1,6 0,5',
  '%': '0,0 4,6|1,1 1,1|3,5 3,5',
  '-': '0,3 4,3',
  ':': '2,1 2,1|2,5 2,5',
  ';': '2,1 2,1|2,4 2,5 1,6',
  '(': '3,0 2,1 2,5 3,6',
  ')': '1,0 2,1 2,5 1,6',
  '/': '4,6 0,0',
  '!': '2,0 2,4|2,6 2,6',
  '?': '1,0 3,0 4,1 4,2 3,3 2,3|2,5 2,5',
  '+': '2,1 2,5|0,3 4,3',
  '=': '0,2 4,2|0,4 4,4',
  '"': '1,0 1,2|3,0 3,2',
};

const CHAR_ADV = 6; // grid units per character, including the gap

function charWidth(s: number): number {
  return CHAR_ADV * s;
}

function textWidth(text: string, s: number): number {
  return text.length * CHAR_ADV * s - s; // no trailing gap
}

function drawChar(ch: string, x: number, y: number, s: number, c: [number, number, number]): void {
  const g = GLYPHS[ch];
  if (g === undefined) return; // unknown char: blank
  if (g === '') return;
  const t = Math.max(1, Math.round(s * 0.32));
  for (const stroke of g.split('|')) {
    const pts = stroke.trim().split(/\s+/).map((p) => {
      const [gx, gy] = p.split(',').map(Number);
      return [Math.round(x + gx * s), Math.round(y + gy * s)] as [number, number];
    });
    if (pts.length === 1) {
      fillRect(pts[0][0] - Math.floor(t / 2), pts[0][1] - Math.floor(t / 2), t, t, c);
    } else {
      for (let i = 0; i < pts.length - 1; i++) {
        line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], t, c);
      }
    }
  }
}

function drawText(text: string, x: number, y: number, s: number, c: [number, number, number]): void {
  let cx = x;
  for (const ch of text) {
    drawChar(ch, cx, y, s, c);
    cx += charWidth(s);
  }
}

function drawTextCentered(text: string, cx: number, y: number, s: number, c: [number, number, number]): void {
  drawText(text, Math.round(cx - textWidth(text, s) / 2), y, s, c);
}

// Greedy word wrap. Returns the lines.
function wrap(text: string, maxW: number, s: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const trial = cur === '' ? w : cur + ' ' + w;
    if (textWidth(trial, s) <= maxW || cur === '') {
      cur = trial;
    } else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur !== '') lines.push(cur);
  return lines;
}

function drawLines(lines: string[], x: number, y: number, s: number, lh: number, c: [number, number, number]): number {
  let yy = y;
  for (const ln of lines) {
    drawText(ln, x, yy, s, c);
    yy += lh;
  }
  return yy;
}

// ---------------------------------------------------------------- pictograms
// Each draws inside a box (bx, by, size). Simple flat shapes.

function picSummit(bx: number, by: number, sz: number): void {
  fillRect(bx, by, sz, sz, SKY);
  // ground
  fillRect(bx, by + sz - 18, sz, 18, SAND);
  // three flags: US, China, Russia
  const poles = [bx + 18, bx + 50, bx + 82];
  for (const p of poles) vline(p, by + 16, sz - 34, 3, INK);
  // US flag
  fillRect(poles[0] + 3, by + 16, 22, 13, RED);
  fillRect(poles[0] + 3, by + 20, 22, 2, WHITE);
  fillRect(poles[0] + 3, by + 24, 22, 2, WHITE);
  // China flag
  fillRect(poles[1] + 3, by + 16, 22, 13, RED);
  fillRect(poles[1] + 7, by + 19, 4, 4, GOLD);
  // Russia flag
  fillRect(poles[2] + 3, by + 16, 22, 13, WHITE);
  fillRect(poles[2] + 3, by + 20, 22, 4, BLUE);
  fillRect(poles[2] + 3, by + 24, 22, 5, RED);
  // table line
  hline(bx + 8, by + sz - 18, sz - 16, 2, INK);
}

function picChart(bx: number, by: number, sz: number): void {
  fillRect(bx, by, sz, sz, DARKBLUE);
  // bars
  const bars = [26, 40, 34, 56, 74];
  for (let i = 0; i < bars.length; i++) {
    fillRect(bx + 12 + i * 17, by + sz - 14 - bars[i], 11, bars[i], GOLD);
  }
  // rising arrow
  line(bx + 10, by + sz - 22, bx + 50, by + 42, 3, WHITE);
  line(bx + 50, by + 42, bx + 92, by + 14, 3, WHITE);
  line(bx + 92, by + 14, bx + 80, by + 14, 3, WHITE);
  line(bx + 92, by + 14, bx + 92, by + 26, 3, WHITE);
  // $ mark
  drawText('$', bx + 8, by + 6, 2, WHITE);
}

function picCity(bx: number, by: number, sz: number): void {
  fillRect(bx, by, sz, sz, SKY);
  // sun
  fillRect(bx + sz - 34, by + 10, 22, 22, GOLD);
  // skyline
  fillRect(bx + 8, by + 52, 22, sz - 52, INK);
  fillRect(bx + 34, by + 34, 24, sz - 34, INK);
  fillRect(bx + 62, by + 62, 20, sz - 62, INK);
  fillRect(bx + 86, by + 44, 22, sz - 44, INK);
  // windows
  for (let i = 0; i < 4; i++) {
    fillRect(bx + 14 + i * 4, by + 60, 2, 2, GOLD);
    fillRect(bx + 40 + i * 4, by + 42, 2, 2, GOLD);
  }
  // road
  fillRect(bx, by + sz - 14, sz, 14, INK);
  fillRect(bx + 8, by + sz - 8, 14, 2, GOLD);
  fillRect(bx + 40, by + sz - 8, 14, 2, GOLD);
  fillRect(bx + 72, by + sz - 8, 14, 2, GOLD);
}

function picTent(bx: number, by: number, sz: number): void {
  fillRect(bx, by, sz, sz, SAND);
  // rain
  for (let i = 0; i < 5; i++) line(bx + 10 + i * 20, by + 8, bx + 6 + i * 20, by + 22, 2, BLUE);
  // tent
  line(bx + 14, by + sz - 16, bx + 54, by + 44, 3, INK);
  line(bx + 54, by + 44, bx + 94, by + sz - 16, 3, INK);
  line(bx + 54, by + 44, bx + 54, by + sz - 16, 2, INK);
  fillRect(bx + 10, by + sz - 16, sz - 20, 4, INK);
  // second tent
  line(bx + 66, by + sz - 16, bx + 86, by + 66, 2, INK);
  line(bx + 86, by + 66, bx + 102, by + sz - 16, 2, INK);
}

function picBridge(bx: number, by: number, sz: number): void {
  fillRect(bx, by, sz, sz, SKY);
  // sea
  fillRect(bx, by + sz - 26, sz, 26, BLUE);
  // bridge deck
  hline(bx + 6, by + 52, sz - 12, 4, INK);
  // towers
  vline(bx + 22, by + 22, 34, 3, INK);
  vline(bx + sz - 26, by + 22, 34, 3, INK);
  // cables
  line(bx + 22, by + 24, bx + 54, by + 52, 2, INK);
  line(bx + sz - 26, by + 24, bx + 54, by + 52, 2, INK);
  // explosion star above the deck
  const cx = bx + 54;
  const cy = by + 34;
  for (const [dx, dy] of [[0, -12], [9, -8], [12, 0], [9, 8], [0, 12], [-9, 8], [-12, 0], [-9, -8]] as [number, number][]) {
    line(cx, cy, cx + dx, cy + dy, 2, RED);
  }
  fillRect(cx - 3, cy - 3, 7, 7, GOLD);
}

function picCapitol(bx: number, by: number, sz: number): void {
  fillRect(bx, by, sz, sz, PAPER);
  // dome
  line(bx + 54, by + 12, bx + 30, by + 44, 3, INK);
  line(bx + 54, by + 12, bx + 78, by + 44, 3, INK);
  hline(bx + 28, by + 44, 52, 3, INK);
  // flag on top
  vline(bx + 54, by + 2, 12, 2, INK);
  fillRect(bx + 56, by + 2, 12, 7, RED);
  // columns
  for (const cx of [34, 48, 62, 76]) vline(bx + cx, by + 50, 30, 3, INK);
  // base
  fillRect(bx + 22, by + 80, 64, 6, INK);
  fillRect(bx + 16, by + 88, 76, 4, INK);
}

// ---------------------------------------------------------------- PNG encode
// CRC32 (IEEE)
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function adler32(buf: Uint8Array): number {
  let a = 1;
  let b = 0;
  for (let i = 0; i < buf.length; i++) {
    a = (a + buf[i]) % 65521;
    b = (b + a) % 65521;
  }
  return ((b << 16) | a) >>> 0;
}

class BitWriter {
  bytes: number[] = [];
  cur = 0;
  nbits = 0;
  writeBit(bit: number): void {
    if (bit) this.cur |= 1 << this.nbits;
    this.nbits++;
    if (this.nbits === 8) {
      this.bytes.push(this.cur);
      this.cur = 0;
      this.nbits = 0;
    }
  }
  // write the low `count` bits of value, LSB first
  writeBits(value: number, count: number): void {
    for (let i = 0; i < count; i++) this.writeBit((value >> i) & 1);
  }
  // write a Huffman code, most-significant bit first
  writeCode(code: number, len: number): void {
    for (let i = len - 1; i >= 0; i--) this.writeBit((code >> i) & 1);
  }
  finish(): Uint8Array {
    if (this.nbits > 0) this.bytes.push(this.cur);
    return new Uint8Array(this.bytes);
  }
}

// Fixed Huffman tables (RFC 1951)
function litCode(lit: number): [number, number] {
  if (lit < 144) return [0x30 + lit, 8];
  if (lit < 256) return [0x190 + (lit - 144), 9];
  if (lit < 280) return [lit - 256, 7];
  return [0xc0 + (lit - 280), 8];
}

const LEN_BASE = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258];
const LEN_EXTRA = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0];
const DIST_BASE = [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577];
const DIST_EXTRA = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13];

function lenCode(len: number): [number, number, number] {
  // returns [symbol, extraValue, extraBits]
  for (let i = 0; i < 29; i++) {
    const max = i === 28 ? 258 : LEN_BASE[i] + (1 << LEN_EXTRA[i]) - 1;
    if (len <= max) return [257 + i, len - LEN_BASE[i], LEN_EXTRA[i]];
  }
  return [285, 0, 0];
}

function distCode(dist: number): [number, number, number] {
  for (let i = 0; i < 30; i++) {
    const max = DIST_BASE[i] + (1 << DIST_EXTRA[i]) - 1;
    if (dist <= max) return [i, dist - DIST_BASE[i], DIST_EXTRA[i]];
  }
  return [29, 0, 0];
}

function deflateFixed(input: Uint8Array): Uint8Array {
  const w = new BitWriter();
  w.writeBit(1); // BFINAL
  w.writeBits(1, 2); // BTYPE = 01 fixed Huffman
  // hash -> last few positions
  const table = new Map<number, number[]>();
  const n = input.length;
  let pos = 0;
  while (pos < n) {
    let bestLen = 0;
    let bestDist = 0;
    if (pos + 3 <= n) {
      const h = ((input[pos] << 16) ^ (input[pos + 1] << 8) ^ input[pos + 2]) & 0xffff;
      const cands = table.get(h);
      if (cands) {
        const maxLen = Math.min(258, n - pos);
        for (let ci = cands.length - 1; ci >= 0 && ci >= cands.length - 4; ci--) {
          const q = cands[ci];
          const dist = pos - q;
          if (dist <= 0 || dist > 32768) continue;
          let l = 0;
          while (l < maxLen && input[q + l] === input[pos + l]) l++;
          if (l > bestLen && l >= 3) {
            bestLen = l;
            bestDist = dist;
            if (l >= maxLen) break;
          }
        }
      }
      const arr = cands ?? [];
      arr.push(pos);
      if (arr.length > 8) arr.shift();
      table.set(h, arr);
    }
    if (bestLen >= 3) {
      const [sym, extra, ebits] = lenCode(bestLen);
      const [dcode, dextra, dbits] = distCode(bestDist);
      const [lc, ll] = litCode(sym);
      w.writeCode(lc, ll);
      if (ebits > 0) w.writeBits(extra, ebits);
      // distance codes are 5-bit Huffman codes: emitted MSB first
      w.writeCode(dcode, 5);
      if (dbits > 0) w.writeBits(dextra, dbits);
      // register hashes for the skipped positions
      for (let k = 1; k < bestLen; k++) {
        const p = pos + k;
        if (p + 3 <= n) {
          const h = ((input[p] << 16) ^ (input[p + 1] << 8) ^ input[p + 2]) & 0xffff;
          const a = table.get(h) ?? [];
          a.push(p);
          if (a.length > 8) a.shift();
          table.set(h, a);
        }
      }
      pos += bestLen;
    } else {
      const [code, len] = litCode(input[pos]);
      w.writeCode(code, len);
      pos++;
    }
  }
  const [ec, el] = litCode(256); // end of block
  w.writeCode(ec, el);
  return w.finish();
}

function u32be(v: number): Uint8Array {
  const b = new Uint8Array(4);
  b[0] = (v >>> 24) & 0xff;
  b[1] = (v >>> 16) & 0xff;
  b[2] = (v >>> 8) & 0xff;
  b[3] = v & 0xff;
  return b;
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  out.set(u32be(data.length), 0);
  const tb = new TextEncoder().encode(type);
  out.set(tb, 4);
  out.set(data, 8);
  const crcData = new Uint8Array(4 + data.length);
  crcData.set(tb, 0);
  crcData.set(data, 4);
  out.set(u32be(crc32(crcData)), 8 + data.length);
  return out;
}

function encodePNG(): Uint8Array {
  // raw scanlines: filter byte 0 + RGB rows
  const raw = new Uint8Array(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0;
    raw.set(img.subarray(y * W * 3, (y + 1) * W * 3), y * (1 + W * 3) + 1);
  }
  const deflated = deflateFixed(raw);
  const z = new Uint8Array(2 + deflated.length + 4);
  z[0] = 0x78;
  z[1] = 0x9c;
  z.set(deflated, 2);
  z.set(u32be(adler32(raw)), 2 + deflated.length);
  const ihdr = new Uint8Array(13);
  ihdr.set(u32be(W), 0);
  ihdr.set(u32be(H), 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type RGB
  const sig = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  const parts = [sig, chunk('IHDR', ihdr), chunk('IDAT', z), chunk('IEND', new Uint8Array(0))];
  let total = 0;
  for (const p of parts) total += p.length;
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.length;
  }
  return out;
}

// ---------------------------------------------------------------- layout
function rule(y: number, t: number): void {
  hline(36, y, W - 72, t, INK);
}

function drawPanel(
  x: number,
  y: number,
  w: number,
  h: number,
  pic: (bx: number, by: number, sz: number) => void,
  headline: string,
  body: string,
): void {
  // frame
  fillRect(x, y, w, 1, INK);
  fillRect(x, y + h - 1, w, 1, INK);
  fillRect(x, y, 1, h, INK);
  fillRect(x + w - 1, y, 1, h, INK);
  const psz = 104;
  const px0 = x + 10;
  const py0 = y + 10;
  pic(px0, py0, psz);
  fillRect(px0, py0, psz, 1, INK);
  fillRect(px0, py0 + psz - 1, psz, 1, INK);
  fillRect(px0, py0, 1, psz, INK);
  fillRect(px0 + psz - 1, py0, 1, psz, INK);
  const tx = px0 + psz + 12;
  const tw = x + w - 10 - tx;
  const headLines = wrap(headline, tw, 2.3);
  let yy = drawLines(headLines, tx, y + 12, 2.3, 17, INK);
  yy += 4;
  const bodyLines = wrap(body, tw, 1.6);
  drawLines(bodyLines, tx, yy, 1.6, 12, INK);
}

function main(): void {
  fill(PAPER);

  // Masthead
  drawTextCentered('THE WORLD TODAY', W / 2, 26, 10, INK);
  rule(108, 3);
  // Date in red — contains the '9' of 19, rendered bowl + right stem
  drawTextCentered('THURSDAY, 19 NOVEMBER 2026', W / 2, 122, 2.6, RED);
  rule(150, 2);

  // Top story
  drawTextCentered('TOP STORY', W / 2, 164, 1.8, RED);
  drawTextCentered('TRUMP, XI, PUTIN MEET', W / 2, 186, 5.6, INK);
  const deck = wrap(
    'THE FIRST THREE-WAY SUMMIT OF DONALD TRUMP, XI JINPING AND VLADIMIR PUTIN TAKES PLACE IN SHENZHEN AT APEC CHINA 2026, AND COULD RESHAPE DIPLOMACY, NUCLEAR TALKS AND GAZA PEACE EFFORTS.',
    W - 96,
    1.9,
  );
  drawLines(deck, 48, 240, 1.9, 15, INK);
  rule(312, 2);

  // Panels: two rows of two, then one wide panel
  const PW = 464;
  const PH = 158;
  const gap = 24;
  const x0 = 36;
  const x1 = x0 + PW + gap;
  const y0 = 330;
  drawPanel(x0, y0, PW, PH, picChart, "ANTHROPIC'S $81.3BN IPO",
    'THE AI GIANT MAKES A HISTORIC MARKET DEBUT. SHARES PRICED AT $83, RAISING A RECORD $81.3 BILLION, THE BIGGEST IPO OF ALL TIME.');
  drawPanel(x1, y0, PW, PH, picCity, 'GTA 6 ROLLS OUT',
    'GRAND THEFT AUTO VI BEGINS ITS GLOBAL ROLLOUT. GAMERS ENTER VICE CITY AS THE UK RELEASE LANDS AFTER A 13-YEAR WAIT.');
  drawPanel(x0, y0 + PH + 14, PW, PH, picTent, 'ISRAEL GROUND OP IN GAZA',
    'ISRAELI TROOPS LAUNCH A GROUND OPERATION IN CENTRAL GAZA. DOZENS OF DISPLACED PALESTINIANS FLEE THEIR TENTS AND SHELTERS.');
  drawPanel(x1, y0 + PH + 14, PW, PH, picBridge, 'KERCH BRIDGE HIT AGAIN',
    'TRAFFIC ACROSS THE CRIMEAN BRIDGE IS SUSPENDED AFTER A NEW ATTACK, DAYS AFTER UKRAINIAN STRIKES HIT THE KEY SUPPLY ROUTE.');
  // Wide panel: Jeffries
  const wy = y0 + (PH + 14) * 2;
  drawPanel(x0, wy, PW * 2 + gap, 128, picCapitol, 'JEFFRIES MAKES HISTORY',
    'DEMOCRAT HAKEEM JEFFRIES IS SET TO BECOME THE FIRST AFRICAN-AMERICAN SPEAKER OF THE US HOUSE.');

  // Brief strip
  const by = wy + 128 + 16;
  rule(by, 2);
  drawText('IN BRIEF', 36, by + 12, 1.9, RED);
  const briefs: [string, string][] = [
    ['NORTH KOREA FIRES MISSILES', 'BALLISTIC MISSILES AFTER A US-SOUTH KOREA-JAPAN DRILL.'],
    ['VOYAGER 1 HITS LIGHT-DAY', 'NASA PROBE REACHES ONE LIGHT-DAY FROM EARTH, 50 YEARS AFTER LAUNCH.'],
    ["EU'S 45BN EURO LOAN", 'LOAN TO UKRAINE TO BE REPAID AFTER RUSSIA PAYS REPARATIONS.'],
    ['HOUTHIS SEIZE RED SEA COAST', 'BAB EL-MANDEB POSITIONS TAKEN AS YEMENI FORCES WITHDRAW TO DEFEND ADEN.'],
    ['ESTONIA CLOSES RUSSIA BORDER', 'ROAD CROSSINGS SHUT FROM 1 DECEMBER AFTER AN ALLEGED GRU SABOTAGE ATTEMPT.'],
  ];
  const colW = 184;
  const colGap = 8;
  let bx = 36;
  for (const [head, body] of briefs) {
    vline(bx - 6, by + 34, 118, 1, GREY);
    const hl = wrap(head, colW, 1.8);
    let yy = drawLines(hl, bx, by + 34, 1.8, 14, RED);
    yy += 3;
    const bl = wrap(body, colW, 1.6);
    drawLines(bl, bx, yy, 1.6, 12, INK);
    bx += colW + colGap;
  }

  // Footer
  drawTextCentered('THE WORLD TODAY - THURSDAY, 19 NOVEMBER 2026', W / 2, 1000, 1.4, GREY);

  const png = encodePNG();
  fs.mkdirSync('/output', { recursive: true });
  fs.writeFileSync('/output/entry.png', png);
  const hash = crypto.createHash('sha256').update(png).digest('hex');
  console.log(`wrote /output/entry.png ${png.length} bytes sha256=${hash}`);
}

main();
