// pages/soulmate/soulmate.js
// 星座配对 - 分析星座特质与最佳配对

const ai = require('../../utils/ai')
const storage = require('../../utils/storage')

// ===== 支付防作弊系统 =====
const PAYMENT_SECURITY = {
  // 支付金额
  AMOUNT: 9.9,
  
  // 同一设备最小支付间隔（毫秒）- 5分钟
  MIN_PAY_INTERVAL: 5 * 60 * 1000,
  
  // 同一用户最大支付次数
  MAX_PAY_PER_USER: 3,
  
  // 截图相似度阈值（简单哈希比对）
  SIMILARITY_THRESHOLD: 0.95,
}

// 生成图片简单哈希（用于检测重复截图）
function generateImageHash(filePath) {
  return new Promise((resolve) => {
    // 获取文件信息作为基础哈希
    wx.getFileInfo({
      filePath: filePath,
      success: (res) => {
        // 组合文件大小、创建时间等信息生成哈希
        const hash = `${res.size}_${Date.now() % 1000000}`
        resolve(hash)
      },
      fail: () => {
        // 失败时使用时间戳作为临时哈希
        resolve(`temp_${Date.now()}`)
      }
    })
  })
}

// 检查截图是否已被使用过
function checkScreenshotUsed(imageHash) {
  const usedScreenshots = wx.getStorageSync('used_screenshots') || []
  return usedScreenshots.some(item => {
    // 简单匹配：如果哈希相同或时间非常接近，认为是同一张图
    return item.hash === imageHash || 
           (Math.abs(item.timestamp - Date.now()) < 10000 && imageHash.startsWith(item.hash.substring(0, 10)))
  })
}

// 记录截图使用
function recordScreenshotUsage(imageHash, userId) {
  const usedScreenshots = wx.getStorageSync('used_screenshots') || []
  usedScreenshots.push({
    hash: imageHash,
    timestamp: Date.now(),
    userId: userId,
    date: new Date().toISOString().split('T')[0]
  })
  // 只保留最近100条记录
  if (usedScreenshots.length > 100) {
    usedScreenshots.shift()
  }
  wx.setStorageSync('used_screenshots', usedScreenshots)
}

// 获取设备指纹
function getDeviceFingerprint() {
  const systemInfo = wx.getSystemInfoSync()
  const fingerprint = [
    systemInfo.model,
    systemInfo.system,
    systemInfo.platform,
    systemInfo.brand,
    systemInfo.screenWidth,
    systemInfo.screenHeight,
    systemInfo.pixelRatio
  ].join('_')
  // 简单哈希
  let hash = 0
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return `fp_${Math.abs(hash).toString(36)}`
}

// 检查支付频率限制
function checkPayFrequency(deviceId, userId) {
  const payAttempts = wx.getStorageSync('pay_attempts') || []
  const now = Date.now()
  
  // 清理过期记录（保留24小时）
  const validAttempts = payAttempts.filter(item => now - item.timestamp < 24 * 60 * 60 * 1000)
  
  // 检查同一设备的支付间隔
  const deviceAttempts = validAttempts.filter(item => item.deviceId === deviceId)
  const lastDeviceAttempt = deviceAttempts[deviceAttempts.length - 1]
  if (lastDeviceAttempt && (now - lastDeviceAttempt.timestamp < PAYMENT_SECURITY.MIN_PAY_INTERVAL)) {
    return {
      allowed: false,
      reason: '操作过于频繁，请稍后再试',
      waitSeconds: Math.ceil((PAYMENT_SECURITY.MIN_PAY_INTERVAL - (now - lastDeviceAttempt.timestamp)) / 1000)
    }
  }
  
  // 检查同一用户的支付次数
  const userAttempts = validAttempts.filter(item => item.userId === userId)
  if (userAttempts.length >= PAYMENT_SECURITY.MAX_PAY_PER_USER) {
    return {
      allowed: false,
      reason: '您的支付次数已达上限，请联系客服',
      needManualReview: true
    }
  }
  
  return { allowed: true }
}

// 记录支付尝试
function recordPayAttempt(deviceId, userId, screenshotHash) {
  const payAttempts = wx.getStorageSync('pay_attempts') || []
  payAttempts.push({
    deviceId,
    userId,
    screenshotHash,
    timestamp: Date.now(),
    date: new Date().toISOString().split('T')[0]
  })
  // 只保留最近50条
  if (payAttempts.length > 50) {
    payAttempts.shift()
  }
  wx.setStorageSync('pay_attempts', payAttempts)
}

// 计算风险评分
function calculateRiskScore(data) {
  let score = 0
  const reasons = []
  
  // 没有上传截图 +30分风险
  if (!data.hasScreenshot) {
    score += 30
    reasons.push('未上传支付截图')
  }
  
  // 短时间内多次尝试 +40分风险
  if (data.attemptCount > 2) {
    score += 40
    reasons.push('短时间内多次支付尝试')
  }
  
  // 截图已被使用过 +100分风险（直接拒绝）
  if (data.screenshotReused) {
    score += 100
    reasons.push('截图疑似重复使用')
  }
  
  // 设备指纹异常 +20分风险
  if (data.deviceSwitch) {
    score += 20
    reasons.push('设备环境变化')
  }
  
  return { score, reasons }
}

// ===== 星座计算 =====
function getZodiac(month, day) {
  const signs = [
    { name: '摩羯座', symbol: '♑', end: [1, 19] },
    { name: '水瓶座', symbol: '♒', end: [2, 18] },
    { name: '双鱼座', symbol: '♓', end: [3, 20] },
    { name: '白羊座', symbol: '♈', end: [4, 19] },
    { name: '金牛座', symbol: '♉', end: [5, 20] },
    { name: '双子座', symbol: '♊', end: [6, 20] },
    { name: '巨蟹座', symbol: '♋', end: [7, 22] },
    { name: '狮子座', symbol: '♌', end: [8, 22] },
    { name: '处女座', symbol: '♍', end: [9, 22] },
    { name: '天秤座', symbol: '♎', end: [10, 22] },
    { name: '天蝎座', symbol: '♏', end: [11, 21] },
    { name: '射手座', symbol: '♐', end: [12, 21] },
    { name: '摩羯座', symbol: '♑', end: [12, 31] },
  ]
  for (const s of signs) {
    if (month < s.end[0] || (month === s.end[0] && day <= s.end[1])) {
      return s
    }
  }
  return { name: '摩羯座', symbol: '♑' }
}

// ===== 配对星座（灵魂伴侣星座）=====
function getSoulmateZodiac(zodiacName) {
  const pairs = {
    '白羊座': '天秤座', '天秤座': '白羊座',
    '金牛座': '天蝎座', '天蝎座': '金牛座',
    '双子座': '射手座', '射手座': '双子座',
    '巨蟹座': '摩羯座', '摩羯座': '巨蟹座',
    '狮子座': '水瓶座', '水瓶座': '狮子座',
    '处女座': '双鱼座', '双鱼座': '处女座',
  }
  return pairs[zodiacName] || '天秤座'
}

// ===== 星座中文名 → 英文key 映射（对应本地图片目录）=====
const ZODIAC_TO_KEY = {
  '白羊座': 'aries',
  '金牛座': 'taurus',
  '双子座': 'gemini',
  '巨蟹座': 'cancer',
  '狮子座': 'leo',
  '处女座': 'virgo',
  '天秤座': 'libra',
  '天蝎座': 'scorpio',
  '射手座': 'sagittarius',
  '摩羯座': 'capricorn',
  '水瓶座': 'aquarius',
  '双鱼座': 'pisces',
}

// ===== 星座符号映射 =====
const ZODIAC_SYMBOL = {
  '白羊座':'♈','金牛座':'♉','双子座':'♊','巨蟹座':'♋',
  '狮子座':'♌','处女座':'♍','天秤座':'♎','天蝎座':'♏',
  '射手座':'♐','摩羯座':'♑','水瓶座':'♒','双鱼座':'♓',
}

// ===== 星座关键词（性格标签）=====
const ZODIAC_KEYWORDS = {
  '白羊座': '热情·勇敢·直接',
  '金牛座': '稳重·踏实·专一',
  '双子座': '活泼·聪明·多变',
  '巨蟹座': '温柔·感性·顾家',
  '狮子座': '自信·慷慨·耀眼',
  '处女座': '细心·完美·体贴',
  '天秤座': '优雅·平衡·温和',
  '天蝎座': '深情·神秘·专一',
  '射手座': '乐观·自由·冒险',
  '摩羯座': '沉稳·务实·可靠',
  '水瓶座': '独立·创新·个性',
  '双鱼座': '浪漫·温柔·感性',
}

// ===== 星座配对契合度数据 =====
// 四维：爱情浓度、沟通默契、性格互补、长期稳定
const COMPAT_DATA = {
  '白羊座_天秤座': { score: 88, love: 90, comm: 82, comp: 92, stable: 80, pros: ['互补型配对','激情四射'], cons: ['容易争吵','需要磨合'] },
  '金牛座_天蝎座': { score: 90, love: 95, comm: 78, comp: 88, stable: 95, pros: ['深度契合','忠诚专一'], cons: ['固执碰撞','情绪波动'] },
  '双子座_射手座': { score: 85, love: 85, comm: 92, comp: 80, stable: 78, pros: ['思想共鸣','冒险同行'], cons: ['不够稳定','需要沉淀'] },
  '巨蟹座_摩羯座': { score: 87, love: 88, comm: 80, comp: 90, stable: 90, pros: ['互补完美','共同目标'], cons: ['情感表达差异','沟通需努力'] },
  '狮子座_水瓶座': { score: 84, love: 86, comm: 88, comp: 82, stable: 80, pros: ['个性鲜明','彼此尊重'], cons: ['自我较强','需要让步'] },
  '处女座_双鱼座': { score: 86, love: 90, comm: 75, comp: 95, stable: 84, pros: ['理性感性互补','温柔相待'], cons: ['生活节奏不同','需要包容'] },
  // 反向配对（同分）
  '天秤座_白羊座': { score: 88, love: 90, comm: 82, comp: 92, stable: 80, pros: ['互补型配对','激情四射'], cons: ['容易争吵','需要磨合'] },
  '天蝎座_金牛座': { score: 90, love: 95, comm: 78, comp: 88, stable: 95, pros: ['深度契合','忠诚专一'], cons: ['固执碰撞','情绪波动'] },
  '射手座_双子座': { score: 85, love: 85, comm: 92, comp: 80, stable: 78, pros: ['思想共鸣','冒险同行'], cons: ['不够稳定','需要沉淀'] },
  '摩羯座_巨蟹座': { score: 87, love: 88, comm: 80, comp: 90, stable: 90, pros: ['互补完美','共同目标'], cons: ['情感表达差异','沟通需努力'] },
  '水瓶座_狮子座': { score: 84, love: 86, comm: 88, comp: 82, stable: 80, pros: ['个性鲜明','彼此尊重'], cons: ['自我较强','需要让步'] },
  '双鱼座_处女座': { score: 86, love: 90, comm: 75, comp: 95, stable: 84, pros: ['理性感性互补','温柔相待'], cons: ['生活节奏不同','需要包容'] },
}

// 获取契合度数据
function getCompatData(zodiac1, zodiac2) {
  const key = `${zodiac1}_${zodiac2}`
  return COMPAT_DATA[key] || { score: 82, love: 82, comm: 80, comp: 83, stable: 83, pros: ['性格互补','相互理解'], cons: ['需要磨合','多些耐心'] }
}

// 契合度转等级和星星
function getCompatLevel(score) {
  if (score >= 90) return { level: '天作之合', stars: '★★★★★' }
  if (score >= 85) return { level: '强烈契合', stars: '★★★★☆' }
  if (score >= 80) return { level: '相当匹配', stars: '★★★★☆' }
  return { level: '各有魅力', stars: '★★★☆☆' }
}

// 我的星座头像（根据用户自己的星座）
function getMyAvatar(zodiacName, userGender, seed) {
  const zodiacKey = ZODIAC_TO_KEY[zodiacName]
  if (zodiacKey) {
    return `/images/soulmate/${zodiacKey}_${userGender}.png`
  }
  return ''
}

// ===== 根据星盘生成配对描述（本地版）=====
function generateSoulmateDesc(zodiacName, birthCity, userGender) {
  const soulmateZodiac = getSoulmateZodiac(zodiacName)
  const isForMale = userGender === 'male'

  // 根据配对星座生成描述
  const descMap = {
    '白羊座': isForMale
      ? '她充满活力，敢爱敢恨。会在你最沮丧时拉着你去冒险，用热情点燃你的生命。'
      : '他勇敢直接，充满冲劲。不会拐弯抹角地表达爱，却会用行动让你感受到被保护的温度。',
    '金牛座': isForMale
      ? '她稳重踏实，喜欢用心照顾身边的人。会记住你说过的每一件小事，把爱藏在细节里。'
      : '他可靠耐心，对承诺认真。愿意为你慢下来，在你最需要安全感的时候永远在身边。',
    '双子座': isForMale
      ? '她聪明有趣，话题无限。和她聊天永远不会冷场，会让你每天都期待见到她。'
      : '他思维灵活，风趣幽默。永远能给你惊喜，让平淡的日子充满新鲜感和欢笑。',
    '巨蟹座': isForMale
      ? '她温柔细腻，把家和你放在心里最重要的位置。会在你疲惫时默默准备好一切。'
      : '他顾家体贴，情感丰富。会记住你的情绪，在你脆弱时给你最温暖的依靠。',
    '狮子座': isForMale
      ? '她充满魅力，走进哪里都会发光。爱她的人会因她的热情和大气而感到无比骄傲。'
      : '他自信慷慨，爱护自己在意的人。当他爱你，他会把最好的都给你，让你成为他的骄傲。',
    '处女座': isForMale
      ? '她认真专注，把爱落到实处。不善言辞，却会用无数个微小的行动证明你有多重要。'
      : '他细心体贴，追求完美。会注意到你不曾开口说的委屈，主动把问题解决在你之前。',
    '天秤座': isForMale
      ? '她温和优雅，懂得平衡。会让你感受到被尊重，关系里永远保持着刚刚好的距离感。'
      : '他理性温柔，善解人意。不会在吵架时伤害你，只会让你们越来越靠近彼此的内心。',
    '天蝎座': isForMale
      ? '她深邃神秘，爱得深沉。一旦认定你，就会全力守护，成为你最值得依赖的人。'
      : '他忠诚专一，洞察力强。能看穿你内心深处的孤独，用沉默而有力的爱陪你走过风浪。',
    '射手座': isForMale
      ? '她开朗自由，充满好奇心。会带你去看更大的世界，让爱情充满远方和可能性。'
      : '他乐观豁达，热爱自由。会让你明白，真正的爱情不应该是束缚，而是彼此成全。',
    '摩羯座': isForMale
      ? '她努力上进，有责任感。爱上她的人会发现，她的爱虽然表达含蓄，却格外长久踏实。'
      : '他成熟稳重，目标明确。不会轻易开口说爱，但一旦选择你，就是以一生为期限的认真。',
    '水瓶座': isForMale
      ? '她独立聪慧，思想超前。会是你灵魂上的知己，让你感受到一种罕见的被真正理解的感觉。'
      : '他独立真诚，个性鲜明。不按套路出牌，却总能让你发现爱情可以有更多有趣的可能。',
    '双鱼座': isForMale
      ? '她浪漫感性，充满幻想。会让平淡生活变得温柔诗意，用爱与你共同编织美好的故事。'
      : '他温柔体贴，富有同理心。会在你最脆弱的时候陪着你，静静听你说完所有的心事。',
  }

  return descMap[soulmateZodiac] || '他温柔安静，会在你最脆弱的时候陪着你。不善言辞，但每次行动都是爱。'
}

// ===== 根据生日+地点生成星盘摘要 =====
function generateAstroSummary(birthYear, birthMonth, birthDay, birthCity) {
  const zodiac = getZodiac(birthMonth, birthDay)
  const soulmateZodiac = getSoulmateZodiac(zodiac.name)

  // 根据出生年份确定星座上升星（简化）
  const ascendants = ['白羊', '金牛', '双子', '巨蟹', '狮子', '处女', '天秤', '天蝎', '射手', '摩羯', '水瓶', '双鱼']
  const cityHash = birthCity ? birthCity.charCodeAt(0) % 12 : birthYear % 12
  const ascendant = ascendants[(birthMonth + birthDay + cityHash) % 12] + '座'

  // 月亮星座
  const moonSign = ascendants[(birthYear + birthMonth * 2 + birthDay) % 12] + '座'

  return {
    zodiac,
    soulmateZodiac,
    ascendant,
    moonSign,
    birthCity: birthCity || '未知地',
  }
}

// ===== 预设的模糊头像配置（纯 CSS 渐变生成，无需网络）=====
// 每项包含背景色、发色、肤色，模拟不同风格的灵魂伴侣脸部
const BLUR_AVATAR_STYLES = [
  {
    bg: 'linear-gradient(160deg, #e8d5f5 0%, #c4a0e8 50%, #9b6fc7 100%)',
    hair: 'rgba(40, 20, 60, 0.85)',      // 深黑发
    skin: 'rgba(255, 220, 195, 0.95)',
  },
  {
    bg: 'linear-gradient(160deg, #ffecd2 0%, #fcb69f 50%, #e8956d 100%)',
    hair: 'rgba(80, 40, 10, 0.9)',        // 深棕发
    skin: 'rgba(255, 210, 180, 0.95)',
  },
  {
    bg: 'linear-gradient(160deg, #d4f8e8 0%, #6ee7b7 50%, #34d399 100%)',
    hair: 'rgba(20, 50, 30, 0.85)',       // 深绿黑发
    skin: 'rgba(250, 225, 200, 0.95)',
  },
  {
    bg: 'linear-gradient(160deg, #ffd6e7 0%, #ffb3c6 50%, #ff85a1 100%)',
    hair: 'rgba(120, 60, 20, 0.88)',      // 栗棕色发
    skin: 'rgba(255, 218, 198, 0.95)',
  },
  {
    bg: 'linear-gradient(160deg, #dbeafe 0%, #93c5fd 50%, #60a5fa 100%)',
    hair: 'rgba(30, 20, 60, 0.88)',       // 深蓝黑发
    skin: 'rgba(245, 222, 200, 0.95)',
  },
  {
    bg: 'linear-gradient(160deg, #fef9c3 0%, #fde047 50%, #facc15 100%)',
    hair: 'rgba(100, 55, 10, 0.9)',       // 深棕黄发
    skin: 'rgba(255, 228, 196, 0.95)',
  },
]

// ===== 头像生成（使用本地渐变生成，无需外部图片）=====
// 根据生日hash生成唯一的颜色组合
function generateAvatarColors(seed) {
  const colors = [
    { bg: 'linear-gradient(160deg, #e8d5f5 0%, #c4a0e8 50%, #9b6fc7 100%)', hair: 'rgba(40, 20, 60, 0.85)', skin: 'rgba(255, 220, 195, 0.95)' },
    { bg: 'linear-gradient(160deg, #ffecd2 0%, #fcb69f 50%, #e8956d 100%)', hair: 'rgba(80, 40, 10, 0.9)', skin: 'rgba(255, 210, 180, 0.95)' },
    { bg: 'linear-gradient(160deg, #d4f8e8 0%, #6ee7b7 50%, #34d399 100%)', hair: 'rgba(20, 50, 30, 0.85)', skin: 'rgba(250, 225, 200, 0.95)' },
    { bg: 'linear-gradient(160deg, #ffd6e7 0%, #ffb3c6 50%, #ff85a1 100%)', hair: 'rgba(120, 60, 20, 0.88)', skin: 'rgba(255, 218, 198, 0.95)' },
    { bg: 'linear-gradient(160deg, #dbeafe 0%, #93c5fd 50%, #60a5fa 100%)', hair: 'rgba(30, 20, 60, 0.88)', skin: 'rgba(245, 222, 200, 0.95)' },
    { bg: 'linear-gradient(160deg, #fef9c3 0%, #fde047 50%, #facc15 100%)', hair: 'rgba(100, 55, 10, 0.9)', skin: 'rgba(255, 228, 196, 0.95)' },
  ]
  return colors[seed % colors.length]
}

// 根据星座信息生成本地配对描述
function buildLocalDesc(astro, userGender) {
  const targetGender = userGender === 'male' ? '女生' : '男生'
  const zodiacName = astro.zodiac.name
  const soulmateZodiac = astro.soulmateZodiac
  
  // 基于星座配对的本地描述模板
  const descTemplates = {
    '白羊座': {
      '天秤座': `她温和优雅，善于平衡。会在你冲动时给你冷静的建议，用温柔化解你的急躁，是你命中注定的互补之人。`,
      '狮子座': `她热情自信，充满魅力。和你一样有活力，能跟上你的节奏，两人在一起永远充满激情与欢笑。`,
      '射手座': `她乐观开朗，热爱自由。会陪你去冒险，探索世界的每一个角落，是你最好的旅伴和灵魂伴侣。`
    },
    '金牛座': {
      '天蝎座': `她深情专一，洞察人心。能看穿你坚强外表下的柔软，用深沉的爱给你最踏实的依靠。`,
      '处女座': `她细致认真，追求完美。会和你一样用心经营生活，在细节中体现对彼此的珍惜与爱意。`,
      '摩羯座': `她稳重务实，有责任感。和你一样重视承诺，会和你一起慢慢构建属于你们的温暖小家。`
    },
    '双子座': {
      '射手座': `她自由洒脱，充满智慧。能和你聊得来，也能给你空间，是既懂你又能让你成长的伴侣。`,
      '天秤座': `她优雅迷人，善于沟通。和你有说不完的话题，能在思想上与你共鸣，是灵魂契合的伴侣。`,
      '水瓶座': `她独立创新，思维超前。会给你带来新鲜的想法，让你们的感情永远充满惊喜与可能。`
    },
    '巨蟹座': {
      '摩羯座': `他成熟稳重，有担当。虽然不善言辞，但会用行动证明对你的爱，给你最踏实的安全感。`,
      '天蝎座': `他深情专一，保护欲强。能读懂你的情绪，在你脆弱时给你最温暖的怀抱和坚定的支持。`,
      '双鱼座': `他温柔浪漫，富有同理心。和你一样重视感情，会用心经营你们之间的每一个美好瞬间。`
    },
    '狮子座': {
      '水瓶座': `她独立聪慧，与众不同。不会被你的光芒掩盖，反而能激发你更好的一面，是势均力敌的伴侣。`,
      '白羊座': `她热情直接，敢爱敢恨。和你一样充满活力，两人在一起火花四射，是彼此最好的搭档。`,
      '射手座': `她乐观开朗，热爱自由。能陪你一起冒险，也能给你足够的空间，是最懂你的灵魂伴侣。`
    },
    '处女座': {
      '双鱼座': `她温柔浪漫，富有想象力。能软化你的完美主义，教你学会放松，用感性平衡你的理性。`,
      '金牛座': `她踏实可靠，注重细节。和你一样认真生活，会在日常小事中体现对彼此的关心与爱意。`,
      '摩羯座': `她务实上进，有规划。和你志同道合，会和你一起为未来努力，是彼此最好的合作伙伴。`
    },
    '天秤座': {
      '白羊座': `他勇敢直接，充满行动力。能帮你做决定，带你走出犹豫，用行动证明他对你的爱与决心。`,
      '狮子座': `他自信大方，有领导力。会欣赏你的优雅，也会保护你的脆弱，给你最坚定的支持与依靠。`,
      '双子座': `他机智幽默，善于交流。和你有说不完的话，能在精神上与你深度共鸣，是灵魂伴侣。`
    },
    '天蝎座': {
      '金牛座': `她稳重踏实，值得信赖。能给你安全感，用细水长流的爱化解你的防备，走进你的内心深处。`,
      '巨蟹座': `她温柔体贴，情感丰富。能读懂你的情绪，给你最细腻的理解与最温暖的爱，是命中注定的缘分。`,
      '双鱼座': `她浪漫多情，富有灵性。和你一样重视灵魂契合，会在精神层面与你深度连接，是灵魂伴侣。`
    },
    '射手座': {
      '双子座': `她聪明有趣，思维活跃。能和你聊得来，也能陪你探索世界，是最懂你的旅伴和灵魂伴侣。`,
      '狮子座': `她热情自信，充满魅力。和你一样热爱生活，两人在一起永远充满欢笑与正能量。`,
      '白羊座': `她勇敢直率，充满活力。能跟上你的节奏，陪你去冒险，是你最合拍的灵魂伴侣。`
    },
    '摩羯座': {
      '巨蟹座': `她温柔顾家，情感细腻。会给你一个温暖的家，用细腻的爱融化你坚强外表下的孤独。`,
      '金牛座': `她踏实可靠，重视承诺。和你一样认真，会和你一起为未来打拼，是最可靠的伴侣。`,
      '处女座': `她细致认真，追求完美。和你志同道合，会在生活中与你互相扶持，共同进步。`
    },
    '水瓶座': {
      '狮子座': `他自信阳光，充满魅力。能欣赏你的独特，也会给你足够的自由，是最懂你的灵魂伴侣。`,
      '双子座': `他聪明幽默，思想开放。能和你进行深度的思想交流，是精神上最契合的伴侣。`,
      '天秤座': `他优雅理性，善于沟通。能平衡你的独特想法，用智慧与你共建和谐的关系。`
    },
    '双鱼座': {
      '处女座': `他细心体贴，务实可靠。能给你安全感，用行动证明对你的爱，是你最踏实的依靠。`,
      '天蝎座': `他深情专一，洞察人心。能读懂你的情绪，给你最深沉的爱与最坚定的保护。`,
      '巨蟹座': `他温柔顾家，情感丰富。和你一样重视感情，会用心经营你们之间的每一个美好瞬间。`
    }
  }
  
  // 获取对应描述，如果没有则使用默认
  const zodiacDesc = descTemplates[zodiacName] || {}
  return zodiacDesc[soulmateZodiac] || generateSoulmateDesc(zodiacName, astro.birthCity, userGender)
}

Page({
  data: {
    // 步骤：'input' | 'loading' | 'result'
    step: 'input',

    // 输入表单
    birthYear: '',
    birthMonth: '',
    birthDay: '',
    birthCity: '',
    userGender: '',

    // 星盘结果
    astroSummary: null,

    // 生成的星座配对数据
    soulmate: {
      desc: '',           // 人物描述
      avatarStyle: '',    // 头像背景渐变色
      hairColor: 'rgba(40, 20, 60, 0.85)',
      skinColor: 'rgba(255, 220, 195, 0.95)',
      blurred: false,     // 直接显示，无需付费
      imageUrl: '',       // 本地星座图片
      unlocked: true,     // 始终解锁
    },

    // 我的头像（用户自己星座）
    myAvatarUrl: '',
    myAvatarGradient: '',

    // 契合度数据
    compatScore: 0,
    compatLevel: '',
    matchStars: '',
    compatDimensions: [],
    compatPros: [],
    compatCons: [],
    myZodiacKeyword: '',
    soulmateKeyword: '',
    soulmateSymbol: '💕',

    // 生成进度文字（动画）
    loadingText: '正在分析星座数据...',
    loadingStep: 0,

    // 分享状态
    canShare: false,

    // 用户ID
    userId: '',
  },

  onLoad(options) {
    // 读取用户性别
    const userGender = wx.getStorageSync('userGender') || ''
    
    // 获取当前用户ID
    const userId = getDeviceFingerprint()
    
    // 确保userInfo中有tempUserId
    const userInfo = wx.getStorageSync('userInfo') || {}
    if (!userInfo.tempUserId) {
      userInfo.tempUserId = userId
      wx.setStorageSync('userInfo', userInfo)
    }
    
    this.setData({ 
      userGender,
      userId: userInfo.tempUserId || userId
    })

    // 检查是否有缓存的测试结果
    const soulmateData = wx.getStorageSync('soulmateData') || null
    if (soulmateData && soulmateData.astroSummary) {
      this.setData({
        step: 'result',
        astroSummary: soulmateData.astroSummary,
        soulmate: { ...soulmateData.soulmate, unlocked: true, blurred: false },
        myAvatarUrl: soulmateData.myAvatarUrl || '',
        myAvatarGradient: soulmateData.myAvatarGradient || '',
        compatScore: soulmateData.compatScore || 85,
        compatLevel: soulmateData.compatLevel || '强烈契合',
        matchStars: soulmateData.matchStars || '★★★★☆',
        compatDimensions: soulmateData.compatDimensions || [],
        compatPros: soulmateData.compatPros || [],
        compatCons: soulmateData.compatCons || [],
        myZodiacKeyword: soulmateData.myZodiacKeyword || '',
        soulmateKeyword: soulmateData.soulmateKeyword || '',
        soulmateSymbol: soulmateData.soulmateSymbol || '💕',
        birthYear: soulmateData.birthYear,
        birthMonth: soulmateData.birthMonth,
        birthDay: soulmateData.birthDay,
        birthCity: soulmateData.birthCity,
        userGender: soulmateData.userGender || userGender,
        canShare: true,
      })
      return
    }

    // 检查管理员是否已手动解锁
    this.checkAdminUnlockStatus(this.data.userId)
  },

  // 页面卸载时清理定时器
  onUnload() {
    if (this._loadingTimer) {
      clearInterval(this._loadingTimer)
    }
  },

  // 页面隐藏时清理定时器
  onHide() {
    if (this._loadingTimer) {
      clearInterval(this._loadingTimer)
    }
  },

  // 复制用户ID
  copyUserId() {
    const { userId } = this.data
    if (!userId) {
      wx.showToast({ title: '用户ID未生成', icon: 'none' })
      return
    }
    
    wx.setClipboardData({
      data: userId,
      success: () => {
        wx.showToast({ 
          title: '用户ID已复制', 
          icon: 'success',
          duration: 2000
        })
      }
    })
  },

  // 检查管理员是否已手动解锁（通过本地存储检查）
  checkAdminUnlockStatus(userId) {
    // 检查本地是否有管理员解锁记录
    // 注意：由于本地存储不互通，这个检查只在管理员和用户使用同一设备时有效
    // 对于实际场景，建议：
    // 1. 用户截图上传后，管理员在自己的手机上查看并手动解锁
    // 2. 然后告诉用户"已解锁，请重新进入小程序"
    // 3. 用户重新进入时，如果之前已经测算过，soulmateData 会恢复
    
    const soulmateUnlocks = wx.getStorageSync('soulmate_unlocks') || []
    const isUnlockedByAdmin = soulmateUnlocks.some(u => u.userId === userId)
    
    if (isUnlockedByAdmin) {
      console.log('[管理员解锁] 检测到用户已被管理员解锁:', userId)
      // 如果有测算数据，自动解锁
      const soulmateData = wx.getStorageSync('soulmateData')
      if (soulmateData) {
        soulmateData.unlocked = true
        wx.setStorageSync('soulmateData', soulmateData)
        
        this.setData({
          step: 'result',
          astroSummary: soulmateData.astroSummary,
          soulmate: { ...soulmateData.soulmate, unlocked: true },
          birthYear: soulmateData.birthYear,
          birthMonth: soulmateData.birthMonth,
          birthDay: soulmateData.birthDay,
          birthCity: soulmateData.birthCity,
          canShare: true,
        })
        
        wx.showToast({
          title: '已为您解锁！',
          icon: 'success',
          duration: 2000
        })
      }
    }
  },

  // 监听输入
  onBirthYearInput(e) { this.setData({ birthYear: e.detail.value }) },
  onBirthMonthInput(e) { this.setData({ birthMonth: e.detail.value }) },
  onBirthDayInput(e) { this.setData({ birthDay: e.detail.value }) },
  onBirthCityInput(e) { this.setData({ birthCity: e.detail.value }) },
  onGenderChange(e) { this.setData({ userGender: e.detail.value }) },

  // 快速选择性别
  selectGender(e) {
    const gender = e.currentTarget.dataset.gender
    this.setData({ userGender: gender })
  },

  // 开始生成
  async startGenerate() {
    const { birthYear, birthMonth, birthDay, birthCity, userGender } = this.data

    // 校验
    if (!birthYear || !birthMonth || !birthDay) {
      wx.showToast({ title: '请完整填写出生日期', icon: 'none' })
      return
    }
    const year = parseInt(birthYear)
    const month = parseInt(birthMonth)
    const day = parseInt(birthDay)
    if (year < 1900 || year > 2025 || month < 1 || month > 12 || day < 1 || day > 31) {
      wx.showToast({ title: '日期格式不正确', icon: 'none' })
      return
    }
    if (!userGender) {
      wx.showToast({ title: '请选择你的性别', icon: 'none' })
      return
    }

    // 开始加载动画
    this.setData({ step: 'loading', loadingStep: 0, loadingText: '正在解析星盘数据...' })

    // 模拟加载进度
    const loadingTexts = [
      '正在分析星座数据...',
      '计算上升星座与月亮星座...',
      '分析星座配对特质...',
      '在十二星座中寻找最佳配对...',
      '配对结果即将呈现...',
    ]
    // 清理可能残留的加载动画定时器
    if (this._loadingTimer) {
      clearInterval(this._loadingTimer)
    }
    let step = 0
    this._loadingTimer = setInterval(() => {
      step++
      if (step < loadingTexts.length) {
        this.setData({ loadingText: loadingTexts[step], loadingStep: step })
      }
    }, 900)

    try {
      // 计算星盘
      const astroSummary = generateAstroSummary(year, month, day, birthCity)

      // 选择头像配色（根据生日hash）
      const avatarIndex = (year + month * 31 + day) % BLUR_AVATAR_STYLES.length
      const avatarCfg = BLUR_AVATAR_STYLES[avatarIndex]

      // 生成描述（使用本地星盘知识库）
      const desc = buildLocalDesc(astroSummary, userGender)

      clearInterval(timer)

      // 头像：使用本地生成的头像
      // 预览时显示模糊版本，付费后显示清晰版本（同一张图）
      // 根据生日hash生成唯一seed
      const seed = year * 10000 + month * 100 + day
      const avatarColors = generateAvatarColors(seed)

      // 直接生成头像（免费展示，无需付费）
      const targetGender = userGender === 'male' ? 'female' : 'male'
      const avatarData = this.getLocalAvatar(targetGender, seed, astroSummary.soulmateZodiac)
      
      // 我自己的头像（用我的星座+我的性别）
      const myAvatarUrl = getMyAvatar(astroSummary.zodiac.name, userGender, seed)
      const myAvatarGradient = avatarColors.bg

      // 契合度计算
      const compatRaw = getCompatData(astroSummary.zodiac.name, astroSummary.soulmateZodiac)
      const compatInfo = getCompatLevel(compatRaw.score)

      // 四维契合度柱状图数据
      const compatDimensions = [
        { label: '爱情浓度', value: compatRaw.love, color: 'linear-gradient(90deg,#ec4899,#f472b6)' },
        { label: '沟通默契', value: compatRaw.comm, color: 'linear-gradient(90deg,#8b5cf6,#a78bfa)' },
        { label: '性格互补', value: compatRaw.comp, color: 'linear-gradient(90deg,#0ea5e9,#38bdf8)' },
        { label: '长期稳定', value: compatRaw.stable, color: 'linear-gradient(90deg,#10b981,#34d399)' },
      ]

      const soulmate = {
        desc,
        avatarStyle: avatarCfg.bg,
        hairColor: avatarColors.hair,
        skinColor: avatarColors.skin,
        bgColor: avatarColors.bg,
        blurred: false,
        imageUrl: avatarData.type === 'image' ? avatarData.path : '',
        avatarType: avatarData.type,
        unlocked: true,
      }

      this.setData({
        step: 'result',
        astroSummary,
        soulmate,
        myAvatarUrl,
        myAvatarGradient,
        compatScore: compatRaw.score,
        compatLevel: compatInfo.level,
        matchStars: compatInfo.stars,
        compatDimensions,
        compatPros: compatRaw.pros,
        compatCons: compatRaw.cons,
        myZodiacKeyword: ZODIAC_KEYWORDS[astroSummary.zodiac.name] || '',
        soulmateKeyword: ZODIAC_KEYWORDS[astroSummary.soulmateZodiac] || '',
        soulmateSymbol: ZODIAC_SYMBOL[astroSummary.soulmateZodiac] || '💕',
        birthYear: String(year),
        birthMonth: String(month),
        birthDay: String(day),
        loadingStep: 5,
        canShare: true,
      })

      // 保存缓存（下次进入直接展示）
      wx.setStorageSync('soulmateData', {
        astroSummary,
        soulmate,
        myAvatarUrl,
        myAvatarGradient,
        compatScore: compatRaw.score,
        compatLevel: compatInfo.level,
        matchStars: compatInfo.stars,
        compatDimensions,
        compatPros: compatRaw.pros,
        compatCons: compatRaw.cons,
        myZodiacKeyword: ZODIAC_KEYWORDS[astroSummary.zodiac.name] || '',
        soulmateKeyword: ZODIAC_KEYWORDS[astroSummary.soulmateZodiac] || '',
        soulmateSymbol: ZODIAC_SYMBOL[astroSummary.soulmateZodiac] || '💕',
        birthYear: String(year),
        birthMonth: String(month),
        birthDay: String(day),
        birthCity,
      })

      // 记录用户行为
      storage.logUserBehavior('soulmate_generate', {
        birthDate: `${year}-${month}-${day}`,
        birthCity,
        userGender,
        zodiac: astroSummary.zodiac.name,
        soulmateZodiac: astroSummary.soulmateZodiac,
      })

    } catch (err) {
      clearInterval(timer)
      wx.showToast({ title: '生成失败，请重试', icon: 'none' })
      this.setData({ step: 'input' })
    }
  },

  // 重新测试（回到输入页）
  regenerate() {
    // 清除缓存，允许重新测试
    wx.removeStorageSync('soulmateData')
    this.setData({
      step: 'input',
      soulmate: {
        desc: '',
        avatarStyle: '',
        hairColor: 'rgba(40, 20, 60, 0.85)',
        skinColor: 'rgba(255, 220, 195, 0.95)',
        blurred: false,
        imageUrl: '',
        unlocked: true,
      },
      astroSummary: null,
      canShare: false,
    })
  },

  // ===== 二维码支付 9.9 元解锁 =====
  // 显示收款二维码，用户长按识别支付
  payToUnlock() {
    if (this.data.paying) return
    if (this.data.soulmate.unlocked) return

    this.setData({ paying: true })
    
    // 生成订单ID
    const orderId = this.generateOrderId()
    this.setData({ currentOrderId: orderId })
    
    // 确保获取用户信息
    this.ensureUserInfo()

    // 显示支付指引
    this.showPayGuide()
  },

  // 显示支付指引
  showPayGuide() {
    wx.showModal({
      title: '💎 如何支付',
      content: '请按以下步骤操作：\n\n1. 长按页面中的收款二维码\n2. 选择"识别图中二维码"\n3. 输入金额 9.9 元完成支付\n4. 返回点击"我已支付，立即解锁"\n\n支付遇到问题？联系客服 news-tomato',
      confirmText: '我知道了',
      confirmColor: '#FF6B8A',
      showCancel: false,
      success: () => {
        // 记录支付行为
        this.logPayStart()
      }
    })
  },
  
  // 记录支付开始
  logPayStart() {
    const userInfo = wx.getStorageSync('userInfo') || {}
    const orderId = this.data.currentOrderId || this.generateOrderId()
    
    const paymentRecord = {
      orderId: orderId,
      amount: 9.9,
      time: Date.now(),
      type: 'soulmate-unlock',
      status: 'pending',
      birthDate: `${this.data.birthYear}-${this.data.birthMonth}-${this.data.birthDay}`,
      zodiac: this.data.astroSummary?.zodiac?.name,
      userInfo: {
        nickName: userInfo.nickName || userInfo.nickname || '未知用户',
        avatarUrl: userInfo.avatarUrl || userInfo.avatar || '',
        tempUserId: userInfo.tempUserId || '',
        gender: userInfo.gender || this.data.userGender || 'unknown',
      }
    }
    
    // 保存到本地存储
    const paymentRecords = wx.getStorageSync('paymentRecords') || []
    paymentRecords.push(paymentRecord)
    wx.setStorageSync('paymentRecords', paymentRecords)
    
    console.log('[支付] 开始支付记录:', paymentRecord)
  },

  // 确认已支付 → 显示上传截图界面
  confirmPaid() {
    if (this.data.soulmate.unlocked) return
    
    // 先检查用户是否被封禁
    if (this.isUserBanned()) {
      wx.showModal({
        title: '账户受限',
        content: '您的账户因违规操作已被限制使用。如有疑问，请联系客服 news-tomato',
        confirmText: '联系客服',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) this.copyWechatId()
        }
      })
      return
    }

    // 显示上传截图界面
    this.setData({ showScreenshotUpload: true })
  },

  // 关闭截图上传界面
  closeScreenshotUpload() {
    this.setData({ showScreenshotUpload: false })
  },

  // 提交截图进行自动审核
  async submitScreenshotForReview() {
    const { payScreenshot } = this.data
    
    if (!payScreenshot) {
      wx.showToast({ title: '请先上传支付截图', icon: 'none' })
      return
    }

    // 检查支付频率限制
    const deviceId = getDeviceFingerprint()
    const userInfo = wx.getStorageSync('userInfo') || {}
    const userId = userInfo.tempUserId || deviceId
    
    const freqCheck = checkPayFrequency(deviceId, userId)
    if (!freqCheck.allowed) {
      wx.showModal({
        title: '操作频繁',
        content: freqCheck.reason,
        showCancel: false
      })
      return
    }

    // 生成图片哈希用于检测重复
    wx.showLoading({ title: '正在分析截图...', mask: true })
    
    try {
      const imageHash = await generateImageHash(payScreenshot)
      
      // 检查截图是否已被使用过
      if (checkScreenshotUsed(imageHash)) {
        wx.hideLoading()
        wx.showModal({
          title: '截图异常',
          content: '该截图已被使用过，请上传新的支付截图',
          confirmText: '重新上传',
          showCancel: false
        })
        // 记录作弊行为
        this.recordCheatAttempt(userId, 'screenshot_reused')
        return
      }

      // 使用百度OCR识别截图文字
      const ocrResult = await this.recognizeScreenshot(payScreenshot)
      
      // 分析OCR结果
      const analysis = this.analyzePaymentScreenshot(ocrResult)
      
      wx.hideLoading()

      if (analysis.isValid) {
        // 验证通过，自动解锁
        recordScreenshotUsage(imageHash, userId)
        recordPayAttempt(deviceId, userId, imageHash)
        this.handlePaySuccess()
        this.setData({ showScreenshotUpload: false })
        
        // 显示详细的感谢信息
        const successMsg = analysis.message || '验证通过'
        wx.showModal({
          title: '感谢打赏！🎉',
          content: `${successMsg}\n\n您的灵魂伴侣画像已解锁，可以查看高清图片并保存分享啦！`,
          showCancel: false,
          confirmText: '查看结果'
        })
      } else {
        // 验证失败，显示原因
        let content = analysis.reason + '\n\n请确保截图包含：\n• 支付金额 ¥9.9\n• 收款方信息\n• 支付时间\n• 交易单号'
        
        // 如果有详细信息，追加显示
        if (analysis.details) {
          content += '\n\n' + analysis.details
        }
        
        // 如果需要人工审核
        if (analysis.needManualReview) {
          content += '\n\n您也可以联系客服进行人工审核'
        }
        
        wx.showModal({
          title: analysis.needManualReview ? '需要人工审核' : '验证未通过',
          content: content,
          confirmText: '重新上传',
          cancelText: '联系客服',
          success: (res) => {
            if (res.cancel) {
              this.copyWechatId()
            }
          }
        })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('[截图审核] 失败:', err)
      wx.showModal({
        title: '审核失败',
        content: '截图识别失败，请重试或联系客服人工审核',
        confirmText: '重试',
        cancelText: '联系客服',
        success: (res) => {
          if (res.cancel) this.copyWechatId()
        }
      })
    }
  },

  // 使用百度OCR识别截图（仅用于验证打赏截图，非AI合成）
  recognizeScreenshot(imagePath) {
    return new Promise((resolve, reject) => {
      // 读取图片为base64
      const fs = wx.getFileSystemManager()
      
      try {
        const base64 = fs.readFileSync(imagePath, 'base64')
        
        // 调用百度OCR API
        // 注意：这里使用百度智能云通用文字识别（高精度版）
        // 你需要在百度智能云申请 API Key 和 Secret Key
        const BAIDU_API_KEY = 'I9tvaVRghiX7sPpokq3AipPa'
        const BAIDU_SECRET_KEY = 'xjZcRuuGBgl98tNC5EZroXg01hJYydvs'
        
        // 先获取access_token
        wx.request({
          url: `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${BAIDU_API_KEY}&client_secret=${BAIDU_SECRET_KEY}`,
          method: 'POST',
          success: (tokenRes) => {
            const accessToken = tokenRes.data.access_token
            if (!accessToken) {
              reject(new Error('获取access_token失败'))
              return
            }
            
            // 调用文字识别API
            wx.request({
              url: `https://aip.baidubce.com/rest/2.0/ocr/v1/accurate_basic?access_token=${accessToken}`,
              method: 'POST',
              header: {
                'Content-Type': 'application/x-www-form-urlencoded'
              },
              data: {
                image: base64,
                detect_direction: 'true'
              },
              success: (ocrRes) => {
                if (ocrRes.data.words_result) {
                  resolve(ocrRes.data.words_result)
                } else {
                  reject(new Error('OCR识别失败'))
                }
              },
              fail: reject
            })
          },
          fail: reject
        })
      } catch (err) {
        reject(err)
      }
    })
  },

  // 分析支付截图
  analyzePaymentScreenshot(wordsResult) {
    // 提取所有文字
    const allText = wordsResult.map(w => w.words).join(' ')
    console.log('[OCR识别结果]', allText)
    
    // 保存识别记录用于后台查看
    this.saveOcrRecord(allText)

    // ==================== 检查金额 - 支持多种格式 ====================
    const amountPatterns = [
      /9\.9/, /9\.90/, /¥9\.9/, /￥9\.9/, /9元9角/, /9块9/,
      /金额[：:]?\s*9\.9/, /支付[：:]?\s*9\.9/, /付款[：:]?\s*9\.9/
    ]
    const hasAmount = amountPatterns.some(p => p.test(allText))
    
    // ==================== 检查时间 - 支持多种时间格式 ====================
    const timePatterns = [
      /\d{4}[年/-]\d{1,2}[月/-]\d{1,2}[日]?/,  // 2024-01-01 或 2024年1月1日
      /\d{1,2}[月/-]\d{1,2}[日]?/,  // 1月1日 或 01-01
      /\d{2}[：:]\d{2}([：:]\d{2})?/,  // 14:30 或 14:30:00
      /今天|今日|刚刚|刚才/,
    ]
    const hasTime = timePatterns.some(p => p.test(allText))
    
    // ==================== 检查交易标识 ====================
    const transactionPatterns = [
      /交易单号/, /商户单号/, /订单号/, /流水号/, /交易号/,
      /微信支付/, /微信转账/, /支付成功/, /付款成功/, /转账成功/,
      /收款方/, /付款方/, /商户名称/
    ]
    const hasTransaction = transactionPatterns.some(p => p.test(allText))
    
    // ==================== 检查收款方（新增）====================
    // 支持的收款方名称（可配置多个）
    const validPayees = [
      'news-tomato', 'news tomato', 'newstomato',
      '恋爱进化论', '恋爱教练', '灵魂伴侣',
      'AlphaPig', 'Alpha Pig', 'alphapig',
      '番茄', '番茄君', '🍅'
    ]
    
    // 检查收款方
    let payeeMatch = null
    let hasValidPayee = false
    
    // 1. 直接匹配收款方名称
    for (const payee of validPayees) {
      if (allText.toLowerCase().includes(payee.toLowerCase())) {
        payeeMatch = payee
        hasValidPayee = true
        break
      }
    }
    
    // 2. 匹配"收款方"后面的内容
    if (!hasValidPayee) {
      const payeePatterns = [
        /收款方[：:]\s*([^\s]{2,20})/,
        /商户名称[：:]\s*([^\s]{2,20})/,
        /对方账户[：:]\s*([^\s]{2,20})/,
        /转账给[：:]?\s*([^\s]{2,20})/,
        /向(.+?)转账/,
        /付款给[：:]?\s*([^\s]{2,20})/
      ]
      
      for (const pattern of payeePatterns) {
        const match = allText.match(pattern)
        if (match && match[1]) {
          const extractedPayee = match[1].trim()
          // 检查提取的收款方是否在有效列表中
          for (const validPayee of validPayees) {
            if (extractedPayee.toLowerCase().includes(validPayee.toLowerCase()) ||
                validPayee.toLowerCase().includes(extractedPayee.toLowerCase())) {
              payeeMatch = extractedPayee
              hasValidPayee = true
              break
            }
          }
          if (hasValidPayee) break
        }
      }
    }
    
    // 3. 如果没有匹配到具体收款方，但有转账/支付成功标识，给部分分数
    const hasTransferIndicator = /转账|支付|付款/.test(allText)
    
    // ==================== 检查是否为微信/支付宝支付截图 ====================
    const isPaymentScreenshot = /微信|WeChat|支付宝|Alipay/.test(allText) || 
                                 hasAmount || hasTransaction

    // ==================== 计算可信度分数（更新）====================
    let score = 0
    if (hasAmount) score += 35        // 金额 35分（必须）
    if (hasValidPayee) score += 25    // 收款方 25分（新增）
    else if (hasTransferIndicator) score += 10  // 有转账标识但收款方不明确
    if (hasTime) score += 20          // 时间 20分
    if (hasTransaction) score += 15   // 交易标识 15分
    if (isPaymentScreenshot) score += 5  // 支付截图特征 5分

    console.log('[截图分析]', { 
      hasAmount, 
      hasValidPayee, 
      payeeMatch,
      hasTime, 
      hasTransaction, 
      isPaymentScreenshot, 
      score 
    })

    // ==================== 判断标准（更新）====================
    // 金额必须正确
    if (!hasAmount) {
      return { 
        isValid: false, 
        reason: '未检测到支付金额 ¥9.9',
        details: '请确保截图中包含支付金额 9.9 元'
      }
    }
    
    // 收款方验证（重要但不强制，给提示）
    if (!hasValidPayee) {
      // 如果其他条件满足，只是收款方不明确，降低分数但不直接拒绝
      console.log('[收款方警告] 未识别到有效收款方')
    }
    
    // 至少有时间或交易标识
    if (!hasTime && !hasTransaction) {
      return { 
        isValid: false, 
        reason: '截图缺少支付时间或交易信息',
        details: '请确保截图包含完整的支付时间或交易单号'
      }
    }

    // 可信度 >= 70 直接通过
    if (score >= 70) {
      return { 
        isValid: true, 
        score,
        payee: payeeMatch,
        message: hasValidPayee ? `收款方验证通过：${payeeMatch}` : '金额验证通过'
      }
    } else if (score >= 50) {
      // 50-70分：需要人工审核
      return { 
        isValid: false, 
        reason: '截图信息需要进一步验证',
        details: hasValidPayee 
          ? '截图信息基本完整，请等待人工审核或联系客服'
          : '未识别到收款方信息，请确认是否转账给正确的账户',
        needManualReview: true,
        score
      }
    } else {
      return { 
        isValid: false, 
        reason: '截图信息不完整，可信度较低',
        details: '请上传清晰的支付成功截图，包含金额、时间和收款方信息',
        score 
      }
    }
  },

  // 保存OCR识别记录
  saveOcrRecord(text) {
    const record = {
      time: Date.now(),
      text: text.substring(0, 500), // 限制长度
      userId: getDeviceFingerprint(),
      date: new Date().toISOString().split('T')[0]
    }
    
    const records = wx.getStorageSync('ocr_records') || []
    records.unshift(record)
    if (records.length > 50) records.pop()
    wx.setStorageSync('ocr_records', records)
  },

  // 记录作弊尝试
  recordCheatAttempt(userId, reason) {
    const attempts = wx.getStorageSync('cheat_attempts') || []
    attempts.push({
      userId,
      reason,
      time: Date.now(),
      date: new Date().toISOString().split('T')[0]
    })
    wx.setStorageSync('cheat_attempts', attempts)
    
    // 如果同一用户作弊超过3次，自动拉黑
    const userAttempts = attempts.filter(a => a.userId === userId)
    if (userAttempts.length >= 3) {
      this.banUser(userId, '多次提交重复截图')
    }
  },

  // 拉黑用户
  banUser(userId, reason) {
    const bannedUsers = wx.getStorageSync('bannedUsers') || []
    if (!bannedUsers.some(u => u.tempUserId === userId)) {
      bannedUsers.push({
        tempUserId: userId,
        banTime: Date.now(),
        reason
      })
      wx.setStorageSync('bannedUsers', bannedUsers)
    }
  },

  // 检查是否已被后台解锁（页面显示时调用）
  checkIfUnlocked() {
    const pendingOrder = wx.getStorageSync('pending_soulmate_order')
    if (!pendingOrder || pendingOrder.status !== 'pending') return

    // 检查本地解锁标记（后台管理员手机操作后会同步到所有用户？不，本地存储不互通）
    // 实际方案：用户重新进入页面时，如果已解锁，soulmateData 里会有 unlocked 标记
    const soulmateData = wx.getStorageSync('soulmateData')
    if (soulmateData && soulmateData.unlocked) {
      // 已解锁，更新 pendingOrder 状态
      pendingOrder.status = 'approved'
      wx.setStorageSync('pending_soulmate_order', pendingOrder)
      this.setData({
        soulmate: { ...this.data.soulmate, unlocked: true }
      })
    }
  },
  
  // 确保获取用户信息（昵称、OpenID等）
  ensureUserInfo() {
    const userInfo = wx.getStorageSync('userInfo') || {}
    
    // 如果没有 tempUserId，尝试获取
    if (!userInfo.tempUserId) {
      const app = getApp()
      if (app && app.getUserLoginCode) {
        app.getUserLoginCode()
      }
    }
    
    // 获取微信用户信息
    wx.getUserProfile({
      desc: '用于支付记录标识',
      success: (res) => {
        const wxUserInfo = res.userInfo
        const updatedUserInfo = {
          ...userInfo,
          nickName: wxUserInfo.nickName || userInfo.nickName || '未知用户',
          avatarUrl: wxUserInfo.avatarUrl || userInfo.avatarUrl,
          gender: wxUserInfo.gender || userInfo.gender,
          updateTime: Date.now()
        }
        wx.setStorageSync('userInfo', updatedUserInfo)
      },
      fail: () => {
        // 如果用户拒绝，使用已有信息或默认值
        if (!userInfo.nickName) {
          userInfo.nickName = '微信用户'
          wx.setStorageSync('userInfo', userInfo)
        }
      }
    })
  },

  // 生成唯一标识
  generateUniqueId() {
    const now = new Date()
    const timeStr = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0')
    const randomStr = Math.random().toString(36).substring(2, 4).toUpperCase()
    return `${timeStr}${randomStr}`
  },

  // 预览二维码图片（点击放大查看，在预览界面可以长按识别）
  previewQRCode() {
    wx.previewImage({
      urls: ['/images/pay-qr-code.jpg'],
      current: '/images/pay-qr-code.jpg',
      success: () => {
        console.log('[支付] 二维码预览成功')
      },
      fail: (err) => {
        console.error('[支付] 二维码预览失败:', err)
        wx.showToast({
          title: '图片加载失败',
          icon: 'none'
        })
      }
    })
  },

  // 复制付款链接
  copyPayLink() {
    const payLink = '#付款:AlphaPig(news-tomato)/恋爱灵魂伴侣收款/001'

    wx.setClipboardData({
      data: payLink,
      success: () => {
        wx.showModal({
          title: '链接已复制',
          content: '付款链接已复制到剪贴板\n\n请发送到微信"文件传输助手"后点击支付',
          showCancel: false,
          confirmText: '知道了',
          success: () => {
            // 可以在这里记录用户复制了链接
            console.log('[支付] 用户复制了付款链接')
          }
        })
      },
      fail: (err) => {
        console.error('[支付] 复制链接失败:', err)
        wx.showToast({
          title: '复制失败，请重试',
          icon: 'none'
        })
      }
    })
  },

  // 选择支付截图
  choosePayScreenshot() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath
        this.setData({
          payScreenshot: tempFilePath
        })
        wx.showToast({
          title: '上传成功',
          icon: 'success'
        })
      },
      fail: (err) => {
        console.error('[支付] 选择截图失败:', err)
        if (err.errMsg && !err.errMsg.includes('cancel')) {
          wx.showToast({
            title: '上传失败，请重试',
            icon: 'none'
          })
        }
      }
    })
  },

  // 预览截图
  previewScreenshot() {
    const { payScreenshot } = this.data
    if (!payScreenshot) return

    wx.previewImage({
      urls: [payScreenshot],
      current: payScreenshot
    })
  },

  // 删除截图
  deleteScreenshot() {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这张支付截图吗？',
      confirmColor: '#FF6B8A',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            payScreenshot: ''
          })
        }
      }
    })
  },



  // 检查用户是否被封禁（基于 tempUserId）
  isUserBanned() {
    // 获取用户 tempUserId（从存储中）
    const userInfo = wx.getStorageSync('userInfo') || {}
    const tempUserId = userInfo.tempUserId || ''
    
    if (!tempUserId) return false
    
    const bannedUsers = wx.getStorageSync('bannedUsers') || []
    return bannedUsers.some(u => u.tempUserId === tempUserId || u.wechatId === tempUserId)
  },

  // 复制微信号
  copyWechatId() {
    wx.setClipboardData({
      data: 'news-tomato',
      success: () => {
        wx.showModal({
          title: '已复制微信号',
          content: '微信号 news-tomato 已复制到剪贴板，请前往微信添加好友，备注"恋爱小程序"',
          confirmText: '去添加',
          cancelText: '取消',
          success: (res) => {
            if (res.confirm) {
              // 尝试打开微信
              wx.showToast({ title: '请手动打开微信', icon: 'none' })
            }
            this.setData({ paying: false })
          }
        })
      }
    })
  },





  // 生成订单ID
  generateOrderId() {
    const now = new Date()
    const dateStr = String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0')
    const randomStr = Math.random().toString(36).substring(2, 5).toUpperCase()
    return `SL${dateStr}${randomStr}`
  },

  // 更新支付记录状态
  updatePaymentStatus() {
    const orderId = this.data.currentOrderId
    if (!orderId) return
    
    const paymentRecords = wx.getStorageSync('paymentRecords') || []
    const recordIndex = paymentRecords.findIndex(r => r.orderId === orderId)
    
    if (recordIndex !== -1) {
      paymentRecords[recordIndex].status = 'success'
      paymentRecords[recordIndex].successTime = Date.now()
      wx.setStorageSync('paymentRecords', paymentRecords)
      console.log('[支付] 状态更新为成功:', orderId)
    }
  },

  // 支付成功处理
  handlePaySuccess() {
    console.log('[支付] 开始处理支付成功...')
    this.setData({ paying: false, paySuccess: true })
    
    // 更新支付记录状态为成功
    this.updatePaymentStatus()

    const { soulmate, astroSummary, birthYear, birthMonth, birthDay, userGender } = this.data
    
    console.log('[支付] 当前数据:', { soulmate, astroSummary, birthYear, birthMonth, birthDay, userGender })

    // 生成唯一的seed用于选择头像
    const seed = parseInt(birthYear || 2000) * 10000 + parseInt(birthMonth || 1) * 100 + parseInt(birthDay || 1)
    const targetGender = userGender === 'male' ? 'female' : 'male'
    
    // 灵魂伴侣星座
    const soulmateZodiac = astroSummary ? astroSummary.soulmateZodiac : null
    
    console.log('[支付] 头像参数:', { seed, targetGender, soulmateZodiac })

    wx.showLoading({ title: '生成中...', mask: true })

    // 使用本地星座图片
    this.generateAndDownloadImage({
      zodiac: astroSummary ? astroSummary.zodiac.name : '未知',
      soulmateZodiac: soulmateZodiac,
      gender: targetGender,
      desc: soulmate.desc || '命中注定',
      seed: seed,
      onSuccess: (avatarData) => {
        console.log('[支付] 头像生成成功:', avatarData)
        wx.hideLoading()
        this.updateSoulmateWithImage(soulmate, avatarData, true)
        wx.showToast({ title: '解锁成功！', icon: 'success' })
      },
      onError: (err) => {
        console.error('[支付] 头像生成失败:', err)
        wx.hideLoading()
        // 使用默认头像
        const defaultAvatar = this.getLocalAvatar(targetGender, seed, soulmateZodiac)
        console.log('[支付] 使用默认头像:', defaultAvatar)
        this.updateSoulmateWithImage(soulmate, defaultAvatar, true)
        wx.showToast({ title: '解锁成功！', icon: 'success' })
      },
    })
  },

  // 生成本地头像图片（使用星座图片库）
  generateAndDownloadImage({ zodiac, soulmateZodiac, gender, desc, seed, onSuccess, onError }) {
    // 使用本地星座图片
    const localImage = this.getLocalAvatar(gender, seed, soulmateZodiac)
    onSuccess && onSuccess(localImage)
  },

  // 获取本地预设头像（优先使用星座图片，降级到渐变色）
  getLocalAvatar(gender, seed, soulmateZodiac) {
    // 优先：根据灵魂伴侣星座选择对应图片
    if (soulmateZodiac) {
      const zodiacKey = ZODIAC_TO_KEY[soulmateZodiac]
      if (zodiacKey) {
        const imgPath = `/images/soulmate/${zodiacKey}_${gender}.png`
        return { type: 'image', path: imgPath, zodiacKey }
      }
    }
    // 降级：使用渐变色方案（兜底）
    const avatarStyles = {
      male: [
        { bg: 'linear-gradient(160deg, #e8d5f5 0%, #c4a0e8 50%, #9b6fc7 100%)', hair: 'rgba(40, 20, 60, 0.85)', skin: 'rgba(255, 220, 195, 0.95)' },
        { bg: 'linear-gradient(160deg, #dbeafe 0%, #93c5fd 50%, #60a5fa 100%)', hair: 'rgba(30, 20, 60, 0.88)', skin: 'rgba(245, 222, 200, 0.95)' },
        { bg: 'linear-gradient(160deg, #fef9c3 0%, #fde047 50%, #facc15 100%)', hair: 'rgba(100, 55, 10, 0.9)', skin: 'rgba(255, 228, 196, 0.95)' },
        { bg: 'linear-gradient(160deg, #d4f8e8 0%, #6ee7b7 50%, #34d399 100%)', hair: 'rgba(20, 50, 30, 0.85)', skin: 'rgba(250, 225, 200, 0.95)' },
      ],
      female: [
        { bg: 'linear-gradient(160deg, #ffecd2 0%, #fcb69f 50%, #e8956d 100%)', hair: 'rgba(80, 40, 10, 0.9)', skin: 'rgba(255, 210, 180, 0.95)' },
        { bg: 'linear-gradient(160deg, #ffd6e7 0%, #ffb3c6 50%, #ff85a1 100%)', hair: 'rgba(120, 60, 20, 0.88)', skin: 'rgba(255, 218, 198, 0.95)' },
        { bg: 'linear-gradient(160deg, #ede9fe 0%, #c4b5fd 50%, #a78bfa 100%)', hair: 'rgba(60, 30, 80, 0.88)', skin: 'rgba(255, 215, 190, 0.95)' },
        { bg: 'linear-gradient(160deg, #fce7f3 0%, #fbcfe8 50%, #f9a8d4 100%)', hair: 'rgba(90, 45, 30, 0.9)', skin: 'rgba(255, 220, 195, 0.95)' },
      ],
    }
    const list = avatarStyles[gender] || avatarStyles['female']
    return { type: 'gradient', ...list[seed % list.length] }
  },

  // 更新 soulmate 数据并显示清晰图片
  updateSoulmateWithImage(soulmate, avatarData, removeBlur) {
    // avatarData 可能是 { type: 'image', path: '...' } 或 { type: 'gradient', bg: '...' }
    let newSoulmate
    if (avatarData && avatarData.type === 'image') {
      // 本地星座图片
      newSoulmate = {
        ...soulmate,
        blurred: !removeBlur,
        imageUrl: avatarData.path,   // 本地图片路径
        avatarType: 'image',         // 标记为图片类型
        unlocked: true,
      }
    } else {
      // 渐变色头像（降级方案）
      newSoulmate = {
        ...soulmate,
        blurred: !removeBlur,
        imageUrl: '',                // 无图片URL，使用渐变
        avatarType: 'gradient',
        avatarStyle: avatarData ? avatarData.bg : soulmate.avatarStyle,
        hairColor: avatarData ? avatarData.hair : soulmate.hairColor,
        skinColor: avatarData ? avatarData.skin : soulmate.skinColor,
        unlocked: true,
      }
    }

    // 持久化存储（避免重复付费）
    const { astroSummary, birthYear, birthMonth, birthDay, birthCity, userGender } = this.data
    const saveData = {
      astroSummary,
      soulmate: newSoulmate,
      birthYear,
      birthMonth,
      birthDay,
      birthCity,
      userGender,
    }
    wx.setStorageSync('soulmateData', saveData)

    // 保存到历史记录（只有付费解锁的才保存）
    if (removeBlur) {
      storage.saveSoulmateRecord({
        birthYear,
        birthMonth,
        birthDay,
        birthCity,
        userGender,
        astroSummary,
        soulmate: newSoulmate,
        imageUrl: newSoulmate.imageUrl || '',
        unlocked: true,
        payTime: Date.now(),
        seed: parseInt(birthYear || 2000) * 10000 + parseInt(birthMonth || 1) * 100 + parseInt(birthDay || 1),
      })
      
      // 记录用户行为
      storage.logUserBehavior('soulmate_pay', {
        success: true,
        amount: 9.9,
        birthDate: `${birthYear}-${birthMonth}-${birthDay}`,
        zodiac: astroSummary?.zodiac?.name,
      })
    }

    this.setData({
      soulmate: newSoulmate,
      canShare: true,
    })

    console.log('[支付] 解锁完成，soulmate数据已更新:', newSoulmate)
  },

  handlePayFail(msg) {
    this.setData({ paying: false })
    wx.showToast({ title: msg || '支付失败，请重试', icon: 'none' })
  },

  // ===== 长按保存图片 =====
  onLongPressImage() {
    if (!this.data.soulmate.unlocked) return
    const { imageUrl } = this.data.soulmate
    if (imageUrl) {
      wx.showActionSheet({
        itemList: ['保存图片到相册', '分享给朋友'],
        success: (res) => {
          if (res.tapIndex === 0) {
            this.saveImage()
          } else if (res.tapIndex === 1) {
            this.shareResult()
          }
        },
      })
    }
  },

  saveImage() {
    const { imageUrl } = this.data.soulmate

    if (!imageUrl) {
      // 没有图片（使用渐变头像），提示用户截图
      wx.showModal({
        title: '保存头像',
        content: '生成的渐变头像暂不支持保存，你可以截图保存哦～',
        showCancel: false,
        confirmText: '知道了',
      })
      return
    }

    wx.showLoading({ title: '保存中...' })

    // 判断是本地路径还是网络 URL
    // downloadAndSaveImage 已经把图片存到本地了，imageUrl 是 wxfile:// 或 http:// 临时路径
    const isLocalFile = imageUrl.startsWith('wxfile://') || imageUrl.startsWith('http://tmp') || (!imageUrl.startsWith('http'))

    const doSave = (filePath) => {
      wx.saveImageToPhotosAlbum({
        filePath,
        success: () => {
          wx.hideLoading()
          wx.showToast({ title: '已保存到相册', icon: 'success' })
        },
        fail: (err) => {
          wx.hideLoading()
          if (err.errMsg && err.errMsg.includes('auth deny')) {
            wx.showModal({
              title: '需要相册权限',
              content: '请在设置中允许访问相册',
              confirmText: '去设置',
              success: (r) => {
                if (r.confirm) wx.openSetting()
              },
            })
          } else {
            wx.showToast({ title: '保存失败，请重试', icon: 'none' })
          }
        },
      })
    }

    if (isLocalFile) {
      // 本地路径：直接保存到相册
      doSave(imageUrl)
    } else {
      // 网络 URL：先下载再保存
      wx.downloadFile({
        url: imageUrl,
        success: (res) => {
          if (res.statusCode === 200) {
            doSave(res.tempFilePath)
          } else {
            wx.hideLoading()
            wx.showToast({ title: '下载失败，请重试', icon: 'none' })
          }
        },
        fail: (err) => {
          wx.hideLoading()
          console.error('[保存图片] 下载失败:', err)
          wx.showToast({ title: '下载失败，请检查网络', icon: 'none' })
        },
      })
    }
  },

  shareResult() {
    // 使用 canvas 合成分享图
    wx.showShareMenu({ withShareTicket: false, menus: ['shareAppMessage'] })
    wx.showToast({ title: '点击右上角"···"分享', icon: 'none', duration: 2500 })
  },

  // 微信分享回调
  onShareAppMessage() {
    const { soulmate, astroSummary } = this.data
    const zodiacName = astroSummary ? astroSummary.zodiac.name : ''
    return {
      title: `星座配对测试：${zodiacName}最适合和什么星座在一起？💕`,
      path: '/pages/soulmate/soulmate',
      imageUrl: soulmate.imageUrl || '',
    }
  },

  // 去输入重测
  goBack() {
    if (this.data.step !== 'input') {
      wx.showModal({
        title: '重新测试',
        content: '重新测试会清除当前结果，确定吗？',
        confirmText: '确定重测',
        confirmColor: '#FF6B8A',
        success: (res) => {
          if (res.confirm) this.regenerate()
        },
      })
    }
  },
})
