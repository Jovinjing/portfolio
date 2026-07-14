<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const messages = [
	' Hi，我是黄靖莹>w<',
	' 广州应用科技学院 · 计算机科学与技术 · 27届 >',
	' 爱好：看书、听歌、打舟 w',
	' 意向：前端 / AI Agent / 测试开发 <',
]

const displayText = ref('')
const showCursor = ref(true)
const messageIndex = ref(0)
const charIndex = ref(0)
const isDeleting = ref(false)
const isWaiting = ref(false)
const isVisible = ref(false)

let timer: ReturnType<typeof setTimeout> | null = null
let cursorTimer: ReturnType<typeof setInterval> | null = null

function typeEffect() {
  const currentMessage = messages[messageIndex.value]

  if (!isDeleting.value && !isWaiting.value) {
    if (charIndex.value < currentMessage.length) {
      displayText.value = currentMessage.slice(0, charIndex.value + 1)
      charIndex.value++
      timer = setTimeout(typeEffect, 55 + Math.random() * 40)
    } else {
      isWaiting.value = true
      timer = setTimeout(typeEffect, 2000)
    }
  } else if (isWaiting.value) {
    isWaiting.value = false
    isDeleting.value = true
    timer = setTimeout(typeEffect, 300)
  } else {
    if (charIndex.value > 0) {
      displayText.value = currentMessage.slice(0, charIndex.value - 1)
      charIndex.value--
      timer = setTimeout(typeEffect, 20 + Math.random() * 15)
    } else {
      isDeleting.value = false
      messageIndex.value = (messageIndex.value + 1) % messages.length
      timer = setTimeout(typeEffect, 400)
    }
  }
}

onMounted(() => {
  isVisible.value = true
  timer = setTimeout(typeEffect, 800)
  cursorTimer = setInterval(() => {
    showCursor.value = !showCursor.value
  }, 530)
})

onUnmounted(() => {
  if (timer) clearTimeout(timer)
  if (cursorTimer) clearInterval(cursorTimer)
})
</script>

<template>
	<div
		class="typewriter-bubble transition-all duration-800"
		:class="{ 'opacity-100 translate-y-0': isVisible, 'opacity-0 translate-y-4': !isVisible }"
	>
		<div
			class="
				px-5 py-3 rounded-2xl
				bg-gradient-to-b from-white/85 to-white/70 backdrop-blur-md
				border border-white/60 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)]
				max-w-md mx-auto
			"
		>
			<p class="text-base md:text-lg text-slate-700 font-medium leading-relaxed text-center min-h-[1.75rem]">
				{{ displayText }}<span class="cursor" :class="{ 'cursor-hidden': !showCursor }">|</span>
			</p>
		</div>
	</div>
</template>

<style scoped>
.cursor {
	color: #38BDF8;
	font-weight: 300;
	transition: opacity 0.1s;
}
.cursor-hidden {
	opacity: 0;
}
</style>
