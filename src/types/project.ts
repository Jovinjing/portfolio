/** 单个项目的数据结构 */
export interface Project {
  /** 项目唯一标识（用于路由） */
  id: string
  /** 项目名称 */
  title: string
  /** 一句话摘要（≤ 20 字，显示在浮窗和节点上） */
  tagline: string
  /** 技术栈标签 */
  techStack: string[]
  /** 项目详细描述 */
  description: string
  /** 你的核心贡献（2-3 点） */
  contributions: string[]
  /** 演示图片路径（可多张） */
  images: string[]
  /** 演示视频嵌入链接（可选） */
  demoVideo?: string
  /** 在线 Demo 链接（可选） */
  demoUrl?: string
  /** GitHub 仓库链接 */
  githubUrl: string
}
