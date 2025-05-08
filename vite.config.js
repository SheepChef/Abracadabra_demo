import { fileURLToPath, URL } from "node:url";

import fs from "fs";
import path from "path";

import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import vue from "@vitejs/plugin-vue";
import viteCompression from "vite-plugin-compression";
import terser from "@rollup/plugin-terser";

let configStore;
let outDir = "";

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
    }),
    VitePWA({
      manifest: {
        name: "魔曰",
        short_name: "Abracadabra",
        id: "abracadabra",
        start_url: ".",
        description: "对文字施以神秘魔法",
        theme_color: "#5753c9",
        icons: [
          //添加图标， 注意路径和图像像素正确
          {
            src: "favicon.webp",
            sizes: "1024x1024", //icon大小要与实际icon大小一致
            type: "image/webp"
            // form_factor: "handset",
          }
        ]
      },
      registerType: "autoUpdate",
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,jpg,svg,webp,woff2,ttf}"], //缓存相关静态资源
        runtimeCaching: [
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg)$/,
            handler: "NetworkFirst",
            options: {
              cacheName: "wisbayar-images",
              expiration: {
                // 最多30个图
                maxEntries: 30
              }
            }
          },
          {
            urlPattern: /.*\.js.*/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "wisbayar-js",
              expiration: {
                maxEntries: 30, // 最多缓存30个，超过的按照LRU原则删除
                maxAgeSeconds: 30 * 24 * 60 * 60
              },
              cacheableResponse: {
                statuses: [200]
              }
            }
          },
          {
            urlPattern: /.*\.css.*/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "wisbayar-css",
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 30 * 24 * 60 * 60
              },
              cacheableResponse: {
                statuses: [200]
              }
            }
          },
          {
            urlPattern: /.*\.html.*/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "wisbayar-html",
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 30 * 24 * 60 * 60
              },
              cacheableResponse: {
                statuses: [200]
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    }),
    {
      name: "Abracadabra-Favicon",
      apply: "build", // 只在生产构建时生效
      configResolved(config) {
        // 保存最终输出目录路径
        outDir = path.resolve(config.root, config.build.outDir);
        configStore = config;
      },
      async writeBundle() {
        // 自定义内容
        const TargetContentPath = path.join(configStore.root, "favicon.webp");
        const TargetContent = fs.readFileSync(TargetContentPath);

        //创建全新文件
        const newFilePath = path.join(outDir, "favicon.webp");
        fs.writeFileSync(newFilePath, TargetContent);
      }
    }
  ],
  base: "./",
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      vue: "vue/dist/vue.esm-bundler.js"
    }
  }
});
