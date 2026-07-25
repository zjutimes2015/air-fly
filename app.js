App({
  globalData: {
    userInfo: null,
    checkHistory: [],
    currentTrip: null,
    cloudReady: false
  },

  onLaunch() {
    const trips = wx.getStorageSync('trips') || []
    this.globalData.currentTrip = trips.length > 0 ? trips[trips.length - 1] : null

    // 初始化云开发环境（用户需替换为真实环境ID）
    try {
      wx.cloud.init({
        env: '__YOUR_CLOUD_ENV_ID__',
        traceUser: true
      })
      this.globalData.cloudReady = true
      console.log('[AIR FLY] 云环境初始化成功')
    } catch(e) {
      console.warn('[AIR FLY] 云环境初始化失败:', e)
      this.globalData.cloudReady = false
    }
  }
})
