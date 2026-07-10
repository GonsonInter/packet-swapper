// 生成扩展图标 PNG（无第三方依赖，手写最小 PNG 编码 + 4× 超采样抗锯齿）。
// 图形：蓝色圆角底（细微渐变）+ 白色双向交换箭头（⇄），呼应「调包/交换」。
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])))
  return Buffer.concat([len, typeBuf, data, crc])
}

function encodePng(size, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  const raw = Buffer.alloc((size * 4 + 1) * size)
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0 // filter none
    for (let x = 0; x < size; x++) {
      const src = (y * size + x) * 4
      const dst = y * (size * 4 + 1) + 1 + x * 4
      raw[dst] = rgba[src]
      raw[dst + 1] = rgba[src + 1]
      raw[dst + 2] = rgba[src + 2]
      raw[dst + 3] = rgba[src + 3]
    }
  }
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const lerp = (a, b, t) => a + (b - a) * t

// 圆角矩形 SDF（占满 [0,1]²，圆角半径 r）：<0 在内部
function sdRoundRect(x, y, r) {
  const dx = Math.abs(x - 0.5) - (0.5 - r)
  const dy = Math.abs(y - 0.5) - (0.5 - r)
  const outside = Math.hypot(Math.max(dx, 0), Math.max(dy, 0))
  const inside = Math.min(Math.max(dx, dy), 0)
  return outside + inside
}

// 点到线段距离（胶囊体判定用）
function segDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax
  const dy = by - ay
  const t = clamp(((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy), 0, 1)
  return Math.hypot(px - (ax + dx * t), py - (ay + dy * t))
}

// 点是否在三角形内
function inTri(px, py, ax, ay, bx, by, cx, cy) {
  const d1 = (px - bx) * (ay - by) - (ax - bx) * (py - by)
  const d2 = (px - cx) * (by - cy) - (bx - cx) * (py - cy)
  const d3 = (px - ax) * (cy - ay) - (cx - ax) * (py - ay)
  const neg = d1 < 0 || d2 < 0 || d3 < 0
  const pos = d1 > 0 || d2 > 0 || d3 > 0
  return !(neg && pos)
}

// 一支箭头 = 粗胶囊（杆）+ 三角（头）。dir: +1 朝右，-1 朝左
function inArrow(x, y, cy, dir) {
  const r = 0.05
  const tail = dir > 0 ? 0.26 : 0.74
  const neck = dir > 0 ? 0.58 : 0.42 // 杆与头交界
  const tip = dir > 0 ? 0.74 : 0.26
  if (segDist(x, y, tail, cy, neck, cy) <= r) return true
  const hh = 0.1 // 箭头半高
  return inTri(x, y, tip, cy, neck, cy - hh, neck, cy + hh)
}

function draw(size) {
  const SS = 4
  const rgba = new Uint8Array(size * size * 4)
  const radius = 0.22
  const bgTop = [59, 130, 246] // #3b82f6
  const bgBot = [37, 99, 235] // #2563eb

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let aSum = 0
      let rSum = 0
      let gSum = 0
      let bSum = 0
      let covered = 0
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const x = (px + (sx + 0.5) / SS) / size
          const y = (py + (sy + 0.5) / SS) / size
          if (sdRoundRect(x, y, radius) >= 0) continue // 圆角外：透明
          covered++
          let col
          if (inArrow(x, y, 0.4, 1) || inArrow(x, y, 0.6, -1)) {
            col = [255, 255, 255]
          } else {
            const t = clamp(y, 0, 1)
            col = [
              Math.round(lerp(bgTop[0], bgBot[0], t)),
              Math.round(lerp(bgTop[1], bgBot[1], t)),
              Math.round(lerp(bgTop[2], bgBot[2], t)),
            ]
          }
          rSum += col[0]
          gSum += col[1]
          bSum += col[2]
          aSum++
        }
      }
      const i = (py * size + px) * 4
      const total = SS * SS
      rgba[i + 3] = Math.round((covered / total) * 255)
      if (aSum > 0) {
        rgba[i] = Math.round(rSum / aSum)
        rgba[i + 1] = Math.round(gSum / aSum)
        rgba[i + 2] = Math.round(bSum / aSum)
      }
    }
  }
  return rgba
}

const outDir = resolve(process.cwd(), 'public/icons')
mkdirSync(outDir, { recursive: true })
for (const size of [16, 48, 128]) {
  writeFileSync(resolve(outDir, `icon${size}.png`), encodePng(size, draw(size)))
  console.log(`wrote public/icons/icon${size}.png`)
}
