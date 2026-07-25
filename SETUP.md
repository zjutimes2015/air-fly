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

## 第三步：申请 AI小程序成长计划（免费拿额度）

1. 打开 https://mp.weixin.qq.com → 登录你的小程序
2. 左侧菜单 → 行业能力 → AI小程序成长计划
3. 点「参与计划」→ 免费领取：
   - 6个月云开发个人版环境
   - 10亿 Token（hy3文本模型，这是送的）
4. 创建云环境，环境名建议用 `airfly-prod`

## 第四步：开通腾讯混元API（视觉识别用）

1. 打开 https://console.cloud.tencent.com/hunyuan
2. 点「立即开通」→ 实名认证
3. 开通后自动获得 **100万tokens免费额度**（覆盖混元Vision）
4. 记下 SecretId 和 SecretKey（或者跳过，走微信云开发链路不需要）

## 第五步：更新云环境ID

打开 `D:\AIR FLY\app.js`，替换环境名：

  wx.cloud.init({ env: 'airfly-prod' })

## 第六步：部署云函数（可选，仅用于日志记录）

1. 在开发者工具中，展开 `cloudfunctions/` 目录
2. 右键点击 `recognize` → 选择「上传并部署: 云端安装依赖」
3. 等待部署完成

## 第七步：真机预览

1. 点预览（或按 Ctrl+P）
2. 用手机微信扫描二维码
3. 测试搜索功能（如输入「充电宝」）
4. 测试拍照识别功能（拍个老干妈瓶子试试）
5. 测试录入清单功能

## 拍照识别 - 技术原理

```
用户拍照 → wx.chooseMedia → 转base64 → 
wx.cloud.extend.AI.createModel("cloudbase") →
混元 t1-vision 模型识别图中物品 →
匹配本地 rules.js 规则库 →
跳转结果页
```

全程走微信云链路，不需要配置任何域名白名单。

## 常见问题

Q: 搜索没结果？
A: 检查 data/rules.js 文件是否存在，路径是否正确

Q: 拍照识别不工作？
A: 需要先开通云开发环境（第三步），并在 app.js 中填入正确的环境ID

Q: 提示"当前使用人数多"？
A: 混元API有并发限制，稍后重试即可。可在云开发控制台提高并发限额

Q: 编译报错？
A: 检查 project.config.json 中的 libVersion 是否 >= 3.7.1（混元Vision要求）

Q: 识别准确率怎么样？
A: 混元t1-vision 对日常物品识别非常好。充电宝/老干妈/茅台/化妆品瓶都能认

## 流量主广告开通（上线前）

1. 在微信公众平台 → 流量主 → 开通
2. 在 pages/checklist/checklist.wxml 和 pages/result/result.wxml 中插入 Banner 广告组件
3. 在适当位置插入激励视频广告（如全清单扫描时）

## 提审前检查清单

□ project.config.json 的 appid 已填写
□ app.js 中 wx.cloud.init 的环境ID已填写
□ app.json 中不要有 test/未完成的页面
□ 基础库版本 >= 3.7.1
□ 已打开 urlCheck: false（已在配置中设置）
□ 隐私协议已配置（微信公众平台 → 设置 → 服务内容声明）
□ 已提交审核前先自测所有页面
□ 测试拍照识别流程完整跑通
