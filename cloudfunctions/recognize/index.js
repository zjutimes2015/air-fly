/**
 * 云函数：拍照识别物品
 * 
 * 使用腾讯云 OCR 识别图片中的文字，然后匹配航空规则知识库
 * 
 * 调用方式：
 *   wx.cloud.callFunction({
 *     name: 'recognize',
 *     data: { fileID: 'cloud://xxx.jpg' }
 *   }).then(res => { ... })
 * 
 * 返回：
 *   { 
 *     recognized: '物品名称', 
 *     match: { name, carryOn, checkIn, conditions }, 
 *     raw_text: 'OCR识别的原始文字'
 *   }
 */

// 方法1：微信云开发自带的 OCR（依赖插件）
// 方法2：调用腾讯云 OCR API
// 方法3：调用公开的 OCR API

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

// 内置简单规则匹配
const rules = {
  categories: [
    {
      name: '电池',
      keywords: ['充电宝', '电池', '移动电源', 'power bank', '锂', '20000', '10000', 'mAh'],
      result: { carryOn: '✅ 可以随身携带', checkIn: '❌ 禁止托运' }
    },
    {
      name: '化妆品',
      keywords: ['水', '乳', '霜', '液', '露', '喷雾', '防晒', '粉底', '口红', '面膜', '精华', '洁面'],
      result: { carryOn: '⚠️ 单体≤100ml', checkIn: '✅ 可以托运' }
    },
    {
      name: '酒类',
      keywords: ['酒', '茅台', '五粮液', '白酒', '红酒', '啤酒', '酒精', '洋酒'],
      result: { carryOn: '❌ 禁止随身', checkIn: '⚠️ 24%-70%限5L' }
    },
    {
      name: '刀具',
      keywords: ['刀', '剪刀', '菜刀', '瑞士军刀', '美工刀', '水果刀'],
      result: { carryOn: '❌ 禁止随身', checkIn: '✅ 必须托运' }
    },
    {
      name: '自热食品',
      keywords: ['自热', '自嗨', '自热锅', '加热包', '方便火锅'],
      result: { carryOn: '❌ 禁止', checkIn: '❌ 禁止' }
    }
  ]
}

exports.main = async (event, context) => {
  const { fileID, text } = event

  // 如果直接传了文字，直接匹配
  if (text) {
    return matchRule(text)
  }

  // 如果有图片文件，尝试 OCR
  if (fileID) {
    try {
      // 方法1: 使用微信云调用 OCR
      const result = await cloud.openapi.ocr.printedText({
        imgUrl: fileID,
        imgType: 'image'
      })
      
      const rawText = result.items.map(i => i.text).join(' ')
      return matchRule(rawText)
    } catch (err) {
      return {
        code: -1,
        error: 'OCR识别失败',
        detail: err.toString()
      }
    }
  }

  return { code: -1, error: '缺少参数，需要 fileID 或 text' }
}

function matchRule(text) {
  if (!text) return { code: -1, error: '无法识别文字' }

  const lower = text.toLowerCase()
  let bestMatch = null
  let bestScore = 0

  for (const cat of rules.categories) {
    for (const kw of cat.keywords) {
      if (lower.includes(kw)) {
        const score = kw.length
        if (score > bestScore) {
          bestScore = score
          bestMatch = {
            category: cat.name,
            recognized: kw,
            rawText: text,
            ...cat.result
          }
        }
      }
    }
  }

  if (bestMatch) {
    return { code: 0, ...bestMatch }
  }

  return {
    code: 1,
    recognized: text,
    result: '未能匹配到规则，建议手动输入查询',
    rawText: text
  }
}
