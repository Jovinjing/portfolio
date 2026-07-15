<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

// ══════════════════════════════════════════════════════════
//  设计：四区首字母光斑（H · P · S · E）+ 暖白色扁椭圆
//  20 个扁椭圆光斑 — 在天空蓝背景上像云朵般柔和
// ══════════════════════════════════════════════════════════

const canvasRef = ref<HTMLCanvasElement | null>(null)
let animationId = 0
let time = 0

// ── 鼠标 ──
const mouse = { x: -9999, y: -9999 }
const smooth = { x: -9999, y: -9999 }

// ── 区域切换 ──
let activeSection = 0
let prevSection = 0
let sectionBlend = 1

function onScroll() {
  const sections = ['hero', 'projects', 'skills', 'experience']
  let maxVis = 0
  let maxIdx = 0
  for (let i = 0; i < sections.length; i++) {
    const el = document.getElementById(sections[i])
    if (!el) continue
    const rect = el.getBoundingClientRect()
    const vis = Math.max(0, Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0))
    if (vis > maxVis) { maxVis = vis; maxIdx = i }
  }
  if (maxIdx !== activeSection) {
    prevSection = activeSection
    activeSection = maxIdx
    sectionBlend = 0
  }
}

// ══════════════════════════════════════════════════════════
//  首字母点阵 — 20 个归一化 [x, y]（范围 0‑1）
//  全部暖白色，只区分 结构点(0-15) / 暖点(16-17) / 游离(18-19)
// ══════════════════════════════════════════════════════════
type Point = [number, number]

const LETTERS: Point[][] = [
  // ── H ──
  [
    [0.08, 0.10], [0.08, 0.24], [0.08, 0.38], [0.08, 0.52],
    [0.08, 0.66], [0.08, 0.80], [0.08, 0.94],
    [0.92, 0.10], [0.92, 0.24], [0.92, 0.38], [0.92, 0.52],
    [0.92, 0.66], [0.92, 0.80], [0.92, 0.94],
    [0.24, 0.52], [0.52, 0.52],
    [0.66, 0.52], [0.80, 0.52],
    [0.30, 0.18], [0.72, 0.82],
  ],
  // ── P ──
  [
    [0.12, 0.08], [0.12, 0.22], [0.12, 0.36], [0.12, 0.50],
    [0.12, 0.64], [0.12, 0.78], [0.12, 0.92],
    [0.30, 0.08], [0.48, 0.06], [0.66, 0.10],
    [0.82, 0.16], [0.92, 0.28], [0.92, 0.42],
    [0.82, 0.52], [0.66, 0.54], [0.48, 0.50],
    [0.30, 0.50], [0.48, 0.50],
    [0.20, 0.20], [0.80, 0.80],
  ],
  // ── S ──
  [
    [0.20, 0.08], [0.36, 0.04], [0.52, 0.06], [0.68, 0.10],
    [0.80, 0.18], [0.88, 0.30], [0.88, 0.42],
    [0.78, 0.52], [0.64, 0.54], [0.48, 0.52],
    [0.32, 0.50], [0.18, 0.52], [0.12, 0.64], [0.12, 0.76],
    [0.20, 0.86], [0.36, 0.92],
    [0.52, 0.94], [0.68, 0.90],
    [0.40, 0.30], [0.70, 0.70],
  ],
  // ── E ──
  [
    [0.08, 0.12], [0.08, 0.28], [0.08, 0.44],
    [0.08, 0.56], [0.08, 0.72], [0.08, 0.88],
    [0.26, 0.12], [0.44, 0.10], [0.62, 0.12], [0.80, 0.18],
    [0.26, 0.44], [0.44, 0.44], [0.62, 0.44],
    [0.26, 0.88], [0.44, 0.90], [0.62, 0.88],
    [0.80, 0.82], [0.50, 0.44],
    [0.66, 0.04], [0.30, 0.60],
  ],
]

// ══════════════════════════════════════════════════════════
//  暖白色 — 所有光斑统一色
//  结构点(0-15)：较亮，稍大
//  暖亮点(16-17)：更亮微暖，稍大
//  游离点(18-19)：最大，最通透，浮动感
// ══════════════════════════════════════════════════════════
const WARM_WHITE = { r: 255, g: 250, b: 240 }  // #FFFAF0

interface Blob {
  x: number; y: number
  tx: number; ty: number
  ptx: number; pty: number
  rx: number; ry: number      // 扁椭圆：rx >> ry
  phase: number
  driftAmp: number
  speed: number
  follow: number
  baseSize: number
  alpha: number               // 基础透明度
  isExtra: boolean            // 暖亮/游离点
}

function createBlob(i: number): Blob {
  const isFloater = i >= 18
  const isExtra = i >= 16
  const [tx, ty] = LETTERS[0][i]
  return {
    x: tx, y: ty, tx, ty, ptx: tx, pty: ty,
    rx: 0, ry: 0,
    phase: Math.random() * Math.PI * 2,
    driftAmp: isFloater ? 0.14 : 0.05,
    speed: 0.15 + Math.random() * 0.25,
    follow: isFloater ? 0.30 : isExtra ? 0.22 : 0.18,
    baseSize: isFloater ? 0.080 : isExtra ? 0.090 : 0.075,
    alpha: isFloater ? 0.22 : isExtra ? 0.30 : 0.24,
    isExtra,
  }
}

const blobs: Blob[] = Array.from({ length: 20 }, (_, i) => createBlob(i))

function initBlobs(w: number, _h: number) {
  for (const b of blobs) {
    // 扁椭圆：x 半径大，y 半径小（~1/4 的 x 半径）
    b.rx = w * b.baseSize
    b.ry = b.rx * 0.22
  }
}

// ══════════════════════════════════════════════════════════
//  背景渐变 — 天空蓝色调，但比原来更柔和
//  移除背景的淡蓝内容联动（保留微差异即可）
// ══════════════════════════════════════════════════════════
function drawBg(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // 统一柔和的天空蓝渐变
  const grad = ctx.createLinearGradient(0, 0, 0, h)
  grad.addColorStop(0, '#F0F9FF')
  grad.addColorStop(0.35, '#E0F2FE')
  grad.addColorStop(0.65, '#BAE6FD')
  grad.addColorStop(1, '#E0F2FE')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)
}

// ══════════════════════════════════════════════════════════
//  渲染扁椭圆光斑
// ══════════════════════════════════════════════════════════
function drawBlobs(ctx: CanvasRenderingContext2D, w: number, h: number) {
  for (const b of blobs) {
    // ── 正弦漂移 ──
    const dx = Math.sin(time * b.speed + b.phase) * b.driftAmp * w
    const dy = Math.cos(time * b.speed * 0.7 + b.phase) * b.driftAmp * h

    // ── 鼠标跟随 ──
    const fx = (smooth.x - b.x * w) * b.follow
    const fy = (smooth.y - b.y * h) * b.follow

    const cx = b.x * w + dx + fx
    const cy = b.y * h + dy + fy

    // ── 透明度微呼吸 ──
    const breath = 0.75 + Math.sin(time * 0.25 + b.phase) * 0.25
    const a = Math.min(0.55, b.alpha * breath)

    ctx.save()
    ctx.translate(cx, cy)
    // 扁椭圆：scale x 不变，y 压扁
    ctx.scale(1, 0.22)

    // ── 径向渐变光晕 ──
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, b.rx)
    grad.addColorStop(0,    `rgba(${WARM_WHITE.r},${WARM_WHITE.g},${WARM_WHITE.b},${Math.min(1, a * 2.0)})`)
    grad.addColorStop(0.15, `rgba(${WARM_WHITE.r},${WARM_WHITE.g},${WARM_WHITE.b},${a * 0.85})`)
    grad.addColorStop(0.35, `rgba(${WARM_WHITE.r},${WARM_WHITE.g},${WARM_WHITE.b},${a * 0.30})`)
    grad.addColorStop(0.60, `rgba(${WARM_WHITE.r},${WARM_WHITE.g},${WARM_WHITE.b},${a * 0.06})`)
    grad.addColorStop(1,    `rgba(${WARM_WHITE.r},${WARM_WHITE.g},${WARM_WHITE.b},0)`)
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(0, 0, b.rx, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }
}

// ══════════════════════════════════════════════════════════
//  主循环
// ══════════════════════════════════════════════════════════
function computeTargets() {
  if (sectionBlend < 1) sectionBlend = Math.min(1, sectionBlend + 0.03)
  const currLetter = LETTERS[activeSection]
  const prevLetter = LETTERS[prevSection]
  for (let i = 0; i < blobs.length; i++) {
    const b = blobs[i]
    if (sectionBlend < 1) {
      const [ctx, cty] = currLetter[i]
      const [ptx, pty] = prevLetter[i]
      b.tx = ptx + (ctx - ptx) * sectionBlend
      b.ty = pty + (cty - pty) * sectionBlend
    } else {
      const [tx, ty] = currLetter[i]
      b.tx = tx
      b.ty = ty
    }
  }
}

function draw(ctx: CanvasRenderingContext2D, w: number, h: number) {
  time += 0.005
  computeTargets()
  for (const b of blobs) {
    b.x += (b.tx - b.x) * 0.03
    b.y += (b.ty - b.y) * 0.03
  }
  drawBg(ctx, w, h)
  drawBlobs(ctx, w, h)
}

function loop() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const w = window.innerWidth
  const h = window.innerHeight
  smooth.x += (mouse.x - smooth.x) * 0.06
  smooth.y += (mouse.y - smooth.y) * 0.06
  ctx.clearRect(0, 0, w, h)
  draw(ctx, w, h)
  animationId = requestAnimationFrame(loop)
}

// ══════════════════════════════════════════════════════════
//  生命周期
// ══════════════════════════════════════════════════════════
function onResize() {
  const canvas = canvasRef.value
  if (!canvas) return
  const w = window.innerWidth
  const h = window.innerHeight
  canvas.width = w * devicePixelRatio
  canvas.height = h * devicePixelRatio
  canvas.style.width = w + 'px'
  canvas.style.height = h + 'px'
  const ctx = canvas.getContext('2d')
  if (ctx) ctx.scale(devicePixelRatio, devicePixelRatio)
  initBlobs(w, h)
}

function onMouseMove(e: MouseEvent) {
  mouse.x = e.clientX
  mouse.y = e.clientY
}

function onMouseLeave() {
  mouse.x = -9999
  mouse.y = -9999
}

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return
  const w = window.innerWidth
  const h = window.innerHeight
  canvas.width = w * devicePixelRatio
  canvas.height = h * devicePixelRatio
  canvas.style.width = w + 'px'
  canvas.style.height = h + 'px'
  const ctx = canvas.getContext('2d')
  if (ctx) ctx.scale(devicePixelRatio, devicePixelRatio)
  initBlobs(w, h)
  smooth.x = w / 2
  smooth.y = h / 2
  onScroll()
  loop()
  window.addEventListener('resize', onResize)
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseleave', onMouseLeave)
  window.addEventListener('scroll', onScroll, { passive: true })
})

onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId)
  window.removeEventListener('resize', onResize)
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseleave', onMouseLeave)
  window.removeEventListener('scroll', onScroll)
})
</script>

<template>
  <canvas
    ref="canvasRef"
    class="fixed inset-0 w-full h-full pointer-events-none"
    style="z-index: 0"
  />
</template>
