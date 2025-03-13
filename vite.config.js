import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import Userscript from 'vite-userscript-plugin';

// https://vitejs.dev/config/
export default defineConfig({
    // 配置选项
  plugins: [
    Userscript({
      entry: 'src/index.js',
      header: {
        name:"Abracadabra 魔曰",
        description:"文本防和谐工具组件，由 Abracadabra 项目支持。",
        version:"v3.0.10",
        "run-at":"document-idle",
        supportURL:"https://github.com/SheepChef/Abracadabra",
        author:"SheepChef",
        icon64:"https://abracadabra-demo.pages.dev/assets/favicon.png",
        namespace:"shef.cc",
        license:"GPLv3",
        match: [
          'https://tieba.baidu.com/*',
          'https://www.bilibili.com/video/*'
        ]
      },
      server: {
        port: 3000
      },
      esbuildTransformOptions:{
        minify:false
      }
    })
  ]
});
