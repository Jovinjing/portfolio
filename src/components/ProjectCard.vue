<script setup lang="ts">
import { computed } from 'vue'
import type { Project } from '../types/project'

const props = defineProps<{
  project: Project
  index: number
}>()

const emit = defineEmits<{
  click: [projectId: string]
}>()

const techPreview = computed(() => {
  return props.project.techStack.slice(0, 4)
})
</script>

<template>
  <button
    class="
      project-card group relative w-full overflow-hidden
      rounded-2xl
      bg-gradient-to-b from-white/85 to-white/70
      border border-white/60
      shadow-[0_2px_8px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)]
      hover:shadow-[0_4px_12px_rgba(0,0,0,0.06),0_12px_32px_rgba(0,0,0,0.10)]
      hover:border-blue-300/60
      transition-all duration-300 ease-out
      cursor-pointer text-left
      focus-visible:outline-2 focus-visible:outline-blue-500
    "
    @click="emit('click', project.id)"
  >
    <!-- 顶部蓝色装饰条 -->
    <div class="h-1.5 w-full bg-gradient-to-r from-sky-300 via-blue-400 to-sky-300" />

    <!-- 图片预览区 -->
    <div
      v-if="project.images.length > 0"
      class="relative w-full h-36 md:h-40 overflow-hidden bg-sky-100"
    >
      <img
        :src="project.images[0]"
        :alt="project.title"
        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
        onerror="this.parentElement.innerHTML = '<div class=\'flex items-center justify-center h-full text-slate-400 text-xs\'>暂无截图</div>'"
      />
      <!-- 渐变遮罩（从透明到底部微白） -->
      <div class="absolute inset-0 bg-gradient-to-t from-white/60 via-transparent to-transparent" />
      <!-- 图片数量标记 -->
      <span
        v-if="project.images.length > 1"
        class="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/25 text-white text-[10px] font-medium backdrop-blur-sm"
      >
        +{{ project.images.length - 1 }}
      </span>
    </div>

    <div class="p-5 md:p-6">
      <!-- 标题行 -->
      <div class="flex items-start justify-between mb-3">
        <div>
          <h3 class="text-lg font-bold text-slate-800 group-hover:text-sky-700 transition-colors">
            {{ project.title }}
          </h3>
          <p class="text-sm text-slate-500 mt-0.5">{{ project.tagline }}</p>
        </div>

        <!-- 项目图标 -->
        <div
          class="
            flex-shrink-0 w-10 h-10 rounded-xl
            flex items-center justify-center
            text-white text-lg font-bold shadow-sm
            bg-gradient-to-br from-sky-400 to-blue-500
            transition-transform duration-300 group-hover:scale-110
            group-hover:shadow-md group-hover:shadow-blue-400/30
          "
        >
          {{ project.title.charAt(0) }}
        </div>
      </div>

      <!-- 概要描述 -->
      <p class="text-sm text-slate-600 leading-relaxed line-clamp-2 mb-4">
        {{ project.description }}
      </p>

      <!-- 技术栈标签 -->
      <div class="flex flex-wrap gap-1.5">
        <span
          v-for="tech in techPreview"
          :key="tech"
          class="text-xs px-2.5 py-1 rounded-full bg-sky-50 border border-sky-200/60 text-sky-700 font-medium"
        >
          {{ tech }}
        </span>
        <span
          v-if="project.techStack.length > 4"
          class="text-xs px-2.5 py-1 rounded-full bg-sky-50 border border-sky-200/60 text-sky-400"
        >
          +{{ project.techStack.length - 4 }}
        </span>
      </div>

      <!-- 悬停展开贡献点 -->
      <div
        class="
          mt-4 pt-4 border-t border-sky-200/40
          grid gap-2 opacity-0 max-h-0
          group-hover:opacity-100 group-hover:max-h-96
          transition-all duration-300 ease-out overflow-hidden
        "
      >
        <p class="text-xs font-semibold text-sky-600 uppercase tracking-wide">主要贡献</p>
        <ul class="space-y-1.5">
          <li
            v-for="(item, i) in project.contributions.slice(0, 3)"
            :key="i"
            class="flex items-start gap-2 text-xs text-slate-500"
          >
            <span class="mt-1.5 w-1.5 h-1.5 rounded-full bg-sky-400 flex-shrink-0" />
            {{ item }}
          </li>
        </ul>
      </div>

      <!-- 底部箭头提示 -->
      <div
        class="
          mt-3 flex items-center gap-1 text-xs font-medium text-blue-500
          opacity-0 group-hover:opacity-100
          transition-all duration-300
        "
      >
        查看详情
        <svg class="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  </button>
</template>
