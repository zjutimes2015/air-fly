Page({
  data: {
    trips: [],
    currentTrip: null,
    currentIndex: -1,
    showNewTrip: false,
    newTripName: '',
    newTripDate: '',
    editMode: false
  },

  onShow() {
    this.loadTrips()
  },

  loadTrips() {
    const trips = wx.getStorageSync('trips') || []
    this.setData({ trips })
    if (trips.length > 0) {
      // 保持当前选中的旅行，如果没有则选第一个
      const currentIdx = this.data.currentIndex >= 0 && this.data.currentIndex < trips.length
        ? this.data.currentIndex
        : 0
      this.setData({ currentTrip: trips[currentIdx], currentIndex: currentIdx })
    }
  },

  onNewTrip() {
    const now = new Date()
    const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`
    this.setData({
      showNewTrip: true,
      newTripName: '',
      newTripDate: dateStr
    })
  },

  onTripNameInput(e) {
    this.setData({ newTripName: e.detail.value })
  },

  onTripDateInput(e) {
    this.setData({ newTripDate: e.detail.value })
  },

  onSaveTrip() {
    if (!this.data.newTripName.trim()) {
      wx.showToast({ title: '请输入旅行名称', icon: 'none' })
      return
    }
    const newTrip = {
      id: Date.now().toString(36),
      name: this.data.newTripName.trim(),
      date: this.data.newTripDate,
      items: [],
      createdAt: new Date().toISOString()
    }
    const trips = [newTrip, ...this.data.trips]
    wx.setStorageSync('trips', trips)
    this.setData({
      trips,
      currentTrip: newTrip,
      currentIndex: 0,
      showNewTrip: false
    })
    wx.showToast({ title: '清单已创建', icon: 'success' })
  },

  onCancelNew() {
    this.setData({ showNewTrip: false })
  },

  onSelectTrip(e) {
    const idx = e.currentTarget.dataset.index
    this.setData({
      currentTrip: this.data.trips[idx],
      currentIndex: idx
    })
  },

  onDeleteTrip(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '删除清单',
      content: '确定要删除这个旅行清单吗？',
      success: (res) => {
        if (res.confirm) {
          const trips = this.data.trips.filter(t => t.id !== id)
          wx.setStorageSync('trips', trips)
          this.setData({ trips })
          if (trips.length > 0) {
            this.setData({ currentTrip: trips[0], currentIndex: 0 })
          } else {
            this.setData({ currentTrip: null, currentIndex: -1 })
          }
          wx.showToast({ title: '已删除', icon: 'success' })
        }
      }
    })
  },

  onDeleteItem(e) {
    const idx = e.currentTarget.dataset.index
    const trip = { ...this.data.currentTrip }
    trip.items = trip.items.filter((_, i) => i !== idx)
    const trips = [...this.data.trips]
    trips[this.data.currentIndex] = trip
    wx.setStorageSync('trips', trips)
    this.setData({ trips, currentTrip: trip })
  },

  onClearChecked() {
    const trip = { ...this.data.currentTrip }
    trip.items = trip.items.filter(i => !i.checked)
    const trips = [...this.data.trips]
    trips[this.data.currentIndex] = trip
    wx.setStorageSync('trips', trips)
    this.setData({ trips, currentTrip: trip })
  },

  onToggleCheck(e) {
    const idx = e.currentTarget.dataset.index
    const trip = { ...this.data.currentTrip }
    trip.items = [...trip.items]
    trip.items[idx] = { ...trip.items[idx], checked: !trip.items[idx].checked }
    const trips = [...this.data.trips]
    trips[this.data.currentIndex] = trip
    wx.setStorageSync('trips', trips)
    this.setData({ trips, currentTrip: trip })
  },

  onAddItem() {
    // wx.showModal 不支持 editable，改用自定义输入
    wx.showModal({
      title: '添加物品',
      content: '请在搜索页面搜索物品后点击「加入清单」，或返回首页搜索',
      confirmText: '去搜索',
      cancelText: '取消',
      success(res) {
        if (res.confirm) {
          wx.switchTab({ url: '/pages/index/index' })
        }
      }
    })
  },

  onScanAll() {
    const trip = this.data.currentTrip
    if (!trip || !trip.items || trip.items.length === 0) {
      wx.showToast({ title: '清单为空，先添加物品', icon: 'none' })
      return
    }
    // 逐个检查物品是否符合航空规定
    const rules = require('../../data/rules')
    const tripCopy = { ...trip }
    tripCopy.items = tripCopy.items.map(item => {
      const q = item.name.toLowerCase()
      let result = '未检查'
      for (const cat of rules.categories) {
        for (const rule of cat.items) {
          if (rule.name.includes(q) || rule.keywords.some(k => k.includes(q) || q.includes(k))) {
            result = rule.rule_carry_on === '允许' ? '✅ 可随身' : 
                     rule.rule_carry_on === '禁止' ? '❌ 不能带' : '⚠️ 注意'
            break
          }
        }
        if (result !== '未检查') break
      }
      return { ...item, checkResult: result }
    })
    const trips = [...this.data.trips]
    trips[this.data.currentIndex] = tripCopy
    wx.setStorageSync('trips', trips)
    this.setData({ trips, currentTrip: tripCopy })
    wx.showToast({ title: '全清单检查完成', icon: 'success' })
  },

  onExport() {
    const trip = this.data.currentTrip
    if (!trip || !trip.items || trip.items.length === 0) {
      wx.showToast({ title: '清单为空，无法导出', icon: 'none' })
      return
    }
    let text = `✈️ 旅行清单：${trip.name}\n日期：${trip.date}\n${'='.repeat(20)}\n`
    trip.items.forEach((item, i) => {
      const mark = item.checked ? '✅' : '⬜'
      const result = item.checkResult ? ` — ${item.checkResult}` : ''
      text += `${mark} ${i+1}. ${item.name}${result}\n`
    })
    text += `\n—— 由 AIR FLY 生成 ——`

    wx.setClipboardData({
      data: text,
      success() {
        wx.showToast({ title: '已复制到剪贴板', icon: 'success' })
      }
    })
  },

  onShareAppMessage() {
    const trip = this.data.currentTrip
    return {
      title: `帮我检查这些能不能带上飞机✈️`,
      path: '/pages/checklist/checklist'
    }
  }
})
