import { fileURLToPath, URL } from "node:url";

import fs from "fs";
import path from "path";
import crypto from "crypto";

import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import vue from "@vitejs/plugin-vue";
import viteCompression from "vite-plugin-compression";
import terser from "@rollup/plugin-terser";
import { crx } from "@crxjs/vite-plugin";

let configStore;
let outDir = "";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));

const pkg = JSON.parse(fs.readFileSync(path.join(projectRoot, "package.json"), "utf8"));
const coreVersion = pkg.dependencies["abracadabra-cn"].replace(/[^0-9.]/g, "");

const manifestPath = path.join(projectRoot, "manifest.json");
const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")) : {};

const buildTarget = process.env.BUILD_TARGET || 'web';
const isExtension = buildTarget === 'chrome-ext' || buildTarget === 'firefox-ext';

// ================== Extension Versioning ==================
// 扩展主要跟随 abracadabra-cn 核心版本号。
// 若确有紧急情况需要发布独立于核心的快速更新，在此手动填入第 4 位修订号（如 1 -> 3.3.3.1）
const extRevision = null;

if (extRevision !== null && extRevision !== undefined && extRevision !== 0) {
  manifest.version = `${coreVersion}.${extRevision}`;
} else {
  manifest.version = coreVersion;
}

// 追加哈希至展示版本名，符合可验证构建理念，利于查错
const buildHash = generateSourceHash().slice(0, 7);
manifest.version_name = `${manifest.version} (${buildHash})`;
// ==========================================================

if (buildTarget === 'firefox-ext') {
  manifest.browser_specific_settings = {
    gecko: {
      id: "e8e23a64-d3a0-47e2-839f-0bdf6eabc596",
      strict_min_version: "109.0"
    }
  };
} else {
  delete manifest.browser_specific_settings;
}

function generateSourceHash() {
  const hash = crypto.createHash("sha256");
  function hashDirectory(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    files.sort(); // Ensure deterministic order
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        hashDirectory(fullPath);
      } else {
        hash.update(fs.readFileSync(fullPath));
      }
    }
  }

  hashDirectory(path.join(projectRoot, "src"));

  const rootFiles = ["index.html", "vite.config.js", "package.json"];
  for (const file of rootFiles) {
    const fullPath = path.join(projectRoot, file);
    if (fs.existsSync(fullPath)) {
      hash.update(fs.readFileSync(fullPath));
    }
  }
  return hash.digest("hex").slice(0, 10);
}

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
    __BUILD_HASH__: JSON.stringify(generateSourceHash()),
    __CORE_VERSION__: JSON.stringify(coreVersion),
    __IS_ANDROID_APP__: JSON.stringify(buildTarget === 'android'),
    __IS_EXTENSION__: JSON.stringify(isExtension),
    __IS_CHROME_EXT__: JSON.stringify(buildTarget === 'chrome-ext'),
    __IS_FIREFOX_EXT__: JSON.stringify(buildTarget === 'firefox-ext')
  },
  build: {
    outDir: buildTarget === 'chrome-ext' ? 'dist-chrome' : buildTarget === 'firefox-ext' ? 'dist-firefox' : buildTarget === 'android' ? path.resolve(__dirname, 'Abracadabra-cordova/www') : 'docs',
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
          if (id.includes("abracadabra-cn")) {
            return "abracadabra-cn";
          }
          if (id.includes("node_modules")) {
            if (id.includes("@m3e") || id.includes("lit") || id.includes("tslib")) return "m3e-components";
            if (id.includes("vue")) return "vue";
            if (id.includes("crypto-js") || id.includes("pako") || id.includes("otplib") || id.includes("noble-hashes")) return "crypto-utils";
            if (id.includes("unishox2") || id.includes("opencc-js")) return "text-utils";
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
          // 所有以 mdui- 和 m3e- 开头的标签名都是 mdui 组件 / m3e 组件
          isCustomElement: (tag) => tag.startsWith("mdui-") || tag.startsWith("m3e-")
        }
      }
    }),
    ...(isExtension ? [
      crx({ manifest })
    ] : []),
    ...(buildTarget === 'web' ? [
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
          maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
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
    ] : []),
    ...(!isExtension ? [
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
    ] : [])
  ],
  base: "./",
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      vue: "vue/dist/vue.esm-bundler.js"
    }
  }
});
