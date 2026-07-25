/**
 * 云函数：图片识别中转
 * 
 * 作为混元Vision的前端调用的备用方案
 * 当前主方案：前端直接调用 wx.cloud.extend.AI
 * 
 * 此云函数保留作为：1) 降级方案  2) 调用日志记录
 */
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event) => {
  const { imageBase64 } = event

  if (!imageBase64) {
    return { code: -1, error: '缺少图片数据' }
  }

  // 记录调用
  const db = cloud.database()
  try {
    await db.collection('recognition_logs').add({
      data: {
        time: db.serverDate(),
        imageSize: imageBase64.length,
        status: 'received'
      }
    })
  } catch(e) {
    // 数据库可能未创建，忽略
  }

  return {
    code: 0,
    message: '识别由前端直接调用混元Vision完成，此云函数仅作日志记录'
  }
}
