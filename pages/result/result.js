const rules = require('../../data/rules')

Page({
  data: {
    query: '',
    match: null,
    formatted: {},
    loading: true,
    notFound: false,
    allItems: []
  },

  onLoad(options) {
    const q = decodeURIComponent(options.q || '')
    this.setData({ query: q })
    this.searchItem(q)
  },

  searchItem(query) {
    const q = query.toLowerCase().trim()
    let bestMatch = null
    let bestScore = 0

    for (const cat of rules.categories) {
      for (const item of cat.items) {
        const score = this.matchScore(item, q)
        if (score > bestScore) {
          bestScore = score
          bestMatch = { ...item, category: cat.name, categoryIcon: cat.icon }
        }
      }
    }

    if (bestMatch && bestScore > 0) {
      const formatted = this.formatResult(bestMatch)
      this.setData({
        match: bestMatch,
        formatted,
        loading: false,
        notFound: false
      })
    } else {
      this.setData({ loading: false, notFound: true })
    }
  },

  matchScore(item, q) {
    if (item.name.toLowerCase().includes(q)) return 5
    if (item.keywords.some(k => k.includes(q))) return 4
    if (item.keywords.some(k => q.includes(k))) return 3
    if ((item.search_keys || []).some(k => k.includes(q) || q.includes(k))) return 2
    return 0
  },

  formatResult(item) {
    const statusMap = {
      '允许': { text: '✅ 可以携带', color: '#22c55e', bg: '#f0fdf4' },
      '禁止': { text: '❌ 不能携带', color: '#ef4444', bg: '#fef2f2' },
      '有条件': { text: '⚠️ 有条件携带', color: '#f59e0b', bg: '#fffbeb' },
      '特殊处理': { text: '📞 需联系航司', color: '#3b82f6', bg: '#eff6ff' },
    }

    return {
      carryOn: statusMap[item.rule_carry_on] || { text: item.rule_carry_on, color: '#666', bg: '#f5f5f5' },
      checkIn: statusMap[item.rule_check_in] || { text: item.rule_check_in, color: '#666', bg: '#f5f5f5' },
    }
  },

  onShareAppMessage() {
    return {
      title: `${this.data.query}能不能带上飞机？AIR FLY告诉你`,
      path: `/pages/result/result?q=${encodeURIComponent(this.data.query)}`
    }
  },

  onNewSearch() {
    wx.navigateBack()
  },

  onCamera() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera'],
      success() {
        wx.showToast({ title: '拍照识别开发中', icon: 'none' })
      }
    })
  },

  onAddToList() {
    const app = getApp()
    const self = this
    let trips = wx.getStorageSync('trips') || []
    if (trips.length === 0) {
      wx.showModal({
        title: '暂无旅行清单',
        content: '先去创建旅行清单，再把物品加进去检查',
        confirmText: '去创建',
        success: (res) => {
          if (res.confirm) {
            wx.switchTab({ url: '/pages/checklist/checklist' })
          }
        }
      })
      return
    }
    const trip = trips[trips.length - 1]
    wx.showActionSheet({
      itemList: [`添加到「${trip.name || '我的清单'}」`],
      success() {
        if (!trip.items) trip.items = []
        trip.items.push({
          name: self.data.query,
          result: self.data.formatted.carryOn.text,
          time: new Date().toLocaleString()
        })
        wx.setStorageSync('trips', trips)
        wx.showToast({ title: '已添加', icon: 'success' })
      }
    })
  },

  onShareTimeline() {
    return {
      title: `${this.data.query}能不能带上飞机？`
    }
  }
})
