// utils/storage.js - 数据存储管理模块
// 统一管理 soulmate 历史记录、用户行为日志、管理员统计

const STORAGE_KEYS = {
  SOULMATE_HISTORY: 'soulmate_history',      // 灵魂伴侣测算历史
  USER_BEHAVIOR_LOG: 'user_behavior_log',    // 用户行为日志
  ADMIN_ACCESS_LOG: 'admin_access_log',      // 管理员访问日志（所有用户）
  USER_STATS: 'user_stats',                  // 用户使用统计
  ADMIN_CONFIG: 'admin_config',              // 管理员配置
}

// ========== 灵魂伴侣历史记录 ==========

/**
 * 保存一次灵魂伴侣测算记录
 * @param {Object} record - 测算记录
 *   - birthYear, birthMonth, birthDay, birthCity
 *   - userGender, astroSummary, soulmate
 *   - imageUrl, unlocked, payTime, seed
 */
function saveSoulmateRecord(record) {
  const history = wx.getStorageSync(STORAGE_KEYS.SOULMATE_HISTORY) || []
  const newRecord = {
    id: generateId(),
    createTime: Date.now(),
    ...record,
  }
  // 新记录放在最前面
  history.unshift(newRecord)
  // 最多保留 50 条记录
  if (history.length > 50) {
    history.length = 50
  }
  wx.setStorageSync(STORAGE_KEYS.SOULMATE_HISTORY, history)
  return newRecord
}

/**
 * 获取灵魂伴侣历史记录
 * @param {boolean} onlyUnlocked - 是否只返回已解锁的
 * @returns {Array} 历史记录列表
 */
function getSoulmateHistory(onlyUnlocked = false) {
  const history = wx.getStorageSync(STORAGE_KEYS.SOULMATE_HISTORY) || []
  if (onlyUnlocked) {
    return history.filter(r => r.unlocked)
  }
  return history
}

/**
 * 获取单条历史记录
 * @param {string} id - 记录ID
 */
function getSoulmateRecordById(id) {
  const history = getSoulmateHistory()
  return history.find(r => r.id === id)
}

/**
 * 删除单条历史记录
 * @param {string} id - 记录ID
 */
function deleteSoulmateRecord(id) {
  const history = getSoulmateHistory()
  const filtered = history.filter(r => r.id !== id)
  wx.setStorageSync(STORAGE_KEYS.SOULMATE_HISTORY, filtered)
}

/**
 * 清空所有历史记录
 */
function clearSoulmateHistory() {
  wx.removeStorageSync(STORAGE_KEYS.SOULMATE_HISTORY)
}

// ========== 用户行为日志 ==========

/**
 * 记录用户行为
 * @param {string} action - 行为类型
 * @param {Object} data - 行为数据
 */
function logUserBehavior(action, data = {}) {
  const logs = wx.getStorageSync(STORAGE_KEYS.USER_BEHAVIOR_LOG) || []
  const logEntry = {
    id: generateId(),
    action,
    data,
    timestamp: Date.now(),
    date: formatDate(new Date()),
  }
  logs.unshift(logEntry)
  // 最多保留 500 条
  if (logs.length > 500) {
    logs.length = 500
  }
  wx.setStorageSync(STORAGE_KEYS.USER_BEHAVIOR_LOG, logs)
  
  // 同时更新用户统计
  updateUserStats(action, data)
  
  // 同时记录到管理员日志（包含用户标识）
  logAdminAccess(action, data)
}

/**
 * 获取用户行为日志
 * @param {Object} options - 筛选选项
 */
function getUserBehaviorLogs(options = {}) {
  const { startDate, endDate, action, limit = 100 } = options
  let logs = wx.getStorageSync(STORAGE_KEYS.USER_BEHAVIOR_LOG) || []
  
  if (startDate) {
    const start = new Date(startDate).getTime()
    logs = logs.filter(l => l.timestamp >= start)
  }
  if (endDate) {
    const end = new Date(endDate).getTime() + 86400000
    logs = logs.filter(l => l.timestamp <= end)
  }
  if (action) {
    logs = logs.filter(l => l.action === action)
  }
  
  return logs.slice(0, limit)
}

/**
 * 清空用户行为日志
 */
function clearUserBehaviorLogs() {
  wx.removeStorageSync(STORAGE_KEYS.USER_BEHAVIOR_LOG)
}

// ========== 用户使用统计 ==========

/**
 * 更新用户使用统计
 * @param {string} action - 行为类型
 * @param {Object} data - 行为数据
 */
function updateUserStats(action, data = {}) {
  const stats = wx.getStorageSync(STORAGE_KEYS.USER_STATS) || getDefaultUserStats()
  
  // 总使用次数
  stats.totalUsageCount = (stats.totalUsageCount || 0) + 1
  stats.lastActiveTime = Date.now()
  
  // 按模块统计
  const moduleMap = {
    'soulmate_generate': 'soulmate',
    'soulmate_pay': 'soulmate',
    'ai_chat': 'aiCoach',
    'ai_signal': 'aiCoach',
    'ai_roleplay': 'aiCoach',
    'course_view': 'course',
    'course_complete': 'course',
    'couple_update': 'couple',
    'chat_reply': 'chatReply',
    'topic_view': 'topics',
    'quiz_start': 'quiz',
    'quiz_complete': 'quiz',
  }
  
  const module = moduleMap[action]
  if (module) {
    if (!stats.modules[module]) {
      stats.modules[module] = { count: 0, lastTime: 0 }
    }
    stats.modules[module].count++
    stats.modules[module].lastTime = Date.now()
  }
  
  // 按日期统计
  const today = formatDate(new Date())
  if (!stats.dailyStats) stats.dailyStats = {}
  if (!stats.dailyStats[today]) {
    stats.dailyStats[today] = { count: 0, actions: {} }
  }
  stats.dailyStats[today].count++
  stats.dailyStats[today].actions[action] = (stats.dailyStats[today].actions[action] || 0) + 1
  
  // AI 顾问问答记录
  if (action.startsWith('ai_') && data.question) {
    if (!stats.aiChats) stats.aiChats = []
    stats.aiChats.unshift({
      mode: data.mode || 'chat',
      question: data.question,
      answer: data.answer || '',
      timestamp: Date.now(),
    })
    if (stats.aiChats.length > 100) {
      stats.aiChats.length = 100
    }
  }
  
  // 灵魂伴侣付费记录
  if (action === 'soulmate_pay' && data.success) {
    if (!stats.soulmatePayments) stats.soulmatePayments = []
    stats.soulmatePayments.unshift({
      amount: data.amount || 9.9,
      timestamp: Date.now(),
      recordId: data.recordId,
    })
  }
  
  wx.setStorageSync(STORAGE_KEYS.USER_STATS, stats)
}

/**
 * 获取用户使用统计
 */
function getUserStats() {
  return wx.getStorageSync(STORAGE_KEYS.USER_STATS) || getDefaultUserStats()
}

/**
 * 获取默认统计结构
 */
function getDefaultUserStats() {
  return {
    totalUsageCount: 0,
    firstUseTime: Date.now(),
    lastActiveTime: Date.now(),
    modules: {},
    dailyStats: {},
    aiChats: [],
    soulmatePayments: [],
  }
}

/**
 * 清空用户统计
 */
function clearUserStats() {
  wx.removeStorageSync(STORAGE_KEYS.USER_STATS)
}

// ========== 管理员访问日志（所有用户） ==========

/**
 * 记录管理员访问日志（包含用户标识）
 * @param {string} action - 行为类型
 * @param {Object} data - 行为数据
 */
function logAdminAccess(action, data = {}) {
  // 获取用户标识
  const userInfo = wx.getStorageSync('userInfo') || {}
  const openid = wx.getStorageSync('openid') || generateAnonymousId()
  
  const logs = wx.getStorageSync(STORAGE_KEYS.ADMIN_ACCESS_LOG) || []
  const logEntry = {
    id: generateId(),
    action,
    data,
    timestamp: Date.now(),
    date: formatDate(new Date()),
    user: {
      openid: openid.substring(0, 16) + '...', // 脱敏处理
      nickname: userInfo.nickname || '匿名用户',
      avatar: userInfo.avatar || '',
      gender: userInfo.gender || '',
    },
  }
  
  logs.unshift(logEntry)
  // 最多保留 1000 条
  if (logs.length > 1000) {
    logs.length = 1000
  }
  wx.setStorageSync(STORAGE_KEYS.ADMIN_ACCESS_LOG, logs)
}

/**
 * 获取管理员访问日志
 * @param {Object} options - 筛选选项
 */
function getAdminAccessLogs(options = {}) {
  const { startDate, endDate, action, userId, limit = 200 } = options
  let logs = wx.getStorageSync(STORAGE_KEYS.ADMIN_ACCESS_LOG) || []
  
  if (startDate) {
    const start = new Date(startDate).getTime()
    logs = logs.filter(l => l.timestamp >= start)
  }
  if (endDate) {
    const end = new Date(endDate).getTime() + 86400000
    logs = logs.filter(l => l.timestamp <= end)
  }
  if (action) {
    logs = logs.filter(l => l.action === action)
  }
  if (userId) {
    logs = logs.filter(l => l.user.openid.includes(userId))
  }
  
  return logs.slice(0, limit)
}

/**
 * 获取管理员统计数据
 */
function getAdminStats() {
  const logs = wx.getStorageSync(STORAGE_KEYS.ADMIN_ACCESS_LOG) || []
  const stats = {
    totalVisits: logs.length,
    uniqueUsers: new Set(logs.map(l => l.user.openid)).size,
    todayVisits: 0,
    actionStats: {},
    moduleStats: {},
    hourlyStats: new Array(24).fill(0),
  }
  
  const today = formatDate(new Date())
  
  logs.forEach(log => {
    // 今日访问
    if (log.date === today) {
      stats.todayVisits++
    }
    
    // 行为统计
    stats.actionStats[log.action] = (stats.actionStats[log.action] || 0) + 1
    
    // 模块统计
    const module = getModuleFromAction(log.action)
    if (module) {
      stats.moduleStats[module] = (stats.moduleStats[module] || 0) + 1
    }
    
    // 小时分布
    const hour = new Date(log.timestamp).getHours()
    stats.hourlyStats[hour]++
  })
  
  return stats
}

/**
 * 清空管理员日志
 */
function clearAdminAccessLogs() {
  wx.removeStorageSync(STORAGE_KEYS.ADMIN_ACCESS_LOG)
}

// ========== 管理员配置 ==========

/**
 * 检查是否是管理员
 * @param {string} code - 管理员密码
 */
function verifyAdmin(code) {
  // 默认管理员密码，实际使用时应从服务器获取或加密存储
  const ADMIN_CODE = 'love2026'
  return code === ADMIN_CODE
}

/**
 * 设置管理员配置
 */
function setAdminConfig(config) {
  wx.setStorageSync(STORAGE_KEYS.ADMIN_CONFIG, config)
}

/**
 * 获取管理员配置
 */
function getAdminConfig() {
  return wx.getStorageSync(STORAGE_KEYS.ADMIN_CONFIG) || {}
}

// ========== 工具函数 ==========

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
}

function generateAnonymousId() {
  let id = wx.getStorageSync('anonymous_id')
  if (!id) {
    id = 'anon_' + generateId()
    wx.setStorageSync('anonymous_id', id)
  }
  return id
}

function formatDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getModuleFromAction(action) {
  const map = {
    'soulmate_generate': '灵魂伴侣',
    'soulmate_pay': '灵魂伴侣',
    'ai_chat': 'AI顾问',
    'ai_signal': 'AI顾问',
    'ai_roleplay': 'AI顾问',
    'ai_vent': 'AI顾问',
    'course_view': '课程',
    'course_complete': '课程',
    'couple_update': '情侣档案',
    'chat_reply': '聊天回复',
    'topic_view': '话题库',
    'quiz_start': '测试',
    'quiz_complete': '测试',
  }
  return map[action] || '其他'
}

// ========== 导出 ==========

module.exports = {
  // 灵魂伴侣历史
  saveSoulmateRecord,
  getSoulmateHistory,
  getSoulmateRecordById,
  deleteSoulmateRecord,
  clearSoulmateHistory,
  
  // 用户行为日志
  logUserBehavior,
  getUserBehaviorLogs,
  clearUserBehaviorLogs,
  
  // 用户统计
  getUserStats,
  updateUserStats,
  clearUserStats,
  
  // 管理员
  logAdminAccess,
  getAdminAccessLogs,
  getAdminStats,
  clearAdminAccessLogs,
  verifyAdmin,
  setAdminConfig,
  getAdminConfig,
  
  // 工具
  formatDate,
}
