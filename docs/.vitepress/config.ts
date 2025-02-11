import { defineConfig } from 'vitepress'
import { generateSidebar } from './generateSidebar.js'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'RF Network',
  description:
    'Reading/writing touchstone snp files, similar to SignalIntegrity and scikit-rf in python',

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'API Reference', link: '/api/README' },
    ],

    sidebar: generateSidebar('api'),

    socialLinks: [
      { icon: 'github', link: 'https://github.com/panz2018/Network-rf.ts' },
    ],
  },

  // Show LaTex equations in the markdown
  markdown: {
    math: true,
  },
})
