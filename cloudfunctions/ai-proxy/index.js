// 云函数 ai-proxy — DeepSeek 代理
// 部署方式：右键文件夹 → 上传并部署：云端安装依赖

const https = require('https')

const API_KEY   = 'sk-dc86cbd1925a4bbcb7d267eb210d0bfc'
const API_HOST  = 'api.deepseek.com'
const API_PATH  = '/v1/chat/completions'
const MODEL     = 'deepseek-chat'

exports.main = async (event) => {
  console.log('[ai-proxy] event keys:', Object.keys(event))
  console.log('[ai-proxy] messages count:', event.messages ? event.messages.length : 0)
  console.log('[ai-proxy] max_tokens:', event.max_tokens)

  const messages   = event.messages
  const max_tokens = event.max_tokens || 1500
  const temperature = (event.temperature !== undefined) ? event.temperature : 0.8

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    console.error('[ai-proxy] messages 为空')
    return { code: 400, error: 'messages 参数缺失' }
  }

  const body = JSON.stringify({
    model: MODEL,
    messages: messages,
    max_tokens: max_tokens,
    temperature: temperature,
    stream: false,
  })

  console.log('[ai-proxy] 开始请求 DeepSeek，body length:', body.length)

  return new Promise((resolve) => {
    const options = {
      hostname: API_HOST,
      port: 443,
      path: API_PATH,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + API_KEY,
        'Content-Length': Buffer.byteLength(body, 'utf8'),
        'User-Agent': 'lovecoach-miniapp/1.0',
      },
    }

    let raw = ''

    const req = https.request(options, (res) => {
      console.log('[ai-proxy] HTTP status:', res.statusCode)
      res.setEncoding('utf8')
      res.on('data', (chunk) => { raw += chunk })
      res.on('end', () => {
        console.log('[ai-proxy] raw length:', raw.length)
        console.log('[ai-proxy] raw (first 200):', raw.substring(0, 200))

        let parsed
        try {
          parsed = JSON.parse(raw)
        } catch (e) {
          console.error('[ai-proxy] JSON.parse 失败:', e.message)
          resolve({ code: 500, error: '响应解析失败，原始内容: ' + raw.substring(0, 100) })
          return
        }

        if (res.statusCode === 200 && parsed.choices && parsed.choices[0]) {
          const content = (parsed.choices[0].message && parsed.choices[0].message.content) || ''
          console.log('[ai-proxy] 成功，content length:', content.length)
          resolve({ code: 0, content: content.trim() })
        } else if (res.statusCode === 401) {
          console.error('[ai-proxy] 401 API Key 无效')
          resolve({ code: 401, error: 'API Key 无效，请检查密钥' })
        } else if (res.statusCode === 402) {
          console.error('[ai-proxy] 402 余额不足')
          resolve({ code: 402, error: 'DeepSeek 账户余额不足，请充值' })
        } else if (res.statusCode === 429) {
          console.error('[ai-proxy] 429 限流')
          resolve({ code: 429, error: '请求过于频繁，请稍后再试' })
        } else if (res.statusCode === 503 || res.statusCode === 500) {
          const errMsg = (parsed.error && parsed.error.message) || ('DeepSeek 服务异常 ' + res.statusCode)
          console.error('[ai-proxy] 服务端错误:', errMsg)
          resolve({ code: res.statusCode, error: errMsg })
        } else {
          const errMsg = (parsed.error && parsed.error.message) || ('HTTP ' + res.statusCode)
          console.error('[ai-proxy] 未知错误:', errMsg, raw.substring(0, 200))
          resolve({ code: res.statusCode, error: errMsg })
        }
      })
    })

    req.setTimeout(25000, () => {
      console.error('[ai-proxy] 请求超时')
      req.destroy()
      resolve({ code: 408, error: '请求 DeepSeek 超时，请稍后重试' })
    })

    req.on('error', (e) => {
      console.error('[ai-proxy] https 请求错误:', e.message, 'code:', e.code)
      if (e.code === 'ENOTFOUND' || e.code === 'ECONNREFUSED') {
        resolve({ code: 503, error: '无法连接 DeepSeek，网络错误: ' + e.code })
      } else {
        resolve({ code: 500, error: '网络请求失败: ' + e.message })
      }
    })

    req.write(body)
    req.end()
  })
}
