import { defineConfig } from "vite";
import { configDefaults } from "vitest/config";

export default defineConfig({
  test: {
    environment: "happy-dom", // 使用 happy-dom 模拟 DOM 环境
    exclude: [...configDefaults.exclude, "**/e2e/**"], // 排除不需要测试的文件
    coverage: {
      provider: "v8", // 使用 v8 生成覆盖率报告
      reporter: ["text", "json", "html"], // 输出格式
    },
  },
});
