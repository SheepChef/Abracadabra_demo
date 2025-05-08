import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import terser from "@rollup/plugin-terser";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    minify: "terser",
    cssMinify: "esbuild",
    rollupOptions: {
      plugins: [
        terser({
          format: {
            // 取消代码注释
            comments: false
          },

          mangle: {
            keep_classnames: false,
            reserved: []
          }
        })
      ],
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules")) {
            return "deps";
          }
        }
      }
    }
  },
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // 所有以 mdui- 开头的标签名都是 mdui 组件
          isCustomElement: (tag) => tag.startsWith("mdui-")
        }
      }
    })
  ],
  base: "./",
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      vue: "vue/dist/vue.esm-bundler.js"
    }
  }
});
