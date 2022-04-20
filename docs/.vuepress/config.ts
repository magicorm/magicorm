import { defineUserConfig } from 'vuepress-vite'
import type { DefaultThemeOptions, ViteBundlerOptions } from 'vuepress-vite'
import { resolve } from 'path'

export default defineUserConfig<DefaultThemeOptions, ViteBundlerOptions>({
  base: '/magicorm/',
  lang: 'zh-CN',
  theme: resolve(__dirname, 'theme'),
  title: 'MagicORM',
  description: '一个有魔法的 ORM。',
  themeConfig: {
    search: true,
    logo: '/magicorm.png',
    navbar: [
      { text: '指南', link: '/guide/nanny/' },
    ],
    sidebar: {
      '/guide/': [{
        text: '保姆级',
        children: [
          '/guide/nanny/README.md'
        ],
      }]
    },
    docsRepo: 'magicorm/magicorm'
  },
  bundler: '@vuepress/vite'
})
