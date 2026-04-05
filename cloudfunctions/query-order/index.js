const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

/**
 * 查询订单状态
 * @param {Object} event - 传入参数
 * @param {string} event.orderNo - 订单号
 */
exports.main = async (event) => {
  const { orderNo } = event

  if (!orderNo) {
    return {
      success: false,
      error: '订单号不能为空'
    }
  }

  try {
    const db = cloud.database()

    // 查询订单
    const orderRes = await db.collection('orders').where({
      orderNo
    }).get()

    if (orderRes.data.length === 0) {
      return {
        success: false,
        error: '订单不存在'
      }
    }

    const order = orderRes.data[0]

    return {
      success: true,
      order: {
        orderNo: order.orderNo,
        productName: order.productName,
        amount: order.amount,
        status: order.status,
        createTime: order.createTime,
        payTime: order.payTime,
        transactionId: order.transactionId,
      }
    }

  } catch (err) {
    console.error('[query-order] 错误:', err)
    return {
      success: false,
      error: err.message || '查询失败'
    }
  }
}
