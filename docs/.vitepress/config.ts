import { defineConfig } from 'vitepress'
import { generateSidebar } from './generateSidebar'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'RF Touchstone',
  description:
    'Reading/writing touchstone snp files, similar to SignalIntegrity and scikit-rf in python',
  base: '/RF-Touchstone/',

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'API Reference', link: '/api/README' },
    ],

    sidebar: generateSidebar('api'),

    socialLinks: [
      { icon: 'github', link: 'https://github.com/panz2018/RF-Touchstone' },
    ],
  },

  // Show LaTex equations in the markdown
  markdown: {
    math: true,
  },
})
