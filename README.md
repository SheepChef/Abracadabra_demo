# Abracadabra：魔曰

![License](https://img.shields.io/github/license/SheepChef/Abracadabra?color=yellow)

**Abracadabra(魔曰)** 是一个文本即时加密/脱敏工具，也可用于加密文件，你正在查阅其Demo示范页。本 Demo 支持PWA，完全响应式设计。

Abracadabra 是表演魔术 (施魔法) 时所念的咒语，**魔曰** 是本项目的中文别名。

C++ 版本和 Node.js 版本完全等效，密文可以互相交叉解密。

设计它的初衷，是为了在中文互联网上公开合理地传输不安全的信息。

<a href="https://chrome.google.com/webstore/detail/jgmlgdoefnmlealmfmhjhnoiejaifpko">
<img src="https://github.com/user-attachments/assets/9d2a3518-eb92-4c52-9191-098d1abdd399">
</a>

**在线体验**: [**Cloudflare DEMO Page**](https://abracadabra-demo.pages.dev/)

**主项目**: [**Abracadabra**](https://github.com/SheepChef/Abracadabra/)

**浏览器插件源码**: [**Abracadabra-demo**](https://github.com/SheepChef/Abracadabra_demo/tree/crx)

Telegram: [@abracadabra_cn](https://t.me/abracadabra_cn)

## 特性

- 方便，密文可以描述自身。
- 简短，密文简短方便传播。
- 随机，加密结果具有随机性。
- 无序，加密的文本如咒语般不可阅读。
- 安心，密码表中已剔除敏感汉字。
- 安全，AES256 + 三重转轮加密。

## 快速部署

如果你不想修改源码，可以直接下载Release内的构建版本。

把构建版本解压到你网站的指定位置，快速部署即完成。

## 编译部署

本示范页使用 Vue 和 Vite

如果需要本地编译部署，你最少需要执行两个指令：

```shell
npm install

npm run build
```

本 Demo 是开发者自主设计的，还请在修改传播时保留版权信息。

## Abracadabra VS 与熊论道

| 特性 \ 工具  | Abracadabra       | 与熊论道        |
| ------------ | ----------------- | --------------- |
| 易用性       | 🟡 稍弱           | ✅ 傻瓜化       |
| 加密文本体积 | ✅ 更短           | 🟡 较短         |
| 加密方式     | ✅ AES-256 / 转轮 | ❌ 非公开算法   |
| 加密过程     | ✅ 密钥参与       | ❌ 无用户密钥   |
| 算法安全     | ✅ 抗多种攻击     | ❌ 易受攻击     |
| 随机性       | ✅ 密文多变       | ❌ 密文固定     |
| 隐私性       | ✅ 完全本地加密   | ❌ 上传到服务器 |
| 密文构成     | ✅ 常见字         | 🟡 罕见字       |
| 密文特征     | ✅ 无明显特征     | ❌ 特征明显     |
| 文件加密     | ✅ 支持(较慢)     | ❌ 不支持       |
| 浏览器插件   | ✅ 支持           | ❌ 不支持       |
| 开源         | ✅ 开源           | ❌ 不开源       |
