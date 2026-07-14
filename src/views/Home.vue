<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { projects } from '../data/projects'
import AnimatedFish from '../components/AnimatedFish.vue'
import GuppyLM from '../components/GuppyLM.vue'
import MeshBackground from '../components/MeshBackground.vue'
import ContactBar from '../components/ContactBar.vue'
import ProjectCard from '../components/ProjectCard.vue'

const router = useRouter()
const activeNav = ref('hero')

function scrollToSection(id: string) {
  activeNav.value = id
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

function goToProject(id: string) {
  router.push({ name: 'project-detail', params: { id } })
}

function onNavClick(sectionId: string) {
  scrollToSection(sectionId)
}

// ── IntersectionObserver: 导航高亮 + Scroll Reveal ──
onMounted(() => {
  const sections = ['hero', 'projects', 'skills', 'experience']
  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries.filter((e) => e.isIntersecting)
      if (visible.length > 0) {
        activeNav.value = visible[0].target.id
      }
    },
    { rootMargin: '-40% 0px -55% 0px' }
  )
  sections.forEach((id) => {
    const el = document.getElementById(id)
    if (el) observer.observe(el)
  })

  // ── Scroll Reveal: 监听 .reveal 元素 ──
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed')
          revealObserver.unobserve(entry.target) // 只触发一次
        }
      })
    },
    { rootMargin: '0px 0px -60px 0px', threshold: 0.1 }
  )
  // 延迟等 DOM 渲染后再找 .reveal 元素
  setTimeout(() => {
    document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el))
  }, 200)
})

// 技能列表
const skills = [
  { name: 'Vue 3 / Pinia', level: '熟练' },
  { name: 'TypeScript', level: '熟练' },
  { name: 'Vite', level: '熟练' },
  { name: 'Tailwind CSS', level: '熟练' },
  { name: 'ECharts / 数据可视化', level: '熟练' },
  { name: 'Three.js / 3D 建模', level: '掌握' },
  { name: '微信小程序', level: '掌握' },
  { name: 'Java / Spring Cloud', level: '掌握' },
  { name: 'MySQL / Redis', level: '掌握' },
  { name: 'AI 模型微调 (LoRA)', level: '掌握' },
  { name: 'Python', level: '了解' },
  { name: 'Docker / CI/CD', level: '了解' },
]

// 经历
const experiences = [
  {
    period: '2024.11 - 2025.03',
    title: '筑家无忧 — 智能空间设计平台',
    role: '前端开发',
    desc: '基于 Vue 3 + ECharts 的管理端开发，AI 对话流式渲染，LoRA 模型微调',
  },
  {
    period: '2024.09 - 2025.01',
    title: '桥形智见 — 桥型文化数据可视化平台',
    role: '3D 建模与前端开发',
    desc: 'Three.js GLTF 模型加载，高德地图 API 嵌入，ECharts 可视化',
  },
  {
    period: '2024.06 - 2024.09',
    title: '赵州桥科普小程序',
    role: '全栈开发',
    desc: 'Spring Cloud 微服务架构，LangChain4j AI 讲解，微信小程序前端',
  },
]
</script>

<template>
  <div class="min-h-screen relative">
    <!-- ========== 导航栏 ========== -->
    <header
      class="
        sticky top-0 z-50
        bg-white/60 backdrop-blur-lg
        border-b border-sky-200/40
      "
    >
      <nav class="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
        <span class="text-sm font-bold text-sky-700">黄靖莹/pac1</span>
        <div class="flex items-center gap-1">
          <button
            v-for="item in [
              { id: 'hero', label: '首页' },
              { id: 'projects', label: '项目' },
              { id: 'skills', label: '技能' },
              { id: 'experience', label: '经历' },
            ]"
            :key="item.id"
            class="
              px-3.5 py-1.5 rounded-lg text-sm font-medium
              transition-all duration-200 cursor-pointer
            "
            :class="
              activeNav === item.id
                ? 'bg-sky-500 text-white shadow-sm shadow-sky-300/50'
                : 'text-slate-500 hover:text-slate-800 hover:bg-sky-50'
            "
            @click="onNavClick(item.id)"
          >
            {{ item.label }}
          </button>
        </div>
      </nav>
    </header>

    <!-- ===== 背景网格动画 ===== -->
    <MeshBackground />

    <main class="relative z-10">
      <!-- ========== HERO：小鱼 + 联系栏 ========== -->
      <section id="hero" class="relative pt-12 pb-8 md:pt-16 md:pb-12">
        <div class="max-w-3xl mx-auto px-4 flex flex-col items-center">
          <!-- GuppyLM 可聊天小鱼 -->
          <GuppyLM />

          <!-- 打字机自我介绍 -->
          <div class="mt-6 reveal">
            <AnimatedFish />
          </div>

          <ContactBar />
          <!-- 装饰分隔 -->
          <div class="mt-6 mb-2 flex items-center gap-3 text-slate-400">
            <span class="w-12 h-px bg-sky-300/60" />
            <span class="text-xs tracking-widest text-sky-400/80">SCROLL DOWN</span>
            <span class="w-12 h-px bg-sky-300/60" />
          </div>
        </div>
      </section>

      <!-- ========== 项目区 ========== -->
      <section id="projects" class="py-16 md:py-24">
        <div class="max-w-5xl mx-auto px-4">
          <div class="text-center mb-12 reveal">
            <h2 class="text-2xl md:text-3xl font-bold text-slate-800">项目</h2>
            <p class="text-slate-500 mt-2 text-sm">每个项目都有一个故事</p>
          </div>

          <div class="grid gap-6 md:grid-cols-3 md:gap-8">
            <ProjectCard
              v-for="(project, index) in projects"
              :key="project.id"
              :project="project"
              :index="index"
              class="reveal"
              :class="`reveal-delay-${index + 1}`"
              @click="goToProject"
            />
          </div>
        </div>
      </section>

      <!-- ========== 技能区 ========== -->
      <section id="skills" class="py-16 md:py-24 bg-white/20 backdrop-blur-sm">
        <div class="max-w-4xl mx-auto px-4">
          <div class="text-center mb-12 reveal">
            <h2 class="text-2xl md:text-3xl font-bold text-slate-800">技能</h2>
            <p class="text-slate-500 mt-2 text-sm">技术栈与能力领域</p>
          </div>

          <div class="flex flex-wrap justify-center gap-3">
            <div
              v-for="(skill, i) in skills"
              :key="skill.name"
              class="reveal"
              :class="`reveal-delay-${(i % 6) + 1}`"
            >
              <div
                class="
                  px-4 py-2.5 rounded-xl
                  bg-white/60 border border-sky-200/40
                  shadow-[0_1px_4px_rgba(0,0,0,0.02),0_4px_12px_rgba(0,0,0,0.04)]
                  hover:border-sky-400/60 hover:shadow-lg hover:shadow-sky-500/10 hover:-translate-y-0.5
                  transition-all duration-200 cursor-default
                "
              >
                <span class="text-sm font-medium text-slate-700">{{ skill.name }}</span>
                <span
                  class="
                    ml-2 inline-flex items-center px-1.5 py-0.5
                    rounded text-[10px] font-medium
                  "
                  :class="
                    skill.level === '熟练'
                      ? 'bg-sky-500/15 text-sky-700'
                      : skill.level === '掌握'
                        ? 'bg-blue-500/15 text-blue-600'
                        : 'bg-slate-200/60 text-slate-500'
                  "
                >
                  {{ skill.level }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ========== 经历区 ========== -->
      <section id="experience" class="py-16 md:py-24">
        <div class="max-w-3xl mx-auto px-4">
          <div class="text-center mb-12 reveal">
            <h2 class="text-2xl md:text-3xl font-bold text-slate-800">经历</h2>
            <p class="text-slate-500 mt-2 text-sm">参与过的项目与实践</p>
          </div>

          <div class="relative">
            <!-- 时间轴线 -->
            <div class="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-sky-200/70 -translate-x-1/2" />

            <div class="space-y-10">
              <div
                v-for="(exp, i) in experiences"
                :key="i"
                class="
                  relative flex flex-col md:flex-row gap-4 md:gap-8 reveal
                "
                :class="i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'"
              >
                <!-- 时间点（统一蓝色系） -->
                <div
                  class="
                    absolute left-4 md:left-1/2
                    w-4 h-4 -translate-x-1/2
                    rounded-full border-2 border-white shadow-sm z-10
                    bg-sky-500
                    ring-2 ring-sky-200/50
                    animate-pulse
                  "
                  :class="{
                    'bg-sky-500 ring-sky-200/50': i === 0,
                    'bg-blue-500 ring-blue-200/50': i === 1,
                    'bg-indigo-400 ring-indigo-200/50': i === 2,
                  }"
                />

                <!-- 内容卡片 -->
                <div
                  class="
                    ml-10 md:ml-0 md:w-1/2
                    p-5 rounded-xl
                    bg-gradient-to-b from-white/85 to-white/70
                    border border-white/60
                    shadow-[0_2px_8px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)]
                    hover:shadow-[0_4px_12px_rgba(0,0,0,0.06),0_12px_32px_rgba(0,0,0,0.10)]
                    hover:border-blue-300/60
                    transition-all duration-200
                  "
                  :class="i % 2 === 0 ? 'md:pr-8' : 'md:pl-8'"
                >
                  <span class="text-xs font-medium text-sky-600/80">{{ exp.period }}</span>
                  <h3 class="text-base font-semibold text-slate-800 mt-1">{{ exp.title }}</h3>
                  <p class="text-xs text-sky-600 font-medium mt-0.5">{{ exp.role }}</p>
                  <p class="text-sm text-slate-600 mt-2 leading-relaxed">{{ exp.desc }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ========== Footer ========== -->
      <footer class="text-center py-10 text-slate-400 text-xs border-t border-sky-200/40">
        <p class="mb-1">黄靖莹 · 广州应用科技学院 · 计算机科学与技术</p>
        <p>Built with Vue 3 + Vite + Tailwind CSS</p>
      </footer>
    </main>
  </div>
</template>
