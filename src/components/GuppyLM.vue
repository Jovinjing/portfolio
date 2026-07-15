<script setup lang="ts">
import { ref, onMounted } from 'vue'

// ── 模型配置 ──
const CONFIG = {
  vocab_size: 4096, max_seq_len: 128, d_model: 384,
  n_layers: 6, n_heads: 6, ffn_hidden: 768,
  pad_id: 0, bos_id: 1, eos_id: 2,
}
const GEN = { temperature: 0.7, top_k: 50, max_tokens: 32 }

// ── 对话话题（点击时随机挑一个问它） ──
const TOPICS = [
  'hi guppy', 'do you like bubbles', 'tell me a joke',
  'what do you dream about', 'do you love me',
  'what is the meaning of life', 'the cat is looking at you',
  'do you like music', 'do you like swimming',
  'how is the weather', 'what is your favorite color',
  'are you scared', 'are you bored',
]

// ── 状态 ──
const status = ref<'loading' | 'ready' | 'generating' | 'error'>('loading')
const loadDetail = ref('正在加载 tokenizer...')
const errorMsg = ref('')
const reply = ref('')
const isVisible = ref(false)

let session: any = null
let ortModule: any = null
let tokenizer: { encode: (t: string) => number[]; decode: (ids: number[]) => string } | null = null

// ── 加载模型 ──
async function loadModel() {
  try {
    loadDetail.value = '正在加载 tokenizer...'
    const tokResp = await fetch('/tokenizer.json')
    const tokJson = await tokResp.json()
    tokenizer = buildTokenizer(tokJson)

    loadDetail.value = '正在下载模型 (~10 MB)...'
// @ts-ignore — onnxruntime-web CDN module has no types
    ortModule = await import('https://cdn.jsdelivr.net/npm/onnxruntime-web@1.21.0/dist/ort.min.mjs')
    ortModule.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.21.0/dist/'

    const modelResp = await fetch('/model.onnx')
    const modelBuf = await modelResp.arrayBuffer()
    session = await ortModule.InferenceSession.create(modelBuf, {
      executionProviders: ['wasm'],
    })

    status.value = 'ready'
  } catch (e: any) {
    status.value = 'error'
    errorMsg.value = e?.message || '模型加载失败，请检查网络后刷新重试'
  }
}

onMounted(() => {
  isVisible.value = true
  loadModel()
})

// ── 点击小鱼 → 吐一句话 ──
async function onFishClick() {
  if (status.value !== 'ready' || !session || !tokenizer) return

  status.value = 'generating'
  reply.value = ''

  // 随机选个话题
  const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)]

  try {
    const prompt = `<|im_start|>user\n${topic}<|im_end|>\n<|im_start|>assistant\n`
    const inputIds = tokenizer.encode(prompt)
    const outputIds = await generate(inputIds)
    let text = tokenizer.decode(outputIds).trim()

    if (text.includes('<|im_end|>')) text = text.split('<|im_end|>')[0]
    if (text.includes('<|im_start|>')) text = text.split('<|im_start|>')[0]
    text = text.trim() || 'blub.'

    reply.value = text
  } catch {
    reply.value = 'blub. (something went wrong)'
  }

  status.value = 'ready'
}

// ── 推理引擎 ──
async function generate(inputIds: number[]) {
  const ort = ortModule
  let ids = inputIds.slice()

  for (let i = 0; i < GEN.max_tokens; i++) {
    const seq = ids.slice(-CONFIG.max_seq_len)
    const tensor = new ort.Tensor('int64',
      BigInt64Array.from(seq.map(BigInt)), [1, seq.length])
    const out = await session!.run({ input_ids: tensor })
    const logits = out.logits.data as Float32Array

    const offset = (seq.length - 1) * CONFIG.vocab_size
    const lastLogits = new Float32Array(CONFIG.vocab_size)
    for (let v = 0; v < CONFIG.vocab_size; v++) {
      lastLogits[v] = logits[offset + v]
    }

    if (GEN.temperature !== 1.0) {
      for (let v = 0; v < CONFIG.vocab_size; v++) {
        lastLogits[v] /= GEN.temperature
      }
    }

    if (GEN.top_k > 0) {
      const sorted = [...lastLogits].sort((a, b) => b - a)
      const cutoff = sorted[Math.min(GEN.top_k, sorted.length - 1)]
      for (let v = 0; v < CONFIG.vocab_size; v++) {
        if (lastLogits[v] < cutoff) lastLogits[v] = -Infinity
      }
    }

    const maxVal = Math.max(...lastLogits.filter(v => v !== -Infinity))
    let sumExp = 0
    const probs = new Float32Array(CONFIG.vocab_size)
    for (let v = 0; v < CONFIG.vocab_size; v++) {
      probs[v] = Math.exp(lastLogits[v] - maxVal)
      sumExp += probs[v]
    }
    for (let v = 0; v < CONFIG.vocab_size; v++) probs[v] /= sumExp

    let r = Math.random(), acc = 0, nextId = 0
    for (let v = 0; v < CONFIG.vocab_size; v++) {
      acc += probs[v]
      if (acc >= r) { nextId = v; break }
    }

    ids.push(nextId)
    if (nextId === CONFIG.eos_id) break
  }

  return ids.slice(inputIds.length)
}

// ── Tokenizer ──
function buildTokenizer(json: any) {
  const vocab = json.model.vocab as Record<string, number>
  const merges = json.model.merges as string[]
  const added: Record<string, number> = {}
  for (const t of json.added_tokens) added[t.content] = t.id

  const id2token: Record<number, string> = {}
  for (const [tok, id] of Object.entries(vocab)) id2token[id] = tok
  for (const [tok, id] of Object.entries(added)) id2token[id] = tok

  const byte2char: Record<number, string> = {}
  const char2byte: Record<string, number> = {}
  const ranges = [[33, 126], [161, 172], [174, 255]]
  const direct = new Set<number>()
  for (const [lo, hi] of ranges) for (let b = lo; b <= hi; b++) direct.add(b)
  let n = 0
  for (let b = 0; b < 256; b++) {
    if (direct.has(b)) {
      byte2char[b] = String.fromCharCode(b)
    } else {
      byte2char[b] = String.fromCharCode(256 + n)
      n++
    }
  }
  for (const [b, c] of Object.entries(byte2char)) char2byte[c] = parseInt(String(b))

  const mergeRank: Record<string, number> = {}
  for (let i = 0; i < merges.length; i++) {
    const key = Array.isArray(merges[i]) ? (merges[i] as unknown as string[]).join(' ') : merges[i]
    mergeRank[key] = i
  }

  function bytesToTokenStr(bytes: Uint8Array) {
    return Array.from(bytes).map(b => byte2char[b]).join('')
  }

  function tokenStrToBytes(s: string) {
    return Uint8Array.from([...s].map(c => char2byte[c] ?? c.charCodeAt(0)))
  }

  function bpe(word: string[]) {
    if (word.length <= 1) return word
    let pieces = word.slice()
    while (pieces.length > 1) {
      let bestRank = Infinity, bestIdx = -1
      for (let i = 0; i < pieces.length - 1; i++) {
        const pair = pieces[i] + ' ' + pieces[i + 1]
        const rank = mergeRank[pair]
        if (rank !== undefined && rank < bestRank) { bestRank = rank; bestIdx = i }
      }
      if (bestIdx === -1) break
      const merged = pieces[bestIdx] + pieces[bestIdx + 1]
      pieces = [...pieces.slice(0, bestIdx), merged, ...pieces.slice(bestIdx + 2)]
    }
    return pieces
  }

  const PAT = /'(?:[sdmt]|ll|ve|re)| ?\p{L}+| ?\p{N}+| ?[^\s\p{L}\p{N}]+|\s+(?!\S)|\s+/gu

  function encode(text: string) {
    const specialPattern = Object.keys(added)
      .map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|')
    const specialRe = new RegExp(`(${specialPattern})`)
    const segments = text.split(specialRe)
    const ids: number[] = []
    for (const seg of segments) {
      if (seg === '') continue
      if (added[seg] !== undefined) { ids.push(added[seg]); continue }
      const words = seg.match(PAT) || [seg]
      for (const word of words) {
        const bytes = new TextEncoder().encode(word)
        const byteChars = [...bytesToTokenStr(bytes)]
        const tokens = bpe(byteChars)
        for (const tok of tokens) {
          const id = vocab[tok]
          if (id !== undefined) ids.push(id)
        }
      }
    }
    return ids
  }

  function decode(ids: number[]) {
    const parts: string[] = []
    for (const id of ids) {
      const tok = id2token[id]
      if (!tok || added[tok] !== undefined) continue
      parts.push(tok)
    }
    const allBytes = tokenStrToBytes(parts.join(''))
    return new TextDecoder('utf-8', { fatal: false }).decode(allBytes)
  }

  return { encode, decode }
}
</script>

<template>
  <div class="guppy-container flex flex-col items-center w-full max-w-lg mx-auto select-none">
    <!-- ===== 加载状态 ===== -->
    <div v-if="status === 'loading'" class="flex flex-col items-center gap-4 py-8 text-slate-400">
      <img src="/guppy.png" alt="Guppy" class="w-20 h-20 object-contain opacity-80" />
      <div class="w-8 h-8 border-3 border-sky-200 border-t-sky-400 rounded-full animate-spin" />
      <p class="text-sm">{{ loadDetail }}</p>
    </div>

    <!-- ===== 加载失败 ===== -->
    <div v-else-if="status === 'error'" class="flex flex-col items-center gap-4 py-8 text-slate-400">
      <img src="/guppy.png" alt="Guppy" class="w-20 h-20 object-contain opacity-60" />
      <p class="text-sm text-red-400">{{ errorMsg }}</p>
      <button
        class="px-4 py-2 rounded-lg bg-sky-800 text-white text-sm hover:bg-sky-700 transition-colors cursor-pointer"
        @click="loadModel"
      >
        重新加载
      </button>
    </div>

    <!-- ===== 就绪 ===== -->
    <template v-else>
      <!-- 可点击的 Guppy 小鱼 -->
      <div
        class="fish-clickable relative inline-block"
        :class="{ 'fish-visible': isVisible }"
        @click="onFishClick"
      >
        <img
          src="/guppy.png"
          alt="GuppyLM — 点我聊天"
          title="点我聊天 🐟"
          class="w-28 h-28 md:w-36 md:h-36 object-contain drop-shadow-lg floating-fish cursor-pointer transition-transform hover:scale-105 active:scale-95"
          :class="{ 'animate-wiggle': status === 'generating' }"
        />

        <!-- 装饰气泡 -->
        <div class="deco-bubbles">
          <span class="bubble b1" />
          <span class="bubble b2" />
          <span class="bubble b3" />
          <span class="bubble b4" />
          <span class="bubble b5" />
        </div>
      </div>

      <!-- ===== Guppy 吐出的文字（纯文字，无气泡） ===== -->
      <div class="mt-4 min-h-[2rem] text-center">
        <p
          v-if="status === 'generating'"
          class="text-sm text-sky-500 italic"
        >
          guppy is thinking<span class="animate-pulse">...</span>
        </p>
        <p
          v-else-if="reply"
          class="text-base md:text-lg text-slate-700 font-medium leading-relaxed transition-all duration-300"
        >
          {{ reply }}
        </p>
        <p
          v-else
          class="text-sm text-slate-400"
        >
          点击小鱼和它聊天 🐟
        </p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.fish-clickable {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.8s ease, transform 0.8s ease;
}
.fish-visible {
  opacity: 1;
  transform: translateY(0);
}

.floating-fish {
  animation: float 3s ease-in-out infinite;
}
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}
.floating-fish:hover {
  animation: float 3s ease-in-out infinite, pulse-glow 1.5s ease-in-out infinite;
}
@keyframes pulse-glow {
  0%, 100% { filter: drop-shadow(0 0 6px rgba(59,130,246,0.3)); }
  50% { filter: drop-shadow(0 0 16px rgba(59,130,246,0.6)); }
}

/* 生成时微微晃动 */
.animate-wiggle {
  animation: wiggle 0.3s ease-in-out infinite alternate !important;
}
@keyframes wiggle {
  0% { transform: rotate(-2deg); }
  100% { transform: rotate(2deg); }
}

/* 装饰气泡 */
.deco-bubbles {
  position: absolute;
  top: 0;
  right: -16px;
  pointer-events: none;
}
.deco-bubbles .bubble {
  position: absolute;
  border-radius: 50%;
  border: 2px solid rgba(59, 130, 246, 0.2);
  background: rgba(191, 219, 254, 0.3);
  animation: rise 2.5s ease-in infinite;
}
.b1 { width: 8px; height: 8px; left: 0; bottom: 10px; animation-delay: 0s; }
.b2 { width: 12px; height: 12px; left: 20px; bottom: 0; animation-delay: 0.8s; }
.b3 { width: 6px; height: 6px; left: 35px; bottom: 20px; animation-delay: 1.6s; }
.b4 { width: 10px; height: 10px; left: 10px; bottom: -10px; animation-delay: 2.1s; }
.b5 { width: 5px; height: 5px; left: 28px; bottom: 5px; animation-delay: 0.4s; }

@keyframes rise {
  0% { transform: translateY(0) scale(1); opacity: 0.6; }
  50% { opacity: 0.3; }
  100% { transform: translateY(-80px) scale(0.4); opacity: 0; }
}
</style>
