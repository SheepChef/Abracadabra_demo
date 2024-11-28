import { fileURLToPath, URL } from "node:url";
import { crx } from "@crxjs/vite-plugin";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import viteCompression from "vite-plugin-compression";
import manifest from "./manifest.json" assert { type: "json" }; // Node >=17

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // 所有以 mdui- 开头的标签名都是 mdui 组件
          isCustomElement: (tag) => tag.startsWith("mdui-")
        }
      }
    }),
    crx({ manifest })
  ],
  base: "./",
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      vue: "vue/dist/vue.esm-bundler.js"
    }
  }
});
