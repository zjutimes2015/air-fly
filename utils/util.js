/**
 * AIR FLY 工具函数
 */
const RULES = require('../data/rules.js')

/**
 * 搜索物品规则
 * @param {string} query 搜索关键词
 * @returns {Array} 匹配结果列表
 */
function searchRules(query) {
  if (!query || query.trim().length === 0) return []
  const q = query.trim().toLowerCase()
  const results = []

  for (const cat of RULES.categories) {
    for (const item of cat.items) {
      // 匹配关键词
      const matchKeywords = item.keywords.some(k => q.includes(k) || k.includes(q))
      // 匹配搜索键
      const matchSearch = (item.search_keys || []).some(k => q.includes(k) || k.includes(q))
      // 匹配物品名（部分匹配）
      const matchName = item.name.toLowerCase().includes(q)

      if (matchKeywords || matchSearch || matchName) {
        results.push({
          category: cat.name,
          categoryIcon: cat.icon,
          name: item.name,
          carryOn: item.rule_carry_on,
          checkIn: item.rule_check_in,
          conditions: item.conditions,
          tips: item.tips || '',
          matchScore: (matchKeywords ? 3 : 0) + (matchSearch ? 2 : 0) + (matchName ? 1 : 0)
        })
      }
    }
  }

  // 按匹配度排序
  return results.sort((a, b) => b.matchScore - a.matchScore)
}

/**
 * 获取热门查询列表
 */
function getHotQueries() {
  return ['充电宝', '化妆品', '白酒', '自热火锅', '老干妈', '打火机', '宠物', '榴莲', '无人机']
}

/**
 * 管理旅行清单
 */
const TRIPS_KEY = 'airfly_trips'

function getTrips() {
  return wx.getStorageSync(TRIPS_KEY) || []
}

function saveTrip(trip) {
  const trips = getTrips()
  trip.id = Date.now().toString(36)
  trip.updatedAt = new Date().toISOString()
  trips.push(trip)
  wx.setStorageSync(TRIPS_KEY, trips)
  return trip
}

function updateTrip(trip) {
  const trips = getTrips()
  const idx = trips.findIndex(t => t.id === trip.id)
  if (idx >= 0) {
    trip.updatedAt = new Date().toISOString()
    trips[idx] = trip
    wx.setStorageSync(TRIPS_KEY, trips)
  }
}

function deleteTrip(id) {
  const trips = getTrips().filter(t => t.id !== id)
  wx.setStorageSync(TRIPS_KEY, trips)
}

/**
 * 格式化判定结果为显示文本
 */
function formatRule(rule) {
  const map = {
    '允许': { text: '✅ 可以携带', color: '#22c55e' },
    '禁止': { text: '❌ 不能携带', color: '#ef4444' },
    '有条件': { text: '⚠️ 有条件携带', color: '#f59e0b' },
    '特殊处理': { text: '📞 需联系航空公司', color: '#3b82f6' },
  }
  return {
    carryOn: map[rule.rule_carry_on] || { text: rule.rule_carry_on, color: '#666' },
    checkIn: map[rule.rule_check_in] || { text: rule.rule_check_in, color: '#666' },
  }
}

module.exports = {
  searchRules,
  getHotQueries,
  getTrips,
  saveTrip,
  updateTrip,
  deleteTrip,
  formatRule
}
