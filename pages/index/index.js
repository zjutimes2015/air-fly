/**
 * AIR FLY - 拍照识别功能增强版
 * 
 * 拍照识别流程：
 * 1. 用户拍照或选图
 * 2. 调用云函数 OCR 识别图片中的文字
 * 3. 自动匹配航空行李规则库
 * 4. 跳转到结果页
 */

// 更新 index.js 中的 onCamera 方法
Page({
  data: {
    query: '',
    suggestions: [],
    hotQueries: ['充电宝', '化妆品', '茅台酒', '自热火锅', '老干妈', '打火机', '宠物', '榴莲', '无人机', '瑞士军刀'],
    history: [],
    showClear: false,
    hasCloudEnv: false  // 标记是否已初始化云环境
  },

  onLoad() {
    const history = wx.getStorageSync('search_history') || []
    this.setData({ history })

    // 尝试初始化云开发（如果已开通）
    try {
      wx.cloud.init({ env: 'airfly-xxx' })
      this.setData({ hasCloudEnv: true })
    } catch(e) {
      this.setData({ hasCloudEnv: false })
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
   * 
   * 使用两种方式：
   * 方式A（推荐）：用户拍照 → wx.chooseMedia → 上传云存储 → 云函数OCR → 自动匹配 → 跳转结果
   * 方式B（兜底）：无云开发 → 用户拍照 → 手动输入物品名称
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
            wx.showLoading({ title: '识别中...', mask: true })

            // 如果有云开发环境，调用云函数
            if (self.data.hasCloudEnv) {
              self.recognizeWithCloud(tempPath)
            } else {
              // 无云环境：用户手动输入
              wx.hideLoading()
              self.ocrFallback()
            }
          },
          fail() {
            // 用户取消拍照
          }
        })
      }
    })
  },

  /**
   * 云函数OCR识别
   */
  recognizeWithCloud(tempPath) {
    const self = this
    // 1. 上传图片到云存储
    wx.cloud.uploadFile({
      cloudPath: `ocr/${Date.now()}.jpg`,
      filePath: tempPath,
      success(uploadRes) {
        // 2. 调用云函数识别
        wx.cloud.callFunction({
          name: 'recognize',
          data: { fileID: uploadRes.fileID },
          success(callRes) {
            wx.hideLoading()
            const result = callRes.result
            
            if (result.code === 0 && result.recognized) {
              // 自动匹配到了规则
              wx.navigateTo({
                url: `/pages/result/result?q=${encodeURIComponent(result.recognized)}`
              })
            } else if (result.code === 0) {
              // 有识别结果但没匹配到规则
              wx.showModal({
                title: '识别结果',
                content: `识别到：${result.recognized}，未匹配到航空规则`,
                confirmText: '手动搜索',
                success(modalRes) {
                  if (modalRes.confirm) {
                    self.setData({ query: result.recognized })
                  }
                }
              })
            } else {
              // 识别失败
              self.ocrFallback()
            }
          },
          fail() {
            wx.hideLoading()
            self.ocrFallback()
          }
        })
      },
      fail() {
        wx.hideLoading()
        self.ocrFallback()
      }
    })
  },

  /**
   * OCR兜底：手动输入
   */
  ocrFallback() {
    const self = this
    wx.showModal({
      title: '拍照识别',
      content: '暂无法自动识别，请输入物品名称搜索',
      placeholderText: '例如：充电宝、茅台酒、化妆品...',
      editable: true,
      confirmText: '搜索',
      success(res) {
        if (res.confirm && res.content) {
          const q = res.content.trim()
          if (q) {
            self.setData({ query: q })
            self.addHistory(q)
            wx.navigateTo({
              url: `/pages/result/result?q=${encodeURIComponent(q)}`
            })
          }
        }
      }
    })
  },

  /**
   * 长按麦克风语音输入（预留）
   */
  onVoiceInput() {
    wx.showToast({ title: '语音输入开发中', icon: 'none' })
  }
})
