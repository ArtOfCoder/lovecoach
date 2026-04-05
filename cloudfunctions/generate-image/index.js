// cloudfunctions/generate-image/index.js
// 灵魂伴侣图像生成云函数 - 调用腾讯混元生图 API
// 免费额度：首次开通后有免费资源包（100万Tokens/年）

const cloud = require('wx-server-sdk')
const crypto = require('crypto')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// ============ 配置区域 ============
// 在腾讯云控制台获取：https://console.cloud.tencent.com/cam/capi
// 首次开通混元生图服务：https://console.cloud.tencent.com/hunyuan
const TC_CONFIG = {
  secretId: 'YOUR_SECRET_ID',      // 替换为你的 SecretId
  secretKey: 'YOUR_SECRET_KEY',   // 替换为你的 SecretKey
  region: 'ap-guangzhou',
}

// 生成腾讯云签名 v3 (TC3-HMAC-SHA256)
function getAuthParams(config) {
  const timestamp = Math.floor(Date.now() / 1000)
  const date = new Date(timestamp * 1000).toISOString().slice(0, 10)
  
  // 1. 拼接规范请求串
  const httpRequestMethod = 'POST'
  const canonicalUri = '/'
  const canonicalQueryString = ''
  const canonicalHeaders = `content-type:application/json\nhost:aiart.tencentcloudapi.com\nx-tc-action:SubmitTextToImageJob\n`
  const signedHeaders = 'content-type;host;x-tc-action'
  const hashedRequestPayload = crypto.createHash('sha256').update('').digest('hex')
  
  const canonicalRequest = [
    httpRequestMethod,
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    hashedRequestPayload
  ].join('\n')

  // 2. 拼接待签名字符串
  const algorithm = 'TC3-HMAC-SHA256'
  const credentialScope = `${date}/tc3_request`
  const hashedCanonicalRequest = crypto.createHash('sha256').update(canonicalRequest).digest('hex')
  const stringToSign = [
    algorithm,
    timestamp,
    credentialScope,
    hashedCanonicalRequest
  ].join('\n')

  // 3. 计算签名
  const secretKey = 'TC3' + config.secretKey
  const secretDate = crypto.createHmac('sha256', secretKey).update(date).digest()
  const secretSigning = crypto.createHmac('sha256', secretDate).update('tc3_request').digest()
  const signature = crypto.createHmac('sha256', secretSigning).update(stringToSign).digest('hex')

  // 4. 拼接 Authorization
  const authorization = `${algorithm} Credential=${config.secretId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

  return {
    timestamp,
    authorization
  }
}

exports.main = async (event) => {
  const { zodiac, gender, desc, seed } = event

  console.log('[generate-image] 接收参数:', { zodiac, gender, desc, seed })

  // 检查是否配置了密钥
  if (TC_CONFIG.secretId === 'YOUR_SECRET_ID') {
    console.log('[generate-image] 未配置腾讯云密钥，使用本地备用方案')
    return {
      success: false,
      error: '未配置腾讯云密钥',
      needConfig: true,
    }
  }

  try {
    // 构建生图提示词
    const targetGenderText = gender === 'male' ? '年轻帅气的男生' : '年轻漂亮的女生'
    const prompt = `星座为${zodiac}的${targetGenderText}，${desc}。风格：浪漫艺术风格，柔和的光线，温暖的色调，梦幻般的效果，半身肖像，正面面部，精致细腻的眼睛，高质量肖像摄影，电影级布光。`

    console.log('[generate-image] 发送提示词:', prompt)

    // 获取认证信息
    const { timestamp, authorization } = getAuthParams(TC_CONFIG)

    // 提交混元生图任务
    const requestBody = JSON.stringify({
      Prompt: prompt,
      Resolution: '1024:1024',
      Seed: seed || Math.floor(Math.random() * 1000000),
      Revise: 1
    })

    // 使用 HTTPS 请求
    const axios = require('axios')
    const response = await axios.post(
      'https://aiart.tencentcloudapi.com/',
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
          'Host': 'aiart.tencentcloudapi.com',
          'X-TC-Action': 'SubmitTextToImageJob',
          'X-TC-Version': '2022-12-29',
          'X-TC-Timestamp': timestamp,
          'X-TC-Region': TC_CONFIG.region,
          'Authorization': authorization,
        },
        timeout: 30000,
      }
    )

    const result = response.data

    if (result.Response && result.Response.JobId) {
      console.log('[generate-image] 任务提交成功，JobId:', result.Response.JobId)
      
      // 这里返回 JobId，前端可以轮询查询结果
      // 为简化流程，这里直接返回成功状态，实际需要查询图片
      return {
        success: true,
        jobId: result.Response.JobId,
        message: '任务已提交',
        zodiac: zodiac,
        gender: gender,
      }
    } else {
      console.error('[generate-image] API 返回错误:', result)
      return {
        success: false,
        error: result.Response?.Error?.Message || '生图失败',
        zodiac: zodiac,
        gender: gender,
      }
    }

  } catch (error) {
    console.error('[generate-image] 生图失败:', error.message)
    return {
      success: false,
      error: error.message || '生图失败',
      zodiac: zodiac,
      gender: gender,
    }
  }
}