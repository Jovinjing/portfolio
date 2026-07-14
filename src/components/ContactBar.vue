<script setup lang="ts">
import { ref } from 'vue'

const contacts = [
  {
    name: 'GitHub',
    icon: 'M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z',
    action: 'link',
    value: 'https://github.com/Jovinjing',
  },
  {
    name: 'QQ',
    icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 16.5c-2.5 0-4.5-1.5-4.5-3.5h9c0 2-2 3.5-4.5 3.5zm-3-7a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm6 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3z',
    action: 'copy',
    value: '2403106324',
  },
  {
    name: '邮箱',
    icon: 'M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z',
    action: 'copy',
    value: '2403106324@qq.com',
  },
]

const feedback = ref<string | null>(null)
const feedbackTimer = ref<ReturnType<typeof setTimeout> | null>(null)

function handleClick(item: (typeof contacts)[0]) {
  if (item.action === 'link') {
    window.open(item.value, '_blank')
  } else {
    navigator.clipboard.writeText(item.value).then(() => {
      showFeedback(`${item.name} 已复制！`)
    })
  }
}

function showFeedback(msg: string) {
  feedback.value = msg
  if (feedbackTimer.value) clearTimeout(feedbackTimer.value)
  feedbackTimer.value = setTimeout(() => {
    feedback.value = null
  }, 2000)
}
</script>

<template>
  <div class="relative">
    <div class="flex items-center justify-center gap-6 py-4">
      <button
        v-for="item in contacts"
        :key="item.name"
        class="
          contact-btn group relative flex items-center justify-center
          w-12 h-12 rounded-xl bg-white/70 border border-sky-200/50
          shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 hover:border-sky-400/60
          transition-all duration-200 cursor-pointer
          focus-visible:outline-2 focus-visible:outline-blue-500
        "
        :title="item.name === 'GitHub' ? '打开 GitHub' : `复制 ${item.name}`"
        @click="handleClick(item)"
      >
        <svg
          class="w-5 h-5 text-slate-500 group-hover:text-sky-500 transition-colors"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path :d="item.icon" />
        </svg>
        <!-- 悬停提示 -->
        <span
          class="
            absolute -top-8 left-1/2 -translate-x-1/2
            px-2 py-1 rounded-md bg-slate-800 text-white text-xs
            opacity-0 group-hover:opacity-100
            transition-opacity duration-200 pointer-events-none
            whitespace-nowrap
          "
        >
          {{ item.name === 'GitHub' ? item.value : item.value }}
        </span>
      </button>
    </div>

    <!-- 复制反馈浮窗 -->
    <Transition name="toast">
      <div
        v-if="feedback"
        class="
          absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full
          px-4 py-2 rounded-lg bg-sky-800 text-white text-sm shadow-lg shadow-sky-900/20
          whitespace-nowrap
        "
      >
        {{ feedback }}
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.9);
}
.toast-enter-to,
.toast-leave-from {
  opacity: 1;
  transform: translate(-50%, -100%) scale(1);
}
</style>
