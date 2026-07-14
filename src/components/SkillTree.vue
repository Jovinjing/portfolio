<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import type { Project } from '../types/project'
import SkillTreeNode from './SkillTreeNode.vue'

const props = defineProps<{
  projects: Project[]
}>()

const router = useRouter()
const hoveredProject = ref<string | null>(null)

function handleNodeHover(project: Project | null) {
  hoveredProject.value = project?.id ?? null
}

function handleNodeClick(projectId: string) {
  router.push({ name: 'project-detail', params: { id: projectId } })
}
</script>

<template>
  <div class="skill-tree relative flex items-center justify-center w-full">
    <!-- SVG 连接线 -->
    <svg
      class="absolute inset-0 w-full h-full pointer-events-none z-0"
      viewBox="0 0 800 500"
      preserveAspectRatio="xMidYMid meet"
    >
      <!-- 从根节点到三个分支节点的路径 -->
      <!-- 中心点从 (400, 80) 出发，到各个分支末端 -->
      <path
        v-for="(_, i) in projects"
        :key="i"
        :d="`
          M 400 80
          C ${400 + (i - 1) * 100} 180,
            ${200 + i * 200} 200,
            ${200 + i * 200} 250
        `"
        fill="none"
        stroke="#cbd5e1"
        stroke-width="2.5"
        stroke-linecap="round"
        class="transition-all duration-500"
        :class="hoveredProject ? 'opacity-40' : 'opacity-100'"
      />
    </svg>

    <!-- 根节点（你） -->
    <div class="absolute top-0 left-1/2 -translate-x-1/2 z-10">
      <div
        class="
          flex flex-col items-center gap-2 px-6 py-4
          rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900
          text-white shadow-lg
        "
      >
        <div class="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-2xl font-bold">
          <!-- 这里可以换成你的头像 -->
          
        </div>
        <div class="text-center">
          <h1 class="text-lg font-bold">黄靖莹</h1>
          <p class="text-xs text-slate-300 mt-0.5">计算机科学与技术 · 大三</p>
        </div>
      </div>
    </div>

    <!-- 项目节点（水平均匀分布） -->
    <div class="flex justify-between items-end w-full max-w-3xl mt-52 px-4 z-10">
      <SkillTreeNode
        v-for="(project, index) in projects"
        :key="project.id"
        :project="project"
        :index="index"
        :is-hovered="hoveredProject === project.id"
        @hover="handleNodeHover"
        @click="handleNodeClick"
      />
    </div>
  </div>
</template>
