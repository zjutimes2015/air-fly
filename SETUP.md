AIR FLY — 微信开发者工具配置指南
====================================

## 前提条件

1. 已注册微信小程序账号 → https://mp.weixin.qq.com
2. 已下载微信开发者工具 → https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html
3. 已在微信公众平台获取小程序的 AppID

## 第一步：填入 AppID

打开 `D:\AIR FLY\project.config.json`，将 `__YOUR_APPID_HERE__` 替换为你的真实 AppID

  "appid": "wx你的真实AppID",

## 第二步：用开发者工具打开项目

1. 打开微信开发者工具
2. 点「导入」→ 选择 `D:\AIR FLY` 目录
3. AppID 选「使用已注册的 AppID」
4. 点「确定」

## 第三步：开通云开发

1. 在开发者工具中，点左侧「云开发」图标
2. 点「开通」→ 创建环境（环境名建议用 `airfly-prod`）
3. 创建完成后，记录环境ID

## 第四步：更新云环境ID

在 `D:\AIR FLY\pages\index\index.js` 中：

// 第19行附近，替换环境名
wx.cloud.init({ env: 'airfly-prod' })

## 第五步：部署云函数

1. 在开发者工具中，展开 `cloudfunctions/` 目录
2. 右键点击 `recognize` → 选择「上传并部署: 云端安装依赖」
3. 等待部署完成

## 第六步：真机预览

1. 点预览（或按 Ctrl+P）
2. 用手机微信扫描二维码
3. 测试搜索功能（如输入「充电宝」）
4. 测试录入清单功能

## 常见问题

Q: 搜索没结果？
A: 检查 data/rules.js 文件是否存在，路径是否正确

Q: 拍照识别不工作？
A: 云函数需要先部署，且需要微信云开发环境已开通

Q: 编译报错？
A: 检查 project.config.json 中的 libVersion 是否和你的开发者工具版本匹配

## 流量主广告开通（上线前）

1. 在微信公众平台 → 流量主 → 开通
2. 在 pages/checklist/checklist.wxml 和 pages/result/result.wxml 中插入 Banner 广告组件
3. 在适当位置插入激励视频广告（如全清单扫描时）

## 提审前检查清单

□ project.config.json 的 appid 已填写
□ app.json 中不要有 test/未完成的页面
□ 云函数已部署并能正常运行
□ 已打开 urlCheck: false（已在配置中设置）
□ 隐私协议已配置（微信公众平台 → 设置 → 服务内容声明）
□ 已提交审核前先自测所有页面
