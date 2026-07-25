/**
 * AIR FLY - 混元Vision版
 * 
 * 拍照识别：使用腾讯混元t1-vision模型识别图中的物品
 * 文字搜索：本地规则库模糊匹配
 */

Page({
  data: {
    query: '',
    suggestions: [],
    hotQueries: ['充电宝', '化妆品', '茅台酒', '自热火锅', '老干妈', '打火机', '宠物', '榴莲', '无人机', '瑞士军刀'],
    history: [],
    showClear: false,
    visionReady: false
  },

  onLoad() {
    const history = wx.getStorageSync('search_history') || []
    const app = getApp()
    this.setData({
      history,
      visionReady: app.globalData.cloudReady
    })
  },

  onShow() {
    // 每次显示重新检测云环境状态
    const app = getApp()
    if (this.data.visionReady !== app.globalData.cloudReady) {
      this.setData({ visionReady: app.globalData.cloudReady })
    }
  },

  onInput(e) {
    const query = e.detail.value
    this.setData({ query, showClear: query.length > 0 })
    if (query.trim().length > 0) {
      this.search(query)
    } else {
      this.setData({ suggestions: [] })
    }
  },

  onClear() {
    this.setData({ query: '', suggestions: [], showClear: false })
  },

  search(query) {
    const db = require('../../data/rules')
    const results = []
    const q = query.toLowerCase()

    for (const cat of db.categories) {
      for (const item of cat.items) {
        const matchName = item.name.toLowerCase().includes(q)
        const matchKw = item.keywords.some(k => k.toLowerCase().includes(q) || q.includes(k.toLowerCase()))
        const matchSk = (item.search_keys || []).some(k => k.includes(q) || q.includes(k))
        if (matchName || matchKw || matchSk) {
          results.push({
            name: item.name,
            cat: cat.name,
            icon: cat.icon,
            carryOn: item.rule_carry_on,
            checkIn: item.rule_check_in,
            score: (matchName ? 3 : 0) + (matchKw ? 2 : 0) + (matchSk ? 1 : 0)
          })
        }
      }
    }

    results.sort((a, b) => b.score - a.score)
    this.setData({ suggestions: results.slice(0, 6) })
  },

  onSearch(e) {
    let query = ''
    if (e.currentTarget.dataset.item) {
      query = e.currentTarget.dataset.item
    } else if (e.detail && e.detail.value) {
      query = e.detail.value
    }

    if (!query && this.data.suggestions.length > 0) {
      query = this.data.suggestions[0].name
    }

    if (query) {
      this.addHistory(query)
      wx.navigateTo({
        url: `/pages/result/result?q=${encodeURIComponent(query)}`
      })
    }
  },

  onHotQuery(e) {
    const q = e.currentTarget.dataset.query
    this.addHistory(q)
    wx.navigateTo({
      url: `/pages/result/result?q=${encodeURIComponent(q)}`
    })
  },

  onHistoryItem(e) {
    const q = e.currentTarget.dataset.query
    wx.navigateTo({
      url: `/pages/result/result?q=${encodeURIComponent(q)}`
    })
  },

  onClearHistory() {
    wx.showModal({
      title: '清空搜索历史',
      content: '确定要清空所有搜索历史吗？',
      success: (res) => {
        if (res.confirm) {
          wx.setStorageSync('search_history', [])
          this.setData({ history: [] })
        }
      }
    })
  },

  addHistory(query) {
    let history = wx.getStorageSync('search_history') || []
    history = [query, ...history.filter(h => h !== query)].slice(0, 20)
    wx.setStorageSync('search_history', history)
  },

  /**
   * 拍照识别 - 主入口
   * 使用腾讯混元t1-vision识别图中物品
   */
  onCamera() {
    const self = this

    wx.showActionSheet({
      itemList: ['拍照识别', '从相册选择'],
      success(res) {
        const sourceType = res.tapIndex === 0 ? ['camera'] : ['album']

        wx.chooseMedia({
          count: 1,
          mediaType: ['image'],
          sourceType: sourceType,
          success(mediaRes) {
            const tempPath = mediaRes.tempFiles[0].tempFilePath
            wx.showLoading({ title: 'AI识别中...', mask: true })
            self.recognizeWithVision(tempPath)
          },
          fail() {
            // 用户取消
          }
        })
      }
    })
  },

  /**
   * 使用混元Vision识别图片中的物品
   * 
   * 调用链路：
   *   前端 → wx.cloud.extend.AI.createModel("cloudbase") → 混元t1-vision
   *   全程走微信云链路，无需配置域名白名单
   */
  async recognizeWithVision(tempPath) {
    const self = this

    // 检查云环境和基础库版本
    if (!wx.cloud || !wx.cloud.extend || !wx.cloud.extend.AI) {
      wx.hideLoading()
      wx.showModal({
        title: 'AI识别暂不可用',
        content: '请更新微信版本后再试，或手动输入物品名称搜索',
        confirmText: '去搜索',
        success: (res) => {
          if (res.confirm) {
            // 聚焦输入框
          }
        }
      })
      return
    }

    try {
      // 1. 图片转base64
      const fs = wx.getFileSystemManager()
      const base64 = fs.readFileSync(tempPath, 'base64')
      const imageUrl = `data:image/jpeg;base64,${base64}`

      // 2. 调用混元t1-vision识别物品
      const model = wx.cloud.extend.AI.createModel("cloudbase")
      const res = await model.generateText({
        model: "hunyuan-t1-vision",
        messages: [{
          role: "user",
          content: [
            { type: "text", text: "识别图中的物品是什么？用3-5个中文汉字说出物品名称。只说名称，不要说其他任何话。如果图中没有物品，回复'无'。" },
            { type: "image_url", image_url: { url: imageUrl } }
          ]
        }]
      })

      wx.hideLoading()

      const itemName = (res.choices?.[0]?.message?.content || '').trim()
      
      if (itemName && itemName !== '无' && itemName.length <= 10) {
        // 识别成功，匹配规则库
        this.addHistory(itemName)
        wx.navigateTo({
          url: `/pages/result/result?q=${encodeURIComponent(itemName)}`
        })
      } else {
        // 识别到但无法确定
        this.recognitionFallback()
      }
    } catch (err) {
      wx.hideLoading()
      console.error('[AIR FLY] Vision识别失败:', err)
      
      // 如果是并发超限，提示用户
      if (err.errCode === 'EXCEED_CONCURRENT_REQUEST_LIMIT') {
        wx.showToast({ title: '当前使用人数多，请稍后重试', icon: 'none' })
        return
      }
      
      this.recognitionFallback()
    }
  },

  /**
   * 识别失败兜底
   */
  recognitionFallback() {
    wx.showModal({
      title: '识别失败',
      content: 'AI暂未识别出图中的物品，请在搜索框输入名称',
      confirmText: '知道了'
    })
  },

  /**
   * 语音输入（预留）
   */
  onVoiceInput() {
    wx.showToast({ title: '语音输入开发中', icon: 'none' })
  }
})
