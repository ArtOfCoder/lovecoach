# API 调试指南

## 当前配置

- **AI 服务：** DeepSeek API
- **API 地址：** `https://api.deepseek.com/v1/chat/completions`
- **模型：** `deepseek-chat`
- **模式：** 网络请求模式（需要域名白名单）

## 调试步骤

### 1. 检查开发者工具日志

在微信开发者工具中：
1. 点击右上角 **"调试"** 按钮（或按 F12）
2. 切换到 **Console** 面板
3. 发送一条 AI 消息
4. 查看日志输出

**正常情况：**
```
[AI] 发起请求: https://api.deepseek.com/v1/chat/completions Model: deepseek-chat
[AI] 收到响应: 200 {...}
[AI] 解析成功，内容长度: 345
```

**域名白名单问题：**
```
[AI] 网络错误: request:fail url not in domain list
[AI] 域名未加白名单！请在微信开发者工具中勾选"不校验合法域名"，或在小程序后台添加 api.deepseek.com
```

**网络超时：**
```
[AI] 网络错误: request:fail timeout
[AI] 请求超时，第1次重试...
```

---

### 2. 检查 API Key 有效性

在浏览器中测试 API Key：

```bash
curl https://api.deepseek.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-dc86cbd1925a4bbcb7d267eb210d0bfc" \
  -d '{
    "model": "deepseek-chat",
    "messages": [{"role": "user", "content": "你好"}]
  }'
```

**返回正常：**
```json
{
  "id": "chat-xxx",
  "choices": [{ "message": { "content": "你好！有什么可以帮助你的吗？" } }]
}
```

**API Key 无效：**
```json
{
  "error": {
    "message": "Invalid API key",
    "type": "invalid_request_error"
  }
}
```

---

### 3. 常见错误码

| 状态码 | 说明 | 解决方案 |
|--------|------|----------|
| 200 | 成功 | - |
| 401 | API Key 无效 | 检查 `utils/ai.js` 中的 `apiKey` |
| 429 | 请求频率超限 | 等待片刻再试，已自动重试 |
| 500/503 | 服务器错误 | 已自动重试 2 次 |
| `request:fail` | 网络错误 | 检查网络连接或域名白名单 |

---

## 解决方案

### 如果提示域名未加白名单

**方案A：勾选"不校验合法域名"（仅开发阶段）**
1. 微信开发者工具 → 右上角 **"详情"**
2. **"本地设置"** 标签
3. 勾选 ✅ **"不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书"**
4. 点击 **"清除缓存"** → **"编译"**

**方案B：配置服务器域名白名单（正式环境）**
1. 登录 [微信公众平台](https://mp.weixin.qq.com/)
2. **开发** → **开发管理** → **开发设置** → **服务器域名**
3. 在 **request 合法域名** 中添加：
   ```
   https://api.deepseek.com
   ```
4. 保存后等待 10-15 分钟生效

---

### 如果提示 API Key 无效

1. 检查 API Key 是否正确复制
2. 确认 API Key 未过期（登录 DeepSeek 平台查看）
3. 确认账户有余额
4. 重新生成 API Key 并更新

---

## 切换到腾讯混元 API

如果 DeepSeek API 仍然无法使用，可以切换到腾讯混元：

### 步骤

1. **申请腾讯混元 API Key**
   - 访问：https://cloud.tencent.com/product/hunyuan
   - 开通服务后获取 API Key

2. **修改配置文件**
   
   编辑 `utils/ai.js`，找到 `API_CONFIG` 部分：

   ```javascript
   const API_CONFIG = {
     // 注释掉 DeepSeek
     // baseUrl: 'https://api.deepseek.com/v1/chat/completions',
     // apiKey: 'sk-dc86cbd1925a4bbcb7d267eb210d0bfc',
     // model: 'deepseek-chat',

     // 启用腾讯混元
     baseUrl: 'https://api.hunyuan.cloud.tencent.com/v1/chat/completions',
     apiKey: 'YOUR_HUNYUAN_API_KEY',  // 替换为真实 key
     model: 'hunyuan-lite',
     
     maxTokens: 1000,
     temperature: 0.8,
   }
   ```

3. **配置域名白名单**
   - 在微信公众平台添加：
     ```
     https://api.hunyuan.cloud.tencent.com
     ```

4. **重新编译小程序**

---

## 本地模式（无需网络）

如果以上方案都无法使用，可以使用本地模式：

### 启用本地模式

编辑 `utils/ai.js`：

```javascript
const USE_LOCAL_MODE = true   // 启用本地模式
const USE_CLOUD_FUNCTION = false
```

本地模式特点：
- ✅ 无需网络连接
- ✅ 无需配置域名白名单
- ✅ 无需 API Key
- ⚠️ 基于关键词匹配，回复较固定

包含知识库：
- 搭讪技巧、表白指南、暧昧期
- 分手挽回、约会设计、冷淡处理
- 吵架和好、礼物惊喜

---

## 联系开发者

如果以上方法都无法解决：

1. 查看开发者工具 Console 中的完整错误日志
2. 截图保存错误信息
3. 联系开发者并提供：
   - 错误日志
   - 当前配置（本地模式/网络请求/云函数）
   - 使用环境（开发工具/真机/体验版）
