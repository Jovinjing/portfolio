import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import ProjectDetail from '../views/ProjectDetail.vue'

const router = createRouter({
  // 使用 createWebHistory 记得在部署平台配置 fallback（见 plan.md）
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
    },
    {
      path: '/project/:id',
      name: 'project-detail',
      component: ProjectDetail,
      props: true,
    },
  ],
})

export default router
