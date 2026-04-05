const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 微信支付配置
// 如果使用云开发绑定的商户号，无需填写此配置
// 如果使用服务商模式，请填写以下信息
const PAY_CONFIG = {
  // 子商户号（如果使用服务商模式）
  subMchId: '',
}

/**
 * 创建微信支付订单
 * @param {Object} event - 传入参数
 * @param {string} event.productId - 商品ID
 * @param {string} event.productName - 商品名称
 * @param {number} event.amount - 金额（单位：分）
 * @param {string} event.openid - 用户openid
 * @param {Object} event.attach - 附加数据（如用户ID、商品信息等）
 */
exports.main = async (event, context) => {
  const { productId, productName, amount, openid, attach = {} } = event

  // 参数校验
  if (!productId || !productName || !amount || !openid) {
    return {
      success: false,
      error: '参数不完整，需要 productId, productName, amount, openid'
    }
  }

  try {
    const db = cloud.database()
    
    // 生成唯一订单号
    const orderNo = generateOrderNo()
    
    // 创建订单记录
    const orderData = {
      orderNo,
      productId,
      productName,
      amount,
      openid,
      attach,
      status: 'pending', // pending, paid, failed
      createTime: db.serverDate(),
      updateTime: db.serverDate(),
    }
    
    // 保存到数据库
    await db.collection('orders').add({
      data: orderData
    })

    // 使用云开发内置的微信支付能力
    // 注意：需要在云开发控制台开通微信支付并绑定商户号
    const payParams = {
      body: productName,
      outTradeNo: orderNo,
      spbillCreateIp: context.CLIENTIP || '127.0.0.1',
      totalFee: amount,
      envId: cloud.DYNAMIC_CURRENT_ENV,
      functionName: 'pay-notify', // 支付结果通知云函数
      openid: openid,
      // 附加数据，会原样返回
      attach: JSON.stringify(attach),
    }
    
    // 如果使用服务商模式，添加子商户号
    if (PAY_CONFIG.subMchId) {
      payParams.subMchId = PAY_CONFIG.subMchId
    }
    
    const res = await cloud.cloudPay.unifiedOrder(payParams)

    if (res.returnCode === 'SUCCESS' && res.resultCode === 'SUCCESS') {
      // 更新订单的 prepayId
      await db.collection('orders').doc(orderNo).update({
        data: {
          prepayId: res.prepayId,
          updateTime: db.serverDate(),
        }
      })

      return {
        success: true,
        orderNo,
        payParams: {
          appId: res.appId,
          timeStamp: String(Math.floor(Date.now() / 1000)),
          nonceStr: res.nonceStr,
          package: `prepay_id=${res.prepayId}`,
          signType: 'RSA',
          paySign: res.paySign,
        }
      }
    } else {
      // 更新订单状态为失败
      await db.collection('orders').doc(orderNo).update({
        data: {
          status: 'failed',
          failReason: res.errCodeDes || res.returnMsg,
          updateTime: db.serverDate(),
        }
      })

      return {
        success: false,
        error: res.errCodeDes || res.returnMsg || '创建订单失败'
      }
    }

  } catch (err) {
    console.error('[create-order] 错误:', err)
    return {
      success: false,
      error: err.message || '系统错误'
    }
  }
}

// 生成订单号
function generateOrderNo() {
  const now = new Date()
  const dateStr = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0')
  const timeStr = String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0')
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `SOUL${dateStr}${timeStr}${randomStr}`
}
