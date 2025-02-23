import { defineConfig } from 'vitepress'
import { generateSidebar } from './generateSidebar'

/**
 * VitePress configuration for RF-Touchstone documentation
 * @see https://vitepress.dev/reference/site-config
 */
export default defineConfig({
  // Basic site configuration
  title: 'RF Touchstone',
  description:
    'Reading/writing touchstone snp files, similar to SignalIntegrity and scikit-rf in python',
  // Base URL for GitHub Pages deployment
  base: '/RF-Touchstone/',

  /**
   * Theme configuration for VitePress default theme
   * @see https://vitepress.dev/reference/default-theme-config
   */
  themeConfig: {
    // Navigation bar configuration
    nav: [
      { text: 'Home', link: '/' },
      { text: 'API Reference', link: '/api/README' },
    ],

    // Automatically generated sidebar from API documentation
    sidebar: generateSidebar('api'),

    // Social media links displayed in the navigation bar
    socialLinks: [
      { icon: 'github', link: 'https://github.com/panz2018/RF-Touchstone' },
    ],
  },

  /**
   * Markdown configuration
   * Enable LaTeX mathematical equations support in markdown files
   * Examples:
   * - Inline equation: $A + j \cdot B$
   * - Block equation: $$A \cdot e^{j \cdot {\pi \over 180} \cdot B}$$
   */
  markdown: {
    math: true,
  },
})
