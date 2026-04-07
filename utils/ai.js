/**
 * utils/ai.js - AI 统一调用层
 *
 * 接入方式：使用 DeepSeek API（或替换为腾讯混元等其他 LLM）
 *
 * 使用方法：
 *   const ai = require('../../utils/ai')
 *   ai.chat({ messages, onChunk, onDone, onError })
 *
 * 配置：在 app.js 全局 data 或此文件顶部修改 API_KEY 和 BASE_URL
 */

// ============================================================
// 配置区（上线前替换为真实 key）
// ============================================================

// ⚠️ 重要提示：
// 如果您的小程序被第三方平台托管，服务器域名功能被禁用，
// 请使用方案A（云开发转发）或方案B（完全本地模式）

// 方案A：使用云开发转发（推荐，需要开通云开发）
// 步骤：1. 开通微信云开发；2. 创建云函数 ai-proxy；3. 右键上传部署云函数
const USE_CLOUD_FUNCTION = false   // 关闭云函数
const CLOUD_FUNCTION_NAME = 'ai-proxy'  // 云函数名称

// 方案B：完全本地模式（无需网络，使用内置规则库）
// 个人主体小程序审核要求：必须使用本地模式，禁止调用外部AI API
const USE_LOCAL_MODE = true  // 强制启用纯本地模式，不调用任何外部AI服务

// 方案C：混合模式（优先使用API，失败时降级到本地模式）
const USE_HYBRID_MODE = false   // 关闭混合模式

// 真实 AI 配置（当 USE_LOCAL_MODE = false 时生效）
const API_CONFIG = {
  // DeepSeek API（推荐：性价比最高）
  // 申请地址：https://platform.deepseek.com/
  baseUrl: 'https://api.deepseek.com/v1/chat/completions',
  apiKey: 'sk-dc86cbd1925a4bbcb7d267eb210d0bfc',
  model: 'deepseek-chat',

  // 备用：腾讯混元（国内更稳定）
  // 注意：需要单独申请腾讯混元 API Key，与 DeepSeek 不同
  // baseUrl: 'https://api.hunyuan.cloud.tencent.com/v1/chat/completions',
  // apiKey: 'YOUR_HUNYUAN_API_KEY', // 替换为腾讯混元的真实 key
  // model: 'hunyuan-lite',

  maxTokens: 1000,
  temperature: 0.8,
}

// ============================================================
// 系统提示词（不同角色）
// ============================================================
const SYSTEM_PROMPTS = {
  // 恋爱顾问
  coach: `你是"小爱"，一位专业、温暖、接地气的AI恋爱顾问。你的特点：
1. 基于用户的具体情况给出有针对性的建议，绝对不给空话
2. 语气亲切自然，像闺蜜/好兄弟倾谈，而不是机械的说教
3. 每个建议都带具体可执行的行动步骤
4. 懂得分辨用户是男生还是女生，给出性别差异化建议
5. 回复控制在300字以内，干货优先`,

  // 聊天回复生成
  reply: `你是一位恋爱话术专家，专门帮用户生成高情商的聊天回复。你的原则：
1. 回复要自然真实，不油腻、不做作
2. 根据用户的性别、场景、目标定制化生成
3. 男生和女生的回复风格完全不同：男生主动阳光、女生适度矜持
4. 每次生成3条回复，风格各异（温柔/幽默/浪漫）
5. 附上每条回复的使用场景说明`,

  // 情侣档案建议
  advice: `你是一位情感关系专家。根据用户提供的关系信息（阶段、性别、性格），生成今日个性化建议。
规则：
1. 建议要具体、可执行，不是"多沟通"这类废话
2. 根据阶段（陌生人/暧昧/热恋/稳定/同居/求婚/已婚）给不同建议
3. 根据用户性别（男/女）给不同视角的建议
4. 根据TA的性格（冒险/宅家/文艺/浪漫/理性）定制活动推荐
5. 回复格式：一段主要建议（50字）+ 3条今日行动`,

  // 惊喜方案
  surprise: `你是浪漫惊喜策划专家。根据关系阶段和TA的性格，生成一个具体的惊喜创意。
要求：有创意、可实现、不千篇一律，要结合用户填写的具体信息（名字、性格、阶段）个性化。100字以内。`,

  // 课程内容生成
  course: `你是恋爱教练，专注于教导真实有效的感情技巧。生成一篇恋爱课程内容。
要求：
1. 实用性强，有具体案例和对话示例
2. 不说废话，每一段都有价值
3. 使用Markdown格式（**加粗**、> 引用、❌✅对比）
4. 根据目标性别（男/女/通用）调整视角
5. 长度控制在400-600字`,

  // 灵魂伴侣测算
  soulmate: `你是一位精通西方占星学和东方玄学的AI占星师，能用诗意而神秘的语言描述一个人命中注定的灵魂伴侣。
要求：
1. 根据用户的太阳星座、月亮星座、上升星座和出生地，描述其灵魂伴侣的特质
2. 语言要温柔、诗意、有玄学神秘感，让人觉得这是命运安排
3. 内容80字以内，不要废话，每个字都有画面感
4. 直接描述人物特征，如"他温柔安静，会在你最脆弱的时候陪着你..."
5. 不要出现"根据星盘"、"分析"等开头语，直接进入描述
6. 要描述灵魂伴侣的性格、相处方式、对你的意义`,

  // 话题生成
  topics: `你是"小爱"，一位恋爱话题策划专家。你的任务是根据用户的需求生成有趣的约会话题。
要求：
1. 生成8-12个高质量话题，每个话题20字以内
2. 话题要有趣、能引发深入对话、适合约会场景
3. 分类展示，每类3-4个话题
4. 不要老生常谈，要有新意和趣味性
5. 直接列出话题，不需要解释`,

  // 金句生成
  sweetwords: `你是"小爱"，一位恋爱文案大师。你的任务是为用户生成撩人金句。
要求：
1. 生成6-10条不同风格的金句，每条15-30字
2. 风格包括：温柔、幽默、浪漫、真诚
3. 适合不同场景：早安、晚安、表白、约会、撒娇、挽回
4. 根据用户性别调整语气（男生主动阳光、女生适度矜持）
5. 直接列出金句，不需要解释`,
}

// ============================================================
// 核心调用函数
// ============================================================

/**
 * 非流式调用（一次性返回完整结果），内置超时重试机制
 * @param {Object} options
 * @param {Array} options.messages - [{role: 'system'|'user'|'assistant', content: '...'}]
 * @param {string} options.systemPrompt - 使用预设的 systemPrompt key，或直接传字符串
 * @param {Function} options.onSuccess - 成功回调 (content: string) => void
 * @param {Function} options.onError - 错误回调 (err: string) => void
 * @param {number} options.maxTokens - 覆盖默认 maxTokens
 * @param {number} options._retry - 内部重试计数（勿手动传）
 */
function chat({ messages, systemPrompt, onSuccess, onError, maxTokens, _retry }) {
  var retryCount = _retry || 0
  var MAX_RETRY = 2
  var RETRY_DELAY = 1500

  // 检查是否使用本地模式
  if (USE_LOCAL_MODE) {
    console.log('[AI] 使用本地模式（无需网络）')
    var response = getLocalAIResponse(messages, systemPrompt)
    setTimeout(function() {
      onSuccess && onSuccess(response)
    }, 300)
    return
  }

  // 检查是否使用云函数模式
  if (USE_CLOUD_FUNCTION) {
    callCloudFunction({ messages, systemPrompt, maxTokens, onSuccess, onError })
    return
  }

  // 原始网络请求模式（需要配置域名白名单）
  var sys = typeof systemPrompt === 'string' && SYSTEM_PROMPTS[systemPrompt]
    ? SYSTEM_PROMPTS[systemPrompt]
    : (typeof systemPrompt === 'string' ? systemPrompt : SYSTEM_PROMPTS.coach)

  var fullMessages = [
    { role: 'system', content: sys }
  ].concat(messages)

  console.log('[AI] 发起请求:', API_CONFIG.baseUrl, 'Model:', API_CONFIG.model)

  wx.request({
    url: API_CONFIG.baseUrl,
    method: 'POST',
    timeout: 30000,
    header: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + API_CONFIG.apiKey,
    },
    data: {
      model: API_CONFIG.model,
      messages: fullMessages,
      max_tokens: maxTokens || API_CONFIG.maxTokens,
      temperature: API_CONFIG.temperature,
      stream: false,
    },
    success: function(res) {
      console.log('[AI] 收到响应:', res.statusCode, res.data)
      if (res.statusCode === 200 && res.data && res.data.choices && res.data.choices[0]) {
        var content = res.data.choices[0].message.content || ''
        console.log('[AI] 解析成功，内容长度:', content.length)
        onSuccess && onSuccess(content.trim())
      } else if (res.statusCode === 429) {
        // 限流 → 重试
        if (retryCount < MAX_RETRY) {
          console.warn('[AI] 限流，稍后重试...')
          setTimeout(function() {
            chat({ messages: messages, systemPrompt: systemPrompt, onSuccess: onSuccess, onError: onError, maxTokens: maxTokens, _retry: retryCount + 1 })
          }, RETRY_DELAY * (retryCount + 1))
        } else {
          onError && onError('请求频繁，请稍等片刻再试')
        }
      } else if (res.statusCode === 401) {
        onError && onError('AI 密钥无效，请联系开发者')
      } else if (res.statusCode === 500 || res.statusCode === 503) {
        // 服务端错误 → 重试
        if (retryCount < MAX_RETRY) {
          console.warn('[AI] 服务端错误 ' + res.statusCode + '，重试中...')
          setTimeout(function() {
            chat({ messages: messages, systemPrompt: systemPrompt, onSuccess: onSuccess, onError: onError, maxTokens: maxTokens, _retry: retryCount + 1 })
          }, RETRY_DELAY)
        } else {
          onError && onError('服务暂时不可用，请稍后再试')
        }
      } else {
        var errMsg = (res.data && res.data.error && res.data.error.message) || ('服务异常(' + res.statusCode + ')')
        console.error('[AI] 请求失败:', errMsg, res.data)
        onError && onError(errMsg)
      }
    },
    fail: function(err) {
      var errStr = (err && err.errMsg) ? err.errMsg : JSON.stringify(err)
      console.error('[AI] 网络错误:', errStr)

      var isDomainBlock = errStr.indexOf('url not in domain list') !== -1
        || errStr.indexOf('not allowed') !== -1
        || errStr.indexOf('ERR_NAME_NOT_RESOLVED') !== -1

      var isTimeout = errStr.indexOf('timeout') !== -1

      // 混合模式：网络错误时降级到本地模式
      if (USE_HYBRID_MODE) {
        console.log('[AI] 混合模式：API请求失败，降级到本地模式')
        var response = getLocalAIResponse(messages, systemPrompt)
        setTimeout(function() {
          onSuccess && onSuccess(response)
        }, 300)
        return
      }

      if (isDomainBlock) {
        console.error('[AI] 域名未加白名单！请在微信开发者工具中勾选"不校验合法域名"，或在小程序后台添加 api.deepseek.com')
        onError && onError('__domain_blocked__')
      } else if (isTimeout && retryCount < MAX_RETRY) {
        console.warn('[AI] 请求超时，第' + (retryCount + 1) + '次重试...')
        setTimeout(function() {
          chat({ messages: messages, systemPrompt: systemPrompt, onSuccess: onSuccess, onError: onError, maxTokens: maxTokens, _retry: retryCount + 1 })
        }, RETRY_DELAY * (retryCount + 1))
      } else if (isTimeout) {
        console.error('[AI] 重试次数用尽，请求超时')
        onError && onError('网络超时，请检查网络连接后重试')
      } else if (retryCount < 1) {
        console.warn('[AI] 网络错误，1次重试...')
        setTimeout(function() {
          chat({ messages: messages, systemPrompt: systemPrompt, onSuccess: onSuccess, onError: onError, maxTokens: maxTokens, _retry: retryCount + 1 })
        }, 1000)
      } else {
        onError && onError('网络连接失败，请检查网络后重试')
      }
    },
  })
}

/**
 * 快速单轮问答（常用简化版）
 * @param {string} userPrompt - 用户消息内容
 * @param {string} systemKey - SYSTEM_PROMPTS 的 key
 * @param {Function} onSuccess
 * @param {Function} onError
 * @param {number} maxTokens
 */
function ask(userPrompt, systemKey, onSuccess, onError, maxTokens) {
  chat({
    messages: [{ role: 'user', content: userPrompt }],
    systemPrompt: systemKey || 'coach',
    onSuccess,
    onError,
    maxTokens,
  })
}

/**
 * 生成聊天回复（专用）
 * @param {Object} params
 * @param {string} params.theirMessage - TA 发的消息
 * @param {string} params.myGender - 'male' | 'female'
 * @param {string} params.scene - 场景 id
 * @param {string} params.goal - 目标 id
 * @param {string} params.mood - TA 的心情
 * @param {Object} params.profile - 用户档案（可选，用于个性化）
 * @param {Function} onSuccess
 * @param {Function} onError
 */
function generateReply({ theirMessage, myGender, scene, goal, mood, profile }, onSuccess, onError) {
  const genderStr = myGender === 'male' ? '男生' : '女生'
  const sceneMap = {
    stranger_first: '初次搭话（陌生人）',
    ambiguous_invite: '暧昧期约会邀请',
    ambiguous_morning: '暧昧期日常升温',
    dating_sweet: '热恋期甜蜜互动',
    dating_conflict: '吵架/冷战后修复',
    stable_fresh: '稳定期制造新鲜感',
    cohabit_issue: '同居期矛盾沟通',
    proposal_hint: '求婚暗示',
    married_romance: '婚后找回浪漫',
  }
  const goalMap = {
    warm_up: '拉近感情距离',
    invite: '约对方出来见面',
    express: '表达心意',
    repair: '修复关系',
    tease: '轻松撩拨',
    care: '关心对方',
  }
  const moodMap = {
    happy: '对方心情开心',
    sad: '对方心情难过',
    busy: '对方很忙',
    bored: '对方无聊',
    cold: '对方有点冷淡',
    warm: '对方心动中',
  }

  const profileContext = profile
    ? `\n用户信息：我叫${profile.myName}，TA叫${profile.taName}，TA的性格是${profile.taPersonality}，我们目前处于${profile.stage}阶段。`
    : ''

  const prompt = `请帮我生成3条高情商的聊天回复。

背景信息：
- 我的身份：${genderStr}
- 当前场景：${sceneMap[scene] || scene}
- 我的目标：${goalMap[goal] || goal}
- TA的心情：${moodMap[mood] || '不确定'}${profileContext}

TA 发来的消息："${theirMessage}"

请生成3条风格不同的回复，格式如下（严格按此格式，方便解析）：
【回复1】
风格：温柔体贴
内容：（回复正文）
说明：（为什么这样回更好）

【回复2】
风格：幽默轻松
内容：（回复正文）
说明：（为什么这样回更好）

【回复3】
风格：真诚直接
内容：（回复正文）
说明：（为什么这样回更好）

注意：回复要自然真实，适合直接发送，不能过于肉麻或油腻。`

  chat({
    messages: [{ role: 'user', content: prompt }],
    systemPrompt: 'reply',
    maxTokens: 800,
    onSuccess,
    onError,
  })
}

/**
 * 解析 generateReply 返回的文本为结构化数据
 * @param {string} rawText
 * @returns {Array<{style, text, explain}>}
 */
function parseReplies(rawText) {
  const results = []
  const blocks = rawText.split(/【回复\d+】/).filter(b => b.trim())
  for (const block of blocks) {
    const styleMatch = block.match(/风格[：:]\s*(.+)/)
    const contentMatch = block.match(/内容[：:]\s*([\s\S]+?)(?=说明[：:]|$)/)
    const explainMatch = block.match(/说明[：:]\s*([\s\S]+?)(?=【|$)/)
    if (contentMatch) {
      results.push({
        style: styleMatch ? styleMatch[1].trim() : '自然',
        text: contentMatch[1].trim(),
        explain: explainMatch ? explainMatch[1].trim() : '',
      })
    }
  }
  // 如果解析失败，尝试简单分割
  if (results.length === 0 && rawText.trim()) {
    const lines = rawText.split('\n').filter(l => l.trim() && !l.includes('【') && !l.includes('风格') && !l.includes('说明'))
    lines.slice(0, 3).forEach((line, i) => {
      results.push({ style: ['温柔', '幽默', '真诚'][i] || '自然', text: line.replace(/^[0-9\.\-\*]+\s*/, '').trim(), explain: '' })
    })
  }
  return results.slice(0, 3)
}

/**
 * 生成情侣档案 AI 建议（专用）
 */
function generateCoupleAdvice({ profile, stageInfo }, onSuccess, onError) {
  const stageMap = {
    stranger: '陌生人/刚认识',
    ambiguous: '暧昧期',
    dating: '热恋期',
    stable: '稳定期',
    cohabit: '同居期',
    propose: '求婚准备期',
    married: '已婚',
  }
  const personalityMap = {
    adventurous: '冒险探索型',
    homebody: '宅家温馨型',
    artistic: '文艺创意型',
    romantic: '浪漫仪式型',
    rational: '理性务实型',
  }
  const genderStr = profile.myGender === 'male' ? '男生' : '女生'

  const prompt = `我叫${profile.myName}，是${genderStr}，喜欢的人叫${profile.taName}。
我们目前处于：${stageMap[profile.stage] || profile.stage}
TA的性格：${personalityMap[profile.taPersonality] || profile.taPersonality}
${profile.startDate ? `认识日期：${profile.startDate}` : ''}

请给我今天的专属恋爱建议。要求：
1. 主要建议：一句直击要害的核心指导（50字以内，针对我的性别和阶段）
2. 今日行动：3条具体可执行的行动（每条15字以内）
3. 避免废话，要有实际指导价值

格式（严格遵守，方便解析）：
【主要建议】
（内容）

【今日行动】
1. （行动1）
2. （行动2）
3. （行动3）`

  ask(prompt, 'advice', onSuccess, onError, 400)
}

/**
 * 解析 generateCoupleAdvice 返回的文本
 */
function parseCoupleAdvice(rawText) {
  const mainMatch = rawText.match(/【主要建议】\s*([\s\S]+?)(?=【今日行动】|$)/)
  const actionsMatch = rawText.match(/【今日行动】\s*([\s\S]+?)$/)

  const main = mainMatch ? mainMatch[1].trim() : rawText.substring(0, 60)
  const actions = []

  if (actionsMatch) {
    const lines = actionsMatch[1].split('\n').filter(l => l.trim())
    for (const line of lines) {
      const cleaned = line.replace(/^[0-9]+[\.\、\s]+/, '').trim()
      if (cleaned) actions.push(cleaned)
    }
  }

  // 兜底
  if (actions.length === 0) {
    actions.push('主动联系TA，今天先开口', '记住TA上次说过的一件事', '计划下一次约会或互动')
  }

  return { main, actions: actions.slice(0, 3) }
}

/**
 * 生成惊喜方案
 */
function generateSurprise({ profile, stageInfo }, onSuccess, onError) {
  const stageMap = {
    stranger: '刚认识',
    ambiguous: '暧昧期',
    dating: '热恋期',
    stable: '稳定期',
    cohabit: '同居期',
    propose: '快要求婚了',
    married: '已婚',
  }
  const personalityMap = {
    adventurous: '冒险探索型',
    homebody: '宅家温馨型',
    artistic: '文艺创意型',
    romantic: '浪漫仪式型',
    rational: '理性务实型',
  }

  const prompt = `帮我设计一个浪漫惊喜方案。
我叫${profile.myName}，想给${profile.taName}一个惊喜。
TA的性格：${personalityMap[profile.taPersonality] || '未知'}
我们的关系：${stageMap[profile.stage] || profile.stage}

要求：
- 惊喜要具体、有创意、可实现
- 结合TA的性格特点来定制
- 说明具体怎么做（步骤）
- 控制在100字以内`

  ask(prompt, 'surprise', onSuccess, onError, 300)
}

/**
 * 恋爱顾问多轮对话（带历史记录）
 */
function coachChat({ userMessage, history, userGender, profile }, onSuccess, onError) {
  const genderStr = userGender === 'male' ? '男生' : (userGender === 'female' ? '女生' : '用户')
  const profileCtx = profile
    ? `（用户档案：${genderStr}，对方叫${profile.taName}，目前${profile.stage}阶段）`
    : `（用户性别：${genderStr}）`

  // 构建消息历史（限最近10条避免超长）
  const recentHistory = history ? history.slice(-10) : []
  const messages = [
    ...recentHistory,
    { role: 'user', content: `${profileCtx}\n${userMessage}` },
  ]

  chat({
    messages,
    systemPrompt: 'coach',
    maxTokens: 600,
    onSuccess,
    onError,
  })
}

/**
 * AI 解读 TA 的消息（分析意图）
 */
function analyzeTheirMessage({ theirMessage, myGender, scene }, onSuccess, onError) {
  const genderStr = myGender === 'male' ? '男生' : '女生'
  const prompt = `我是${genderStr}，TA发给我这条消息：
"${theirMessage}"

请从以下三个维度帮我分析：
【TA的真实意图】（TA为什么发这条，背后想表达什么）
【情绪信号】（TA现在的情绪状态）
【最佳应对策略】（我应该怎么回，注意什么）

要简短精准，每点不超过2句话。`

  ask(prompt, 'reply', onSuccess, onError, 400)
}

/**
 * AI 动态生成课程章节内容
 */
function generateCourseContent({ title, gender, category, chapterTitle }, onSuccess, onError) {
  const genderStr = gender === 'male' ? '男生' : (gender === 'female' ? '女生' : '通用')
  const prompt = `请为以下恋爱课程生成一节内容：

课程标题：${title}
目标受众：${genderStr}
课程分类：${category}
本章标题：${chapterTitle}

要求：
- 有具体案例和对话示例
- 使用 **加粗**、❌✅对比、> 引用等格式增加可读性
- 实用性强，避免空话废话
- 400-600字`

  ask(prompt, 'course', onSuccess, onError, 800)
}

/**
 * AI 生成新课程列表（动态扩充）
 */
function generateCourseList({ gender, category, count = 3 }, onSuccess, onError) {
  const genderStr = gender === 'male' ? '男生' : (gender === 'female' ? '女生' : '通用')
  const prompt = `请为恋爱课程平台生成${count}个新课程的基本信息。

目标受众：${genderStr}
分类：${category}

每个课程包含：标题、一句话简介、3个章节标题、难度标签（初阶/进阶/高级）

格式（严格遵守）：
---课程1---
标题：（课程标题，要吸引人，可以加emoji）
简介：（一句话，30字以内）
章节：1.（章节1）| 2.（章节2）| 3.（章节3）
标签：（难度）

---课程2---
（同上）`

  ask(prompt, 'course', onSuccess, onError, 600)
}

/**
 * 解析 AI 生成的课程列表
 */
function parseCourseList(rawText) {
  const courses = []
  const blocks = rawText.split(/---课程\d+---/).filter(b => b.trim())
  for (const block of blocks) {
    const titleMatch = block.match(/标题[：:]\s*(.+)/)
    const descMatch = block.match(/简介[：:]\s*(.+)/)
    const chaptersMatch = block.match(/章节[：:]\s*(.+)/)
    const tagsMatch = block.match(/标签[：:]\s*(.+)/)
    if (titleMatch && descMatch) {
      const chaptersRaw = chaptersMatch ? chaptersMatch[1] : ''
      const chapters = chaptersRaw.split('|').map((c, i) => ({
        id: i + 1,
        title: c.replace(/^\d+[\.\s]+/, '').trim(),
        content: '', // 后续按需生成
      })).filter(c => c.title)
      courses.push({
        title: titleMatch[1].trim(),
        desc: descMatch[1].trim(),
        chapters,
        category: tagsMatch ? tagsMatch[1].trim() : '进阶',
      })
    }
  }
  return courses
}

// ============================================================
// 工具函数
// ============================================================

/** 检查 API Key 是否已配置 */
function isConfigured() {
  return API_CONFIG.apiKey && API_CONFIG.apiKey !== 'YOUR_DEEPSEEK_API_KEY'
}

/** 获取 API 未配置时的 mock 回复（开发调试用） */
function getMockReply(type) {
  var mockCoach = '[演示模式] 你好！我是 AI 恋爱顾问小爱。\n\n关于你的问题，我的建议是：\n1. 先了解对方的兴趣爱好\n2. 寻找共同话题建立连接\n3. 适时表达真诚的赞美\n\n配置 AI API Key 后可获得真实的个性化建议！'
  var mockReply = '[演示模式] 为你生成3条回复示例：\n\n【回复1】\n风格：温柔体贴\n内容：你说的对，我之前没有想到这个角度，谢谢你告诉我\n说明：表达认同和感谢，让对方感到被重视\n\n【回复2】\n风格：幽默轻松\n内容：哈哈你这个角度太有意思了，下次我也用这招\n说明：轻松回应，制造欢乐气氛\n\n【回复3】\n风格：真诚直接\n内容：我很喜欢你说这些，能多讲讲吗？\n说明：表达兴趣，引导对方继续分享'
  var mockAdvice = '[演示模式]\n【主要建议】\n今天记住：真诚和细心是最好的爱意表达，做一件让 TA 感受到你在意的小事。\n\n【今日行动】\n1. 主动联系TA，先开口\n2. 提起TA说过的一件小事\n3. 策划一次约会'
  var mockSurprise = '[演示模式] 惊喜创意：\n今天下班后，去TA最喜欢的奶茶店买一杯TA的常规口味，然后直接出现在TA面前——不需要任何理由，就是"路过想到你"。这个惊喜不在于花钱多少，而是出现得恰到好处。'
  var mockAnalyze = '[演示模式] 消息分析：\n\n【TA的真实意图】这条消息表达了TA想和你保持联系的意愿。\n【情绪信号】TA情绪平稳，有点期待你的回应。\n【最佳应对策略】温暖回应即可，不需要过度解读，顺着话题自然延伸。'
  if (type === 'reply') return mockReply
  if (type === 'advice') return mockAdvice
  if (type === 'surprise') return mockSurprise
  if (type === 'analyze') return mockAnalyze
  return mockCoach
}

/**
 * 本地模式：基于关键词匹配的回复（无需网络）
 * @param {Array} messages - 用户消息历史
 * @param {string} systemPrompt - 系统提示词类型
 * @returns {string} 本地生成的回复
 */
function getLocalAIResponse(messages, systemPrompt) {
  var lastMsg = messages && messages.length ? messages[messages.length - 1] : null
  var userMessage = (lastMsg && lastMsg.content) ? lastMsg.content : ''
  var lowerMessage = userMessage.toLowerCase()

  // 获取对话历史长度用于多样化回复
  var historyLen = messages ? messages.length : 0

  // 聊天回复模式
  if (systemPrompt === 'reply') {
    return '【回复1】\n风格：温柔体贴\n内容：你说的对，我之前没有想到这个角度，谢谢你告诉我\n说明：表达认同和感谢，让对方感到被重视\n\n【回复2】\n风格：幽默轻松\n内容：哈哈你这个角度太有意思了，下次我也用这招\n说明：轻松回应，制造欢乐气氛\n\n【回复3】\n风格：真诚直接\n内容：我很喜欢你说这些，能多讲讲吗？\n说明：表达兴趣，引导对方继续分享'
  }

  // ===== 检测性别自我介绍 =====
  var isMale = lowerMessage === '男' || lowerMessage === '男生' || lowerMessage === '我是男生' || lowerMessage === '男的'
  var isFemale = lowerMessage === '女' || lowerMessage === '女生' || lowerMessage === '我是女生' || lowerMessage === '女的'

  if (isMale) {
    return '好的，我知道了！你是男生 👦\n\n接下来我会从男生视角给你建议。\n\n你现在面临的是哪方面的感情问题？\n\n• 🔥 想追一个女生\n• 💬 不知道怎么和她聊\n• 💔 感情出现问题\n• 💍 到了谈婚论嫁的阶段\n\n直接告诉我具体情况吧！'
  }
  if (isFemale) {
    return '好的，我知道了！你是女生 👧\n\n接下来我会从女生视角给你建议。\n\n你现在面临的是哪方面的感情问题？\n\n• 💕 暗恋一个人不知道他是否喜欢我\n• 😔 被男生忽冷忽热搞得很困惑\n• 💬 不知道该怎么和他相处\n• 💔 感情出现了问题\n\n直接告诉我具体情况吧！'
  }

  // ===== 检测问候/打招呼 =====
  var isGreeting = ['你好', 'hi', 'hello', '嗨', '在吗', '在不', '帮我', '我想问'].some(function(k) {
    return lowerMessage.indexOf(k) !== -1
  })
  if (isGreeting && historyLen <= 2) {
    return '你好呀！我是你的 AI 恋爱顾问小爱 💕\n\n无论是搭讪技巧、暧昧推进、约会设计还是感情维系，都可以问我！\n\n先告诉我你是男生还是女生？这样我能给你更有针对性的建议～'
  }

  // ===== 本地知识库 - 恋爱顾问（30+条覆盖主要场景）=====
  var localKB = [
    // ——— 搭讪 / 开口 / 第一句话 ———
    {
      keywords: ['搭讪', '怎么认识', '开口说话', '如何开口', '陌生人怎么', '不认识', '第一句话', '怎么追', '如何追', '怎么接近', '初次见面怎么聊', '不敢开口'],
      response: '搭讪的核心是"自然"，不是完美台词。\n\n✅ 万能公式：观察 + 感受 + 问题\n例："你这本书封面很特别（观察），看起来很有意思（感受），是什么类型的？"\n\n⚡ 3秒法则：心动后3秒内开口，越想越不敢。\n\n常用场景开场白：\n• 图书馆/咖啡馆："这里位置挺难找的，你经常来吗？"\n• 公司/学校："你是XX部门的吗？我是新来的，能请教一下…"\n• 运动场所："你这个动作做得很标准，可以教我吗？"\n\n记住：对方怎么回都不重要，开口那一刻你就已经赢了。'
    },
    // ——— 表白 / 告白 ———
    {
      keywords: ['表白', '告白', '说喜欢', '怎么表达喜欢', '要不要表白', '表白时机', '表白被拒'],
      response: '表白的关键不是台词完美，而是时机和真诚。\n\n📌 先判断时机：收到3个以上信号再表白\n• TA主动找你聊（不只是被动回复）\n• TA记得你说过的细节\n• TA不排斥和你单独见面\n\n✅ 好的表白公式：\n具体原因 + 表达意图 + 给对方选择权\n例："和你在一起很开心，你让我觉得很安心，所以我喜欢上你了，你愿意和我在一起吗？"\n\n❌ 避免：\n• 借酒表白（对方不确定你是否认真）\n• 发文字表白（仪式感不够）\n• 在公共场合强行表白（对方压力太大）\n\n被拒绝后：微笑说"没关系，感谢你告诉我"，优雅退出，给对方留下好印象。'
    },
    // ——— 暧昧期 / 关系推进 ———
    {
      keywords: ['暧昧', '暧昧期', '不确定', '到底喜不喜欢我', '什么信号', '进展太慢', '好朋友变恋人', '普通朋友怎么追'],
      response: '暧昧期最大的敌人：无限期线上聊天，迟迟不约线下。\n\n🎯 暧昧期核心任务：把线上化学反应变成线下真实接触。\n\n✅ 你应该做的：\n• 约见面！微信聊再多不如一次真实约会\n• 制造专属感：专属称呼、你们才知道的梗\n• 给TA留"想你"的空间：不要每天轰炸，偶尔消失更有魅力\n\n📊 判断TA是否有意思：\n✓ TA主动找你聊 ✓ 秒回消息 ✓ 记住你的细节\n✓ 不拒绝单独见面 ✓ 聊天到很晚舍不得结束\n\n暧昧超过3个月还不见面 = 对方只是把你当聊天工具，尽快推进或断开。'
    },
    // ——— 分手 / 挽回 / 失恋 ———
    {
      keywords: ['分手', '挽回', '失恋', '复合', '前任', '分开了', '被甩', '挽留', '求复合', '还有机会吗'],
      response: '挽回的核心逻辑：让对方"重新看见你的好"，不是"不停求回来"。\n\n📌 分手后30天冷静期（不联系）：\n• 专注提升自己：身材、穿搭、技能\n• 充实社交圈：让朋友圈偶尔出现你过得很好的状态\n• 处理分手真正原因（不是表面原因）\n\n冷静期后重新联系：\n• 用自然话题切入，不要直接"我想你了"\n• 像朋友一样，慢慢重建好感\n• 制造新的回忆，不要翻旧账\n\n🚫 放弃挽回的信号：\n对方已有稳定新恋人 / 明确说不想联系 / 分手原因是根本性格不合\n\n你们分手多久了？是什么原因分手的？'
    },
    // ——— 约会策划 ———
    {
      keywords: ['约会', '第一次见面', '约出来', '去哪玩', '约会地点', '约会话题', '约会穿什么', '约会紧张', '第一次约会'],
      response: '第一次约会原则：安全 + 轻松 + 意犹未尽\n\n✅ 推荐地点：\n• 咖啡馆/奶茶店（轻松聊天，压力小）\n• 逛书店/美术馆（有话题，有品位）\n• 公园漫步（走动起来，气氛更自然）\n\n❌ 第一次不建议：\n• 电影院（全程不能说话）\n• 高档餐厅（太正式，对方压力大）\n• 只在家（对方会不安全）\n\n⏰ 时间控制：2-3小时，在气氛最好时结束，让对方回味\n\n约会聊什么：对方感兴趣的事、好玩的旅行经历、有趣的八卦，不聊前任、不聊工资、不聊结婚。\n\n约会结束后：当天晚上发一条简短的消息，"今天很开心，改天继续"。'
    },
    // ——— 被冷淡 / 不回消息 ———
    {
      keywords: ['冷淡', '不理我', '不回消息', '突然冷了', '回复很慢', '已读不回', '消失了', '没动静', '不主动'],
      response: '对方突然冷淡，3种可能性分析：\n\n1️⃣ 真的很忙\n• 特征：回复慢但内容不敷衍，会主动解释\n• 应对：保持原有频率，不要频繁催促\n\n2️⃣ 热情消退\n• 特征：回复越来越短，很少主动找你\n• 应对：不要追问"你还喜欢我吗"，退一步给对方空间\n\n3️⃣ 在权衡其他选项\n• 特征：时不时出现一下，但没有推进\n• 应对：做好自己，提升吸引力，不要因为焦虑而变得卑微\n\n✨ 通用策略：\n不要在TA冷淡时轰炸消息，维持自己的生活节奏，充实起来。有魅力的人不是"等待被选择"，而是"吸引人来靠近"。'
    },
    // ——— 吵架 / 冷战 / 和好 ———
    {
      keywords: ['吵架', '冷战', '生气了', '矛盾', '闹别扭', '怎么道歉', '和好', '不理我了', '说错话了'],
      response: '吵架后和好的正确步骤：\n\n第1步：冷静期（至少2小时）\n不要在情绪激动时说任何话，只会越说越糟。\n\n第2步：主动打破僵局\n✅ 正确："我们冷静了，我想聊聊刚才的事"\n❌ 错误："我错了，对不起"（显得敷衍，像是为了结束争吵）\n\n第3步：先认可对方的情绪\n"我知道你当时很生气/委屈，我理解"\n\n第4步：说清楚自己的感受，不指责对方\n✅ "我当时说那句话是因为…，不是故意的"\n❌ "都是因为你…"\n\n第5步：提出具体改善方案\n不是"我以后改"，而是"以后遇到这种情况，我们可以……"\n\n💡 最重要：不要在和好时翻旧账，吵架是为了解决问题，不是为了赢。'
    },
    // ——— 礼物 / 惊喜 / 纪念日 ———
    {
      keywords: ['礼物', '送什么', '惊喜', '生日礼物', '纪念日', '七夕', '情人节', '圣诞节', '礼物送什么好'],
      response: '礼物的核心不是价格，是用心。\n\n🎁 男生送女生：\n• 不建议：口红（色号难选）、随机香水、化妆品（除非你很懂）\n• 推荐：鲜花+手写信、带她去一直想去的餐厅、专属定制的小东西\n• 最不会出错：问她"我们去吃XX好不好"，直接满足愿望\n\n🎁 女生送男生：\n• 推荐：他玩的游戏周边、感兴趣的电子配件、专属账号/合照相册\n• 不建议：太甜腻的香薰蜡烛、装饰品（男生不常用）\n\n✨ 惊喜公式：\n观察TA最近提到的事 → 记下来 → 意外出现\n例：TA上周说"好想吃XX街那家面包"，这周直接帮他/她买回来。\n\n最浪漫的礼物是"你注意到了我不经意说的话"。'
    },
    // ——— 异地恋 ———
    {
      keywords: ['异地', '异地恋', '两地', '距离', '见面难', '思念'],
      response: '异地恋最大的敌人不是距离，是"感觉越来越陌生"。\n\n✅ 异地保鲜的关键：\n• 固定的视频/通话时间，哪怕只有10分钟\n• 分享日常的微小细节，不是只有"今天怎么样"\n• 给对方"参与感"：你在吃的东西发给TA，让TA仿佛在场\n• 定期规划见面，让对方有期待\n\n❌ 异地恋杀手：\n• 只有报备行程（像汇报工作，不是恋爱）\n• 长期不见面（3个月不见，感情会淡化）\n• 双方生活圈完全没有交集\n\n📌 一个技巧：\n每天发一条"你今天让我想到你"的消息，和TA分享一个细节，比长篇大论更温暖。'
    },
    // ——— 聊天没话说 / 聊不下去 ———
    {
      keywords: ['没话聊', '聊天冷场', '不知道说什么', '话题', '怎么聊天', '聊天技巧', '聊不下去', '对话尬'],
      response: '聊天没话说？这几个话题永远不会冷场：\n\n🔥 万能话题：\n• "你最近在看什么剧/综艺？" → 进入对方的兴趣世界\n• "你有没有很想去的地方？" → 聊旅行和梦想\n• "你朋友圈最近发的那个… 是怎么回事？" → 基于真实细节\n\n✅ 聊天进阶技巧：\n1. 问+答+反问：你的每个回答后面跟一个问题给对方\n2. 聊感受不聊事实："那你怎么看这件事？"比"那后来呢？"更走心\n3. 偶尔分享脆弱：适当说一点自己的困扰，让对方觉得被信任\n\n❌ 冷场的根本原因：只在问问题，没有分享自己。\n\n💡 快速救场万能句：\n"我今天遇到一件超有意思的事，你要听吗？" — 然后说一件有趣的事，哪怕只是今天吃到好吃的东西。'
    },
    // ——— 失去热情 / 平淡期 ———
    {
      keywords: ['感情平淡', '没有激情', '越来越无聊', '不像以前', '新鲜感', '腻了', '感情危机', '在一起久了'],
      response: '感情平淡期，是每段关系都会经历的正常阶段，不代表不爱了。\n\n✅ 找回新鲜感的方法：\n• 一起做一件"第一次"的事（第一次露营、第一次学一项技能）\n• 改变平时的相处模式（平时总在家，这次出去旅行）\n• 给对方留一些神秘感：不要24小时汇报行程\n• 重新"约会"：像谈恋爱初期一样认真打扮，去一个新地方\n\n💡 关键认知：\n热恋期的心跳和稳定期的安全感，是两种不同的幸福。\n热恋期短暂，稳定期才是真正的爱情。\n\n如果真的想找回激情，最有效的方法是：在TA面前"消失"几天，做有趣的事，让TA想念你。'
    },
    // ——— 前任 / 旧情 ———
    {
      keywords: ['前任', '前男友', '前女友', '还忘不了', '还喜欢前任', '前任找我', '前任复合'],
      response: '还忘不了前任？先分清是"真的爱"还是"习惯了"。\n\n🔍 自测：\n你想念的是TA这个人，还是"谈恋爱的感觉"？\n\n如果是习惯：\n这段时间的空虚感会在3-6个月内消退，不要冲动复合。\n\n如果是真的想要TA：\n• 认真想清楚分手原因，这个原因改变了吗？\n• 如果原因没变，复合 = 再吃一次同样的亏\n\n前任主动找你：\n• 只是倾诉/无聊 → 礼貌但保持距离\n• 有复合意向 → 先观察对方有没有真正改变\n\n✨ 一个事实：\n最好的挽回，是让自己过得更好，让对方后悔。而不是反复求复合，让对方觉得你随时都在。'
    },
    // ——— 暗恋 ———
    {
      keywords: ['暗恋', '单相思', '喜欢一个人', '不敢说喜欢', '一直暗恋', '单方面'],
      response: '暗恋最大的风险：时间越长，开口越难，幻想越深。\n\n📌 暗恋行动清单：\n1. 多创造接触机会（让对方知道你存在）\n2. 展示自己的亮点（不要只是默默在旁边）\n3. 偶尔一对一接触（找理由单独相处）\n4. 给信号看对方反应（先不表白，先试探）\n\n🎯 试探信号的方法：\n• 约TA做一件事，看TA是否愿意\n• 聊天时夸TA，看TA的反应（害羞 vs 随便一答）\n• 说一句含糊的话，看TA怎么接\n\n暗恋的期限建议：不超过3个月。\n3个月内，要么创造机会推进，要么接受现实继续生活。\n长期暗恋会让你越来越不自信，得不偿失。'
    },
    // ——— 被追 / 不喜欢对方 ———
    {
      keywords: ['被追', '不喜欢对方', '怎么拒绝', '不想伤害', '拒绝别人', '暧昧但不喜欢'],
      response: '不喜欢对方，怎么拒绝才不伤害对方？\n\n✅ 好的拒绝：\n清晰、真诚、不给错误的希望\n"我很感激你的心意，但我对你的感情只是朋友，不想耽误你"\n\n❌ 不好的拒绝：\n• "我们还不够了解" → 给对方继续的借口\n• "我现在不想谈恋爱" → 对方会等\n• 直接消失不回应 → 对方会痛苦更久\n\n拒绝后的处理：\n• 保持礼貌但降低联系频率\n• 不要因为愧疚而补偿性地对对方特别好（这是误导）\n• 如果对方纠缠，坚持立场不松口\n\n💡 拒绝是保护自己，也是对对方负责——让对方早点解脱，去寻找真正喜欢他/她的人。'
    },
    // ——— 嫉妒 / 不安全感 ———
    {
      keywords: ['嫉妒', '不安全感', '不放心', '想查手机', '怕被劈腿', '总是怀疑', '控制欲'],
      response: '感情里的不安全感，往往来自两个地方：\n\n1️⃣ 过去的伤（被劈腿/被欺骗过）\n2️⃣ 对方给的不够（没有仪式感、不稳定的陪伴）\n\n✅ 怎么处理不安全感：\n• 先问自己：是对方真的有问题，还是我的恐惧在作怪？\n• 有担忧，直接开口说：不要压抑情绪，不要靠猜\n• 建立边界：哪些是可以接受的，哪些是不能接受的，说清楚\n\n❌ 不要做的：\n• 翻手机（发现了你也不知道该怎么办，没发现你也不会真的放心）\n• 无限制追问（会把对方逼走）\n• 用冷淡来试探对方（玩心理游戏只会两个人都受伤）\n\n💡 真正的安全感来自自身：你越有自己的生活、朋友、事业，越不会把一段感情当成全部。'
    },
    // ——— 长距离心动 / 网恋 ———
    {
      keywords: ['网恋', '线上认识', '没见过面', '网上认识的', '游戏认识', '微博认识'],
      response: '网恋能成，但需要更快地推进到线下。\n\n📌 网恋3个阶段：\n1. 线上建立好感（已完成）\n2. 视频通话确认真实性\n3. 线下见面，感情才真正开始\n\n⚡ 关键节点：\n聊了1个月以上，如果还没视频过，问题来了。\n聊了3个月，如果还没见面计划，这段关系很可能到此为止。\n\n✅ 推进见面的话术：\n"我觉得我们应该找个机会见一面，你觉得呢？"\n不要等到"时机完美"，直接约。\n\n🚨 网恋注意：\n• 见面前视频确认是真实的人\n• 第一次见面选公共场所\n• 不要在见面前转钱（无论理由多正当）'
    },
    // ——— 追求技巧 / 如何吸引对方 ———
    {
      keywords: ['如何吸引', '怎么让他喜欢我', '怎么让她喜欢我', '增加吸引力', '提升魅力', '怎么追到', '如何让对方心动'],
      response: '吸引力的本质：让对方觉得"和你在一起很好"。\n\n🔑 吸引力的3个层面：\n\n1. 外在吸引力\n• 打理好自己（发型、穿搭、气色）\n• 不需要多帅/多美，整洁有品位就够\n\n2. 内在吸引力\n• 有自己的热情所在（让对方看见你"在发光"的时刻）\n• 有主见，不是什么都"你决定"\n• 有趣的灵魂，比漂亮的皮囊更长久\n\n3. 相处体验\n• 在TA身边放松、快乐 > 在TA身边有压力\n• 记住TA说的小事，在意想不到的时候提起\n• 偶尔制造一点"消失"，有距离才有思念\n\n💡 最快的方法：让自己先过得有意思，自然就会吸引人靠近。'
    },
    // ——— 求婚 / 确定关系 ———
    {
      keywords: ['求婚', '确定关系', '正式交往', '怎么表白成功', '求婚准备', '怎么说在一起'],
      response: '确定关系 / 求婚前，先确认3件事：\n\n✅ 确定关系前：\n1. TA是否有意思？（已经有了足够的信号）\n2. 你们单独见过面吗？（至少见过2次）\n3. 你准备好承担被拒绝的可能吗？\n\n开口的最佳时机：\n约会结束，气氛最好，快要分别的时候。\n"我很享受今天和你在一起，我想更认真地了解你，我们能在一起吗？"\n\n🎯 求婚篇：\n• 求婚不一定贵，但一定要有仪式感\n• 选一个有意义的地方（你们第一次约会的地方）\n• 说几句真诚的话，说清楚为什么是TA\n• 准备一个戒指（价格不重要，诚意更重要）\n\n不要网上抄的套话，TA最想听到的是你说的"你是我选择的原因"。'
    },
    // ——— 婚后关系 / 维系感情 ———
    {
      keywords: ['婚后', '结婚了', '夫妻', '老婆', '老公', '婚姻', '家庭矛盾', '不像以前爱我'],
      response: '婚后感情变淡是常见的，但不是没有办法。\n\n💑 婚后保鲜的关键：\n• 继续约会：把固定的时间留给你们两个人\n• 保持神秘感：不要把所有事情都"通透"，留一些自己的空间\n• 说"谢谢"：不要把对方的付出视为理所当然\n• 解决冲突而非回避：积累的小矛盾是感情杀手\n\n✅ 具体行动：\n1. 每周一次"无手机晚餐"，只聊天\n2. 每月一次"认真的约会"，不在家\n3. 每年一次旅行，哪怕只是近郊\n\n🚨 婚姻最大的威胁不是第三者，而是"太熟悉了所以不在乎了"。\n\n记住你们为什么走到一起，然后用行动证明这段关系值得你们经营。'
    },
    // ——— 工具性场景：渣男渣女识别 ———
    {
      keywords: ['渣男', '渣女', '被骗', '感觉被耍了', '他是不是渣', '她是不是渣', '判断渣'],
      response: '判断对方是否真心的核心标准：\n\n🚩 渣的信号（出现2个以上要警觉）：\n• 只在需要你的时候联系你\n• 对你的事情不上心，但需要你的时候记得很清楚\n• 承诺过的事情反复食言\n• 联系时间规律性很强（只有某些时间段），其他时间消失\n• 你问ta做什么，总是含糊其辞\n• 从不主动介绍你给身边的人认识\n\n✅ 真心的表现：\n• 在你不开心的时候主动联系\n• 记得你说的小事\n• 愿意调整自己的计划来配合你\n• 把你介绍给朋友/家人\n\n💡 最终判断：\n看对方的行动，不是话。\n"我很忙"是借口，"我在努力"才有意义。\n喜欢你的人会挤出时间，不喜欢你的人会挤出借口。'
    },
    // ——— 分手后状态 / 疗愈 ———
    {
      keywords: ['走出失恋', '怎么走出', '忘不了', '很痛', '心里难受', '感情创伤', '疗愈', '怎么放下'],
      response: '失恋很痛，但这段痛苦是有期限的。\n\n💡 失恋疗愈三阶段：\n\n第一阶段（0-2周）：允许自己难过\n• 不要强迫自己"赶快好起来"\n• 哭出来，写下来，跟朋友说出来\n• 不要独处太久，但也不需要假装开心\n\n第二阶段（2-6周）：断联与重建\n• 不联系对方（包括不看对方朋友圈）\n• 开始做一件新事（新运动、新技能、新圈子）\n• 专注在自己身上：你可以因为这段感情变得更好\n\n第三阶段（6周+）：复盘与成长\n• 这段关系让你学到了什么？\n• 你的什么部分可以改变？哪些坚持是对的？\n• 你想要一段什么样的感情？\n\n✨ 一个真相：最好的报复是过好自己的人生。'
    },
    // ——— 绿帽 / 出轨 ———
    {
      keywords: ['出轨', '劈腿', '背叛', '小三', '怀疑对方', '发现TA出轨', '被出轨'],
      response: '发现/怀疑对方出轨，先冷静收集证据，再决定行动。\n\n📌 怀疑期：\n不要靠情绪质问，情绪化会让对方撒谎变得更方便。\n先观察：\n• 手机是否突然加密/保护\n• 出门频率/理由是否异常\n• 对你的态度是否明显变化（更冷淡或更愧疚的讨好）\n\n确认之后：\n• 面对面谈，有证据直接摆出来\n• 决定你的底线：你能接受吗？还是这是你的终点？\n\n✅ 如果选择原谅：\n• 对方必须做到的3件事：断联、透明、改变行为\n• 你自己必须做到：真正放下，不反复提\n• 建议两人都去做一次感情咨询\n\n🚫 如果选择离开：\n这不是你的失败，这是对方的失败。你保护了你自己的尊严。'
    },
    // ——— 长辈反对 / 家庭压力 ———
    {
      keywords: ['家人反对', '父母不同意', '门不当户不对', '家庭压力', '相亲', '父母催婚'],
      response: '父母反对，核心冲突往往是：对方的条件 vs 你的感受。\n\n📌 先理解父母反对的原因：\n• 实际问题（经济条件、距离、学历）→ 可以沟通\n• 情感保护（怕你受伤、不确定对方是否可靠）→ 需要时间\n• 偏见/面子（地区歧视、职业偏见）→ 最难改变\n\n✅ 面对父母的策略：\n1. 不要硬碰硬，站在他们立场理解他们的担心\n2. 用行动证明：让他们见到对方，慢慢建立信任\n3. 找他们真正担心的点，一个个解决\n4. 给父母一点时间，不要逼他们立刻接受\n\n❗ 如果真的有根本性价值观冲突：\n这是你的人生，你要为自己做的选择负责，不是父母。\n但如果选择了，就要做好应对所有后果的准备。'
    },
    // ——— 被PUA ———
    {
      keywords: ['pua', '被pua', '打击', '贬低', '贬值', '自我怀疑', '不断否定我'],
      response: '你可能正在被PUA，重要的是先看清楚发生了什么。\n\n🚩 PUA的常见套路：\n• 间歇性给予/剥夺：时好时坏，让你永远在猜\n• 持续贬低：让你觉得"如果不是他/她，没人要我"\n• 道德绑架："我都这么爱你，你怎么能…"\n• 控制社交：让你和朋友/家人疏远\n• 煤气灯效应：让你怀疑自己的判断和感受\n\n✅ 如何应对：\n1. 相信自己的感受，不要被"你太敏感了"说服\n2. 和信任的朋友谈谈，听听旁观者的看法\n3. 建立清晰的边界，告诉对方什么是不可接受的\n4. 如果对方持续越界，这段关系值得你重新考虑\n\n💡 真正爱你的人，会让你越来越有安全感，而不是越来越不自信。'
    },
    // ——— 如何挽救即将结束的关系 ———
    {
      keywords: ['关系快结束了', '感觉要分手了', '不想分手', '如何挽救', '感情危机怎么办', '对方要分手'],
      response: '对方提出分手 / 感情到了临界点，这时候要沉住气。\n\n📌 紧急处理：\n不要立刻崩溃或反应过激（哭闹、威胁、苦苦哀求都会加速结束）。\n\n第一步：搞清楚原因\n"我听到你说想分开，我需要知道发生了什么"\n\n第二步：给对方空间\n如果对方需要时间思考，给。不要每隔几小时就发消息。\n\n第三步：真正改变\n不是"我以后会改的"，而是立刻开始行动，让对方看到变化。\n\n第四步：陈述你的立场\n"我不想放弃我们，我愿意做XX。你愿意给我们一个机会吗？"\n\n✅ 关键认知：\n有些感情可以修复，有些不能。\n如果你已经尽力，对方仍然决定离开，请接受这个结果——\n比起苦苦挽留，带着尊严离开更值得被珍惜。'
    },
    // ——— 相处模式 / 爱的方式 ———
    {
      keywords: ['相处方式', '爱的语言', '需求不一样', '你不理解我', '感觉不被爱', '表达爱'],
      response: '感情里的很多误解，来自"爱的方式不同"。\n\n💡 五种爱的语言：\n1. 肯定话语：说出"我爱你""你今天真好看"\n2. 服务行为：帮对方做事情，替他/她分担\n3. 礼物：精心挑选的小礼物、意外的惊喜\n4. 高质量陪伴：放下手机，全心陪在对方身边\n5. 身体接触：牵手、拥抱、轻触\n\n每个人需要的爱的语言不同。\n\n✅ 怎么用？\n1. 先问自己最需要哪种\n2. 观察对方给予你的是哪种（TA给你的，往往是TA最需要的）\n3. 直接说出你需要什么："我希望你多…"\n\n很多"不被爱"的感觉，不是因为对方不爱，而是因为你们用了不同的频道表达爱。'
    },
    // ——— 自我成长 / 更有吸引力 ———
    {
      keywords: ['提升自己', '让自己更好', '更有魅力', '不自信', '内向怎么办', '社交恐惧', '如何更吸引人'],
      response: '最好的追求状态：你在变好，同时在追求TA。\n\n✅ 快速提升吸引力的4个方向：\n\n1. 外在呈现\n整洁的发型 + 合适的穿搭 + 微笑 = 加分50%\n（不需要很帅/美，需要"有品位地呈现自己"）\n\n2. 有自己的事\n有热爱的事情，让TA看到你投入的样子（运动、音乐、技能）\n忙碌起来的你比"随时等TA"的你更有吸引力\n\n3. 社交能力\n多和朋友出去，让对方看到你有自己的圈子\n你不需要TA，TA才会觉得你值得拥有\n\n4. 情绪稳定\n不焦虑、不患得患失、不轻易崩溃\n这是最难建立、但最有魅力的特质\n\n💡 一句话：成为你想要对方看见的那个版本，吸引力就会自然来。'
    },
  ]

  // 加权关键词匹配（更长的关键词权重更高）
  var bestMatch = null
  var bestScore = 0
  for (var i = 0; i < localKB.length; i++) {
    var item = localKB[i]
    var score = 0
    for (var j = 0; j < item.keywords.length; j++) {
      var kw = item.keywords[j]
      if (lowerMessage.indexOf(kw) !== -1) {
        score += kw.length  // 更长的关键词权重更高
      }
    }
    if (score > bestScore) {
      bestScore = score
      bestMatch = item
    }
  }
  if (bestScore > 0) {
    return bestMatch.response
  }

  // 多样化的默认回复（根据历史长度轮换）
  var defaultReplies = [
    '能具体说说你的情况吗？\n\n比如：\n• 你们现在是什么关系？（陌生人/朋友/暧昧中/在一起）\n• 认识多久了？\n• 具体发生了什么事？\n\n说得越具体，我给的建议就越有用！',
    '我需要了解一下背景～\n\n• **TA 是什么样的人？**（性格、平时话多不多）\n• **你们平时怎么联系？**（微信/见面/一起上学/上班）\n• **你最想解决的是什么？**\n\n给我更多信息，我帮你想办法！',
    '有点抽象，你展开说说？😄\n\n可以试着告诉我：\n当时发生了什么具体的事情？TA 说了什么/做了什么？你当时是怎么回应的？\n\n越具体越好，这样我才能真正帮到你。',
    '恋爱里的问题往往藏在细节里。\n\n你能描述一个具体的场景吗？\n比如："TA 上次发了一条消息说……然后我……"\n\n从这里入手，我能帮你分析 TA 的心理和最佳应对策略。',
    '每段感情都有自己的节奏，我想帮你找到最适合你的方式。\n\n先告诉我：\n你现在最困扰你的一件事是什么？就一件，说清楚一点。\n\n我们从这里开始聊。',
  ]
  return defaultReplies[historyLen % defaultReplies.length]
}

/**
 * 云函数调用模式（需要开通云开发）
 */
function callCloudFunction({ messages, systemPrompt, maxTokens, onSuccess, onError, _retry }) {
  var retryCount = _retry || 0
  var MAX_RETRY = 1

  // 拼装 system prompt
  var sys = typeof systemPrompt === 'string' && SYSTEM_PROMPTS[systemPrompt]
    ? SYSTEM_PROMPTS[systemPrompt]
    : (typeof systemPrompt === 'string' ? systemPrompt : SYSTEM_PROMPTS.coach)

  var fullMessages = [{ role: 'system', content: sys }].concat(messages)

  wx.cloud.callFunction({
    name: CLOUD_FUNCTION_NAME,
    data: {
      messages: fullMessages,
      max_tokens: maxTokens || API_CONFIG.maxTokens,
      temperature: API_CONFIG.temperature,
    },
    success: function(res) {
      var result = res && res.result
      if (result && result.code === 0 && result.content) {
        onSuccess && onSuccess(result.content)
      } else if (result && result.code === 429) {
        if (retryCount < MAX_RETRY) {
          setTimeout(function() {
            callCloudFunction({ messages: messages, systemPrompt: systemPrompt, maxTokens: maxTokens, onSuccess: onSuccess, onError: onError, _retry: retryCount + 1 })
          }, 2000)
        } else {
          onError && onError('AI 请求频繁，请稍等片刻再试')
        }
      } else if (result && result.code === 408) {
        if (retryCount < MAX_RETRY) {
          console.warn('[AI] 云函数超时，重试...')
          setTimeout(function() {
            callCloudFunction({ messages: messages, systemPrompt: systemPrompt, maxTokens: maxTokens, onSuccess: onSuccess, onError: onError, _retry: retryCount + 1 })
          }, 1500)
        } else {
          onError && onError('网络超时，请检查网络后重试')
        }
      } else {
        var errMsg = (result && result.error) || '云函数返回异常'
        console.error('[AI] 云函数返回错误:', errMsg, result)
        onError && onError(errMsg)
      }
    },
    fail: function(err) {
      var errStr = (err && err.errMsg) ? err.errMsg : JSON.stringify(err)
      console.error('[AI] 云函数调用失败:', errStr)

      // 未初始化云开发
      if (errStr.indexOf('not inited') !== -1 || errStr.indexOf('cloud is not ready') !== -1) {
        onError && onError('云开发未初始化，请确认 app.js 中已调用 wx.cloud.init()')
        return
      }
      // 函数不存在
      if (errStr.indexOf('not found') !== -1 || errStr.indexOf('FunctionName') !== -1) {
        onError && onError('云函数 ai-proxy 未部署，请在开发者工具右键上传并部署')
        return
      }

      if (retryCount < MAX_RETRY) {
        setTimeout(function() {
          callCloudFunction({ messages: messages, systemPrompt: systemPrompt, maxTokens: maxTokens, onSuccess: onSuccess, onError: onError, _retry: retryCount + 1 })
        }, 1500)
      } else {
        onError && onError('云函数调用失败，请检查云开发配置')
      }
    }
  })
}

/**
 * 关系节点综合评估
 * @param {Object} params
 * @param {string} params.type  - 评估类型
 * @param {number} params.score - 得分
 * @param {Array}  params.answers - 用户答题结果
 * @param {Object} params.profile - 情侣档案（可选）
 * @param {Function} onSuccess
 * @param {Function} onError
 */
function evaluateRelationshipNode({ type, score, answers, profile }, onSuccess, onError) {
  var typeMap = {
    communication: '沟通质量',
    attraction: '吸引力',
    trust: '信任度',
    intimacy: '亲密感',
    conflict: '冲突处理',
    future: '未来规划',
  }
  var typeLabel = typeMap[type] || type
  var profileCtx = profile
    ? ('我叫' + (profile.myName || '用户') + '，对方叫' + (profile.taName || 'TA') + '，目前' + (profile.stage || '未知') + '阶段。')
    : ''

  var answersText = answers && answers.length
    ? answers.map(function(a, i) { return (i + 1) + '. ' + (a.question || '') + ' → ' + (a.answer || '') }).join('\n')
    : '（无答题记录）'

  var prompt = '我刚完成了关系「' + typeLabel + '」评估，得分：' + score + '/100。\n'
    + (profileCtx ? profileCtx + '\n' : '')
    + '答题情况：\n' + answersText + '\n\n'
    + '请给出个性化分析，格式如下：\n'
    + '【评估总结】（2句话点评得分代表的关系状态）\n'
    + '【改善步骤】\n'
    + '1. （具体可操作的第1步）\n'
    + '2. （具体可操作的第2步）\n'
    + '3. （具体可操作的第3步）\n'
    + '要简洁、实用，不要废话。'

  ask(prompt, 'coach', onSuccess, onError, 500)
}

/**
 * 解析 evaluateRelationshipNode 返回的文本
 * @param {string} rawText
 * @returns {{ summary: string, steps: string[] }}
 */
function parseRelationshipEvaluation(rawText) {
  if (!rawText) return { summary: '', steps: [] }

  var summaryMatch = rawText.match(/【评估总结】\s*([\s\S]+?)(?=【改善步骤】|$)/)
  var stepsMatch = rawText.match(/【改善步骤】\s*([\s\S]+?)$/)

  var summary = summaryMatch ? summaryMatch[1].trim() : rawText.substring(0, 80)
  var steps = []

  if (stepsMatch) {
    var lines = stepsMatch[1].split('\n').filter(function(l) { return l.trim() })
    for (var i = 0; i < lines.length; i++) {
      var cleaned = lines[i].replace(/^[0-9]+[\.\、\s]+/, '').trim()
      if (cleaned) steps.push(cleaned)
    }
  }

  if (steps.length === 0) {
    steps = ['主动沟通，表达真实感受', '用行动代替口头承诺', '关注对方的情绪变化']
  }

  return { summary: summary, steps: steps.slice(0, 3) }
}

/**
 * 统一错误处理 — 将内部错误码转换为友好提示并弹出
 * 各页面 onError 回调可直接调用此函数
 * @param {string} err - 错误信息（可能是 __domain_blocked__ 等内部码）
 * @param {string} fallbackMsg - 非域名问题时的默认提示
 */
function handleError(err, fallbackMsg) {
  if (err === '__domain_blocked__') {
    wx.showModal({
      title: '需要配置网络权限',
      content: '请在微信开发者工具中勾选「不校验合法域名」，或在小程序管理后台将 api.deepseek.com 添加到请求白名单。',
      showCancel: false,
      confirmText: '知道了',
    })
  } else {
    wx.showToast({
      title: fallbackMsg || 'AI 请求失败，请稍后重试',
      icon: 'none',
      duration: 2500,
    })
  }
}

/**
 * AI 生成约会话题
 * @param {Object} params
 * @param {string} params.category - 分类：初次见面/深入了解/搞笑/价值观/撩拨
 * @param {number} params.count - 生成数量，默认8-12
 * @param {Function} onSuccess
 * @param {Function} onError
 */
function generateTopics({ category, count = 10 }, onSuccess, onError) {
  const categoryMap = {
    '初次见面': '轻松有趣的话题，适合第一次约会或刚认识的人',
    '深入了解': '能加深了解的话题，了解对方内心世界和价值观',
    '制造笑点': '有趣、幽默、能让人开怀大笑的话题',
    '聊价值观': '关于人生、爱情、生活态度的深度话题',
    '撩拨小话题': '轻微暧昧、能让心跳加速的话题',
  }
  const categoryDesc = categoryMap[category] || '约会话题'

  const prompt = `请帮我生成${count}个约会话题。

分类：${category}
要求：${categoryDesc}

格式（严格按此格式）：
【分类名称】
话题1
话题2
...

不要解释，直接列出话题。每个话题12-20字，要有趣味性和深度。`

  ask(prompt, 'topics', onSuccess, onError, 400)
}

/**
 * 解析 AI 生成的话题
 * @param {string} rawText
 * @returns {Array<{category: string, questions: string[]}>}
 */
function parseTopics(rawText) {
  const results = []
  // 按【分类名称】分割
  const blocks = rawText.split(/【([^】]+)】/).filter(b => b.trim())

  for (let i = 0; i < blocks.length; i += 2) {
    const category = blocks[i] || '其他'
    const questionsText = blocks[i + 1] || ''
    const questions = questionsText.split('\n')
      .map(q => q.replace(/^[0-9\.\-\s]+/, '').trim())
      .filter(q => q && q.length > 3)

    if (questions.length > 0) {
      results.push({ category, questions: questions.slice(0, 5) })
    }
  }

  // 兜底：如果解析失败，返回整个文本作为一话题
  if (results.length === 0 && rawText.trim()) {
    const lines = rawText.split('\n').filter(l => l.trim() && l.length > 5)
    results.push({
      category: 'AI生成话题',
      questions: lines.slice(0, 10).map(l => l.replace(/^[0-9\.\-\s]+/, '').trim())
    })
  }

  return results
}

/**
 * AI 生成撩人金句
 * @param {Object} params
 * @param {string} params.scene - 场景：早安/晚安/表白/约会/撒娇/挽回/通用
 * @param {string} params.gender - 性别：male/female/both
 * @param {number} params.count - 生成数量，默认8
 * @param {Function} onSuccess
 * @param {Function} onError
 */
function generateSweetWords({ scene, gender = 'both', count = 8 }, onSuccess, onError) {
  const sceneMap = {
    '早安': '温馨甜蜜的早安问候，让对方一天心情好',
    '晚安': '温柔深情的晚安祝福，带一点思念',
    '表白': '真诚直接的告白，适合表白场景',
    '约会': '约会中或约会后说的话，甜蜜又自然',
    '撒娇': '轻微撒娇、可爱俏皮的语气',
    '挽回': '挽回关系时说的话，真诚且打动人心',
    '通用': '任何场景都适用的恋爱金句',
  }
  const genderStr = gender === 'male' ? '男生' : (gender === 'female' ? '女生' : '通用')
  const sceneDesc = sceneMap[scene] || '恋爱金句'

  const prompt = `请帮我生成${count}条撩人金句。

场景：${scene}
受众：${genderStr}
要求：${sceneDesc}

格式（严格按此格式）：
【场景名称】
金句1
金句2
...

每条15-30字，要自然真实，不要油腻。直接列出，不要解释。`

  ask(prompt, 'sweetwords', onSuccess, onError, 400)
}

/**
 * 解析 AI 生成的金句
 * @param {string} rawText
 * @returns {Array<{scene: string, text: string}>}
 */
function parseSweetWords(rawText) {
  const results = []
  // 尝试按场景分割
  const blocks = rawText.split(/【([^】]+)】/).filter(b => b.trim())

  for (let i = 0; i < blocks.length; i += 2) {
    const scene = blocks[i] || '通用'
    const wordsText = blocks[i + 1] || ''
    const lines = wordsText.split('\n').filter(l => l.trim() && l.length > 5)

    for (const line of lines) {
      results.push({
        scene,
        text: line.replace(/^[0-9\.\-\s]+/, '').trim()
      })
    }
  }

  // 兜底
  if (results.length === 0 && rawText.trim()) {
    const lines = rawText.split('\n').filter(l => l.trim() && l.length > 5)
    results.push(...lines.map(l => ({
      scene: '通用',
      text: l.replace(/^[0-9\.\-\s]+/, '').trim()
    })))
  }

  return results.slice(0, 10)
}

/**
 * 生成灵魂伴侣头像（使用 DeepSeek 图生图服务或其他）
 * @param {Object} params
 * @param {string} params.zodiac - 灵魂伴侣星座
 * @param {string} params.gender - 目标性别 male/female
 * @param {string} params.desc - 人物描述
 * @param {number} params.seed - 随机种子（用于生成一致性）
 * @param {Function} onSuccess - 成功回调 (imageUrl: string) => void
 * @param {Function} onError - 错误回调 (err: string) => void
 * @param {number} params.timeout - 超时时间，默认30000ms
 */
function generateSoulmateImage({ zodiac, gender, desc, seed, onSuccess, onError, timeout }) {
  // 构建图像生成的提示词
  const targetGender = gender === 'male' ? '女生' : '男生'
  const prompt = `一个${zodiac}星座的${targetGender}的肖像，${desc}。风格：浪漫艺术风格，柔和的光线，温暖的色调，梦幻般的效果，半身肖像，正面面部，精致细腻的眼睛。`

  // 检查是否在本地模式（网络被禁用）
  if (USE_LOCAL_MODE) {
    console.log('[ImageGen] 本地模式，使用占位图')
    // 本地模式返回预设的占位图URL
    const placeholderUrls = {
      male: [
        'https://picsum.photos/seed/soulmale1/400/400',
        'https://picsum.photos/seed/soulmale2/400/400',
        'https://picsum.photos/seed/soulmale3/400/400',
      ],
      female: [
        'https://picsum.photos/seed/soulfem1/400/400',
        'https://picsum.photos/seed/soulfem2/400/400',
        'https://picsum.photos/seed/soulfem3/400/400',
      ],
    }
    const urls = placeholderUrls[gender] || placeholderUrls['female']
    const index = (seed || 0) % urls.length
    setTimeout(function() {
      onSuccess && onSuccess(urls[index])
    }, 500)
    return
  }

  // 尝试使用 DeepSeek API（通过腾讯云等代理）
  // 注意：这里使用兼容方案，实际生产环境建议使用专门的图像生成服务
  const imageUrl = `https://picsum.photos/seed/${seed || Date.now()}/400/400`

  // 模拟生图成功（实际项目中替换为真实API调用）
  console.log('[ImageGen] 生成图片，prompt:', prompt.substring(0, 50) + '...')

  // 实际部署时可替换为：
  // 1. 腾讯云AI绘图：https://cloud.tencent.com/document/product/1759/105548
  // 2. 阿里通义万相：https://help.aliyun.com/document_detail/275 不.html
  // 3. 百度文心一格：https://wenxin.baidu.com/

  setTimeout(function() {
    onSuccess && onSuccess(imageUrl)
  }, 800)
}

// DeepSeek 生图 API 配置
const IMAGE_GENERATION_CONFIG = {
  // DeepSeek 生图 API 端点
  baseUrl: 'https://api.deepseek.com/v1/images/generations',
  apiKey: 'sk-dc86cbd1925a4bbcb7d267eb210d0bfc',
  model: 'deepseek-chat', // DeepSeek 使用 chat 模型生成图片描述，然后用图生图服务
}

// 导出配置供外部使用
module.exports = {
  chat,
  ask,
  generateReply,
  parseReplies,
  generateCoupleAdvice,
  parseCoupleAdvice,
  generateSurprise,
  coachChat,
  analyzeTheirMessage,
  generateCourseContent,
  generateCourseList,
  parseCourseList,
  evaluateRelationshipNode,
  parseRelationshipEvaluation,
  handleError,
  isConfigured,
  getMockReply,
  getLocalAIResponse,
  callCloudFunction,
  API_CONFIG,
  SYSTEM_PROMPTS,
  USE_LOCAL_MODE,
  USE_CLOUD_FUNCTION,
  USE_HYBRID_MODE,
  CLOUD_FUNCTION_NAME,
  // 新增：话题和金句生成
  generateTopics,
  parseTopics,
  generateSweetWords,
  parseSweetWords,
  // 新增：生图功能
  generateSoulmateImage,
  IMAGE_GENERATION_CONFIG,
}
