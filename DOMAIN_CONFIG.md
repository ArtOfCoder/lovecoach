# 域名白名单配置指南

## 当前配置状态

### AI 模式
- **USE_CLOUD_FUNCTION = false** - 直接调用 DeepSeek API
- **USE_LOCAL_MODE = false** - 不使用纯本地模式
- **USE_HYBRID_MODE = true** - 启用混合模式（API优先，失败时自动降级到本地）

**混合模式下，即使不配置域名白名单也能正常使用（自动使用本地回复）**

---

## 配置步骤（推荐配置，获得更好的AI体验）

### 1. 登录微信公众平台

访问 [微信公众平台](https://mp.weixin.qq.com/) → 登录你的小程序账号

### 2. 进入开发设置

开发 → 开发管理 → 开发设置 → **服务器域名**

### 3. 添加 request 合法域名

点击「修改」，添加以下域名：
```
https://api.deepseek.com
```

### 4. 添加 downloadFile 合法域名（如使用生图功能）

阿里通义万相生图需要：
```
https://dashscope.aliyuncs.com
https://dashscope-result-bj.oss-cn-beijing.aliyuncs.com
https://dashscope-result-sh.oss-cn-shanghai.aliyuncs.com
https://dashscope-result-hz.oss-cn-hangzhou.aliyuncs.com
```

### 5. 保存并提交

- 需要管理员扫码验证
- 保存后等待 5-10 分钟生效

### 6. 开发工具设置

在微信开发者工具中：
- 设置 → 项目设置 → 本地设置
- **取消勾选**「不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书」
- 重新编译项目

---

## 验证配置是否成功

1. 打开 AI 顾问页面
2. 发送一条消息
3. 如果能收到 AI 回复，说明配置成功

---

## 混合模式说明

当前配置启用了 **混合模式** (`USE_HYBRID_MODE = true`)：

- **优先使用 DeepSeek API**：获得更智能的 AI 回复
- **自动降级到本地模式**：当网络错误或域名未配置时，自动使用内置规则库回复
- **用户体验无缝**：用户感知不到切换过程

### 混合模式的优势

| 场景 | 行为 |
|------|------|
| 域名已配置 | 使用 DeepSeek AI，回复质量高 |
| 域名未配置 | 自动使用本地模式，功能正常 |
| 网络不稳定 | 自动降级，保证可用性 |
| 完全离线 | 本地模式正常工作 |

---

## 备用方案（如果不需要混合模式）

### 方案A：纯本地模式（完全免费，无需网络）
```javascript
// utils/ai.js
const USE_LOCAL_MODE = true
const USE_HYBRID_MODE = false
```

### 方案B：云函数模式（需要开通云开发）
```javascript
// utils/ai.js
const USE_CLOUD_FUNCTION = true
const USE_HYBRID_MODE = false
```

---

## 如果需要切换到直接请求模式

如果你希望小程序直接调用 DeepSeek API（不通过云函数），需要：

### 1. 修改配置

编辑 `utils/ai.js`：
```javascript
const USE_CLOUD_FUNCTION = false   // 关闭云函数
const USE_LOCAL_MODE = false       // 不使用本地模式
```

### 2. 配置域名白名单

登录 [微信公众平台](https://mp.weixin.qq.com/) → 开发 → 开发管理 → 开发设置 → 服务器域名

#### request 合法域名
添加：
```
https://api.deepseek.com
```

#### downloadFile 合法域名（如使用生图功能）
添加：
```
https://dashscope.aliyuncs.com
```

### 3. 关闭域名校验（开发测试时）

在微信开发者工具中：
- 设置 → 项目设置 → 本地设置
- 勾选「不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书」

**注意：上线前必须取消勾选，并配置真实域名白名单**

---

## 云开发模式（当前使用）

### 优点
- 无需配置域名白名单
- 绕过第三方平台的域名限制
- API Key 保存在服务端，更安全

### 需要部署的云函数

1. **ai-proxy** - AI 对话代理
2. **generate-image** - 图像生成（可选）

### 部署步骤

1. 在微信开发者工具中开通云开发
2. 右键 `cloudfunctions/ai-proxy` → 创建并部署：云端安装依赖
3. 右键 `cloudfunctions/generate-image` → 创建并部署：云端安装依赖（如需要生图功能）

---

## 云函数配置检查

### ai-proxy 云函数
- 位置：`cloudfunctions/ai-proxy/index.js`
- API Key：已配置（DeepSeek）
- 功能：转发 AI 对话请求

### generate-image 云函数
- 位置：`cloudfunctions/generate-image/index.js`
- 需要配置腾讯云 SecretId 和 SecretKey
- 如需使用，请替换 `YOUR_SECRET_ID` 和 `YOUR_SECRET_KEY`

---

## 常见问题

### Q: 云函数调用失败怎么办？
A: 
1. 检查云开发是否已开通
2. 检查云函数是否已部署
3. 查看云函数日志（云开发控制台 → 云函数 → 日志）

### Q: 如何查看云函数日志？
A: 
1. 微信开发者工具 → 云开发 → 云函数
2. 点击对应云函数 → 日志
3. 查看调用记录和错误信息

### Q: 云函数有调用次数限制吗？
A: 
- 免费版：每月 100 万次调用
- 一般个人小程序足够使用

### Q: 生图功能无法使用？
A:
1. 检查 `generate-image` 云函数是否已部署
2. 检查是否配置了腾讯云 SecretId 和 SecretKey
3. 检查是否开通了腾讯混元生图服务
