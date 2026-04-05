# AI 配置说明

## 当前状态

您的项目目前使用 **本地模式**，无需网络即可运行 AI 功能。

## 三种 AI 模式

### 1. 本地模式（当前使用）✅

**优点：**
- 无需网络连接
- 无需配置域名白名单
- 无需 API Key
- 响应速度快

**缺点：**
- 基于关键词匹配，回复固定
- 无法进行个性化对话

**使用场景：**
- 小程序被第三方平台托管
- 服务器域名功能被禁用
- 开发测试阶段

**如何使用：**
无需任何配置，直接运行即可！

---

### 2. 云函数模式（推荐）⭐

**优点：**
- 无需配置域名白名单
- 使用真实 AI（DeepSeek/混元）
- 可以进行个性化对话

**缺点：**
- 需要开通微信云开发
- 需要部署云函数
- 有一定技术门槛

**使用场景：**
- 小程序被托管，需要真实 AI
- 不想配置域名白名单
- 用户有云开发基础

**如何使用：**
1. 开通微信云开发
2. 部署 `cloudfunctions/ai-proxy` 云函数
3. 在 `utils/ai.js` 中修改配置：
   ```javascript
   const USE_CLOUD_FUNCTION = true   // 启用云函数
   const USE_LOCAL_MODE = false      // 关闭本地模式
   ```

详细步骤见 `cloudfunctions/README.md`

---

### 3. 直接网络请求模式（标准）🌐

**优点：**
- 最简单的配置方式
- 性能最好
- 无需云开发

**缺点：**
- 必须配置域名白名单
- 需要在微信公众平台操作

**使用场景：**
- 有完整的小程序管理权限
- 可以自由配置服务器域名
- 正式上线生产环境

**如何使用：**
1. 在微信公众平台配置域名白名单：
   - 开发 → 开发管理 → 开发设置 → 服务器域名
   - 添加：`https://api.deepseek.com`
2. 在 `utils/ai.js` 中修改配置：
   ```javascript
   const USE_CLOUD_FUNCTION = false  // 关闭云函数
   const USE_LOCAL_MODE = false      // 关闭本地模式
   ```
3. 替换真实的 API Key：
   ```javascript
   apiKey: 'YOUR_REAL_API_KEY'
   ```

---

## 快速切换模式

### 切换到本地模式
```javascript
// utils/ai.js
const USE_LOCAL_MODE = true
const USE_CLOUD_FUNCTION = false
```

### 切换到云函数模式
```javascript
// utils/ai.js
const USE_LOCAL_MODE = false
const USE_CLOUD_FUNCTION = true
```

### 切换到网络请求模式
```javascript
// utils/ai.js
const USE_LOCAL_MODE = false
const USE_CLOUD_FUNCTION = false
```

---

## 本地模式知识库

当前本地模式包含以下恋爱知识：

- **搭讪技巧**：3秒法则、万能公式
- **表白指南**：时机判断、最佳话术、被拒后应对
- **暧昧期**：核心任务、判断信号、推进策略
- **分手挽回**：30天冷静期、重新联系方法
- **约会设计**：地点选择、时间安排、话题准备
- **冷淡处理**：3种可能性分析、正确应对策略
- **吵架和好**：5步和解法、避免翻旧账
- **礼物惊喜**：男女礼物推荐、惊喜公式

---

## 常见问题

### Q: 为什么我的 AI 不能联网？
A: 可能的原因：
1. 服务器域名被第三方平台禁用（使用云函数或本地模式）
2. 域名白名单未配置（使用网络请求模式）
3. API Key 无效（检查 utils/ai.js 中的 apiKey）

### Q: 如何从本地模式升级到真实 AI？
A: 推荐使用云函数模式，步骤见 `cloudfunctions/README.md`

### Q: 本地模式的回复准确吗？
A: 本地模式基于关键词匹配，回复质量有限但够用。建议升级到云函数模式获得更好的体验。

### Q: 可以同时使用多种模式吗？
A: 不可以，同时只能启用一种模式。通过 `USE_LOCAL_MODE` 和 `USE_CLOUD_FUNCTION` 来切换。

---

## 技术支持

如有问题，请检查：
1. `utils/ai.js` 中的配置
2. 微信开发者工具的 Console 输出
3. 网络请求的报错信息（Network 面板）
