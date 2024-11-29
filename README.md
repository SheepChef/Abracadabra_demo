# Abracadabra：魔曰

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Abracadabra(魔曰)** 是一个文本即时加密/脱敏工具，也可用于加密文件，你正在查阅其Chrome浏览器插件实现。

Abracadabra 是表演魔术 (施魔法) 时所念的咒语，**魔曰** 是本项目的中文别名。

设计它的初衷，是为了在中文互联网上公开合理地传输不安全的信息。

<a href="https://chrome.google.com/webstore/detail/jgmlgdoefnmlealmfmhjhnoiejaifpko">
<img src="https://github.com/user-attachments/assets/9d2a3518-eb92-4c52-9191-098d1abdd399">
</a>

**在线体验**: [**Cloudflare DEMO Page**](https://abracadabra-demo.pages.dev/)

**主项目**: [**dev_c Branch**](https://github.com/SheepChef/Abracadabra/)

**Demo页源码**: [**Abracadabra-demo**](https://github.com/SheepChef/Abracadabra_demo)

Telegram: [@abracadabra_cn](https://t.me/abracadabra_cn)

## 特性

- 方便，密文可以描述自身。
- 简短，密文简短方便传播。
- 随机，加密结果具有随机性。
- 无序，加密的文本如咒语般不可阅读。
- 安心，密码表中已剔除敏感汉字。
- 安全，AES256 + 三重转轮加密。

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
