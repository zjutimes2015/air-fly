App({
  globalData: {
    userInfo: null,
    checkHistory: [],
    currentTrip: null
  },
  onLaunch() {
    const trips = wx.getStorageSync('trips') || []
    this.globalData.currentTrip = trips.length > 0 ? trips[trips.length - 1] : null
  }
})
