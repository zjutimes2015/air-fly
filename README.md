# AIR FLY ✈️

**"拍一张就知道能不能上飞机"**

一个微信小程序——输入或拍照识别物品名称，瞬间告诉你能不能带上飞机（随身/托运）。

## 功能

- 🔍 **文字搜索** — 输入物品名称，秒出结果
- 📷 **拍照识别** — 拍照片，AI自动识别物品并匹配规则
- 📋 **旅行清单** — 创建旅行清单，一键检查所有物品
- 📤 **清单导出** — 一键复制清单文本，分享给同行人
- 🔥 **热门查询** — 充电宝、老干妈、茅台酒等高频物品快捷查询

## 技术栈

- **前端**: 微信小程序原生框架
- **数据**: 本地规则库 + 云函数 OCR
- **云服务**: 微信云开发（存储 + OCR 识别）
- **规则来源**: 中国民用航空局（CAAC）及各航司公开规定

## 项目结构

```
air-fly/
├── app.js               # 应用入口
├── app.json             # 全局配置
├── app.wxss             # 全局样式
├── project.config.json  # 项目配置
├── sitemap.json         # 搜索索引
├── data/
│   ├── rules.json       # 规则库（JSON源文件）
│   └── rules.js         # 规则库（JS模块）
├── images/              # Tab图标
├── utils/
│   └── util.js          # 工具函数
├── pages/
│   ├── index/           # 首页（搜索 + 拍照）
│   │   ├── index.js
│   │   ├── index.wxml
│   │   ├── index.wxss
│   │   └── index.json
│   ├── result/          # 结果页
│   │   ├── result.js
│   │   ├── result.wxml
│   │   ├── result.wxss
│   │   └── result.json
│   └── checklist/       # 旅行清单
│       ├── checklist.js
│       ├── checklist.wxml
│       ├── checklist.wxss
│       └── checklist.json
└── cloudfunctions/      # 云函数
    └── recognize/
        ├── package.json
        └── index.js
```

## 规则库覆盖范围

| 分类 | 数量 | 涵盖物品 |
|------|------|----------|
| 🔋 电池与充电设备 | 3 | 充电宝、锂电池、电子烟 |
| 🧴 液态与化妆品 | 2 | 化妆品、酒类 |
| 🔪 工具与刀具 | 3 | 刀具、工具、运动器材 |
| 🍱 食品与调味品 | 3 | 自热食品、酱料、榴莲 |
| 📱 电子产品 | 3 | 笔记本、相机、耳机 |
| 📦 其他常见物品 | 7 | 打火机、宠物、雨伞、药品等 |

## 启动指南

1. 用微信开发者工具打开本项目
2. 修改 `project.config.json` 中的 `appid` 为你的小程序 AppID
3. 开通微信云开发，创建 `airfly-xxx` 环境
4. 上传并部署 `cloudfunctions/recognize` 云函数
5. 在 `pages/index/index.js` 中更新 `wx.cloud.init` 的环境ID
6. 真机预览或上传审核

## 商业路径

- **MVP阶段**: 流量主广告（Banner + 激励视频）
- **阶段2**: 订阅制（无限清单 + 高级导出 + OCR不限次数）
- **阶段3**: 国际版（支持 FAA/EASA 规则 + 多语言）

## 数据来源

- [中国民用航空局](http://www.caac.gov.cn) — 《民航旅客禁止随身携带和托运物品目录》
- 国航、南航、东航、海航官网行李规定
- 数据最后更新：2026-07-22

---

*made by [@zjutimes2015](https://github.com/zjutimes2015) with Hermes AI*
