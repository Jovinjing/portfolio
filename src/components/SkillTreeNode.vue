<script setup lang="ts">
import { computed } from 'vue'
import type { Project } from '../types/project'

const props = defineProps<{
  project: Project
  /** 节点在树中的位置（用于 SVG 连线） */
  index: number
  /** 是否处于悬停状态 */
  isHovered: boolean
}>()

const emit = defineEmits<{
  hover: [project: Project | null]
  click: [projectId: string]
}>()

/** 节点颜色——根据索引轮转 */
const nodeColor = computed(() => {
  const colors = [
    'from-blue-500 to-blue-600',
    'from-emerald-500 to-emerald-600',
    'from-violet-500 to-violet-600',
  ]
  return colors[props.index % colors.length]
})

/** 浮窗位置——交替上/下防止遮挡 */
const tooltipSide = computed(() => (props.index % 2 === 0 ? 'top' : 'bottom'))
</script>

<template>
  <div class="flex flex-col items-center">
    <!-- 可点击的项目节点 -->
    <button
      class="
        group relative flex flex-col items-center gap-1 px-4 py-3
        rounded-xl bg-white border-2 border-slate-200
        shadow-sm cursor-pointer select-none
        transition-all duration-300 ease-out
        hover:shadow-lg hover:-translate-y-1 hover:border-slate-300
        focus-visible:outline-2 focus-visible:outline-blue-500
      "
      @mouseenter="emit('hover', project)"
      @mouseleave="emit('hover', null)"
      @click="emit('click', project.id)"
    >
      <!-- 渐变色指示条 -->
      <div
        class="absolute -top-0.5 left-2 right-2 h-1 rounded-full bg-gradient-to-r"
        :class="nodeColor"
      />

      <!-- 项目图标 -->
      <div
        class="w-10 h-10 rounded-lg flex items-center justify-center text-white text-lg font-bold bg-gradient-to-br shadow-sm"
        :class="nodeColor"
      >
        {{ project.title.charAt(0) }}
      </div>

      <!-- 项目名称 -->
      <span class="text-sm font-semibold text-slate-800 mt-1">
        {{ project.title }}
      </span>

      <!-- 技术栈标签迷你版 -->
      <div class="flex flex-wrap justify-center gap-1 max-w-32">
        <span
          v-for="tech in project.techStack.slice(0, 2)"
          :key="tech"
          class="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500"
        >
          {{ tech }}
        </span>
        <span
          v-if="project.techStack.length > 2"
          class="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-400"
        >
          +{{ project.techStack.length - 2 }}
        </span>
      </div>
    </button>

    <!-- 浮窗（悬停时显示） -->
    <Transition name="tooltip">
      <div
        v-if="isHovered"
        class="
          absolute z-50 w-64 p-4 rounded-xl bg-white border border-slate-200
          shadow-xl pointer-events-none
        "
        :class="tooltipSide === 'top' ? '-top-2 -translate-y-full' : '-bottom-2 translate-y-full'"
      >
        <p class="text-sm text-slate-700 leading-relaxed">
          {{ project.tagline }}
        </p>
        <div class="flex flex-wrap gap-1.5 mt-2">
          <span
            v-for="tech in project.techStack"
            :key="tech"
            class="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600"
          >
            {{ tech }}
          </span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.tooltip-enter-active,
.tooltip-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
