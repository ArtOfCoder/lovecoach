const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

/**
 * 微信支付结果通知
 * 用户支付成功后，微信服务器会调用此云函数
 */
exports.main = async (event, context) => {
  const {
    returnCode,
    resultCode,
    outTradeNo,      // 商户订单号
    transactionId,   // 微信订单号
    bankType,        // 付款银行
    totalFee,        // 订单金额
    cashFee,         // 现金支付金额
    timeEnd,         // 支付完成时间
    attach,          // 附加数据
    openid,          // 用户openid
  } = event

  console.log('[pay-notify] 收到支付通知:', { outTradeNo, returnCode, resultCode })

  try {
    const db = cloud.database()

    // 查询订单
    const orderRes = await db.collection('orders').where({
      orderNo: outTradeNo
    }).get()

    if (orderRes.data.length === 0) {
      console.error('[pay-notify] 订单不存在:', outTradeNo)
      return { code: 'FAIL', message: '订单不存在' }
    }

    const order = orderRes.data[0]

    // 验证金额是否一致
    if (order.amount !== totalFee) {
      console.error('[pay-notify] 金额不匹配:', { orderAmount: order.amount, paidAmount: totalFee })
      return { code: 'FAIL', message: '金额不匹配' }
    }

    if (returnCode === 'SUCCESS' && resultCode === 'SUCCESS') {
      // 支付成功
      await db.collection('orders').doc(order._id).update({
        data: {
          status: 'paid',
          transactionId,
          bankType,
          cashFee,
          payTime: db.serverDate(),
          updateTime: db.serverDate(),
        }
      })

      // 解析附加数据
      let attachData = {}
      try {
        attachData = JSON.parse(attach || '{}')
      } catch (e) {
        console.log('[pay-notify] 附加数据解析失败:', attach)
      }

      // 记录支付成功日志
      await db.collection('payment_logs').add({
        data: {
          type: 'success',
          orderNo: outTradeNo,
          openid,
          amount: totalFee,
          productName: order.productName,
          attach: attachData,
          createTime: db.serverDate(),
        }
      })

      // 如果有用户ID，更新用户统计
      if (attachData.userId) {
        await updateUserStats(db, attachData.userId, totalFee, outTradeNo)
      }

      console.log('[pay-notify] 支付成功处理完成:', outTradeNo)
      return { code: 'SUCCESS', message: 'OK' }

    } else {
      // 支付失败
      await db.collection('orders').doc(order._id).update({
        data: {
          status: 'failed',
          failReason: event.errCodeDes || '支付失败',
          updateTime: db.serverDate(),
        }
      })

      console.log('[pay-notify] 支付失败:', outTradeNo, event.errCodeDes)
      return { code: 'SUCCESS', message: 'OK' } // 仍然返回 SUCCESS 表示已接收通知
    }

  } catch (err) {
    console.error('[pay-notify] 处理异常:', err)
    return { code: 'FAIL', message: err.message }
  }
}

// 更新用户支付统计
async function updateUserStats(db, userId, amount, orderNo) {
  try {
    const statsRes = await db.collection('user_payment_stats').where({
      userId
    }).get()

    if (statsRes.data.length > 0) {
      // 更新现有记录
      const stats = statsRes.data[0]
      await db.collection('user_payment_stats').doc(stats._id).update({
        data: {
          totalAmount: db.command.inc(amount),
          totalOrders: db.command.inc(1),
          lastPayTime: db.serverDate(),
          updateTime: db.serverDate(),
        }
      })
    } else {
      // 创建新记录
      await db.collection('user_payment_stats').add({
        data: {
          userId,
          totalAmount: amount,
          totalOrders: 1,
          firstPayTime: db.serverDate(),
          lastPayTime: db.serverDate(),
          createTime: db.serverDate(),
          updateTime: db.serverDate(),
        }
      })
    }
  } catch (err) {
    console.error('[pay-notify] 更新用户统计失败:', err)
  }
}
