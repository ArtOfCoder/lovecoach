# 云函数部署说明

如果未来需要使用真实 AI 功能，可以部署这些云函数来绕过小程序的域名白名单限制。

## 已有云函数

### 1. ai-proxy - AI 对话代理
用于调用 DeepSeek API 进行文字对话。

### 2. generate-image - 图像生成
用于生成灵魂伴侣的肖像图片。

### 3. create-order - 微信支付创建订单
用于创建微信支付订单，生成支付参数。

### 4. pay-notify - 微信支付结果通知
接收微信支付成功后的回调通知，更新订单状态。

### 5. query-order - 查询订单状态
用于查询订单的支付状态。

---

## 部署步骤

### 一、开通云开发

1. 在微信开发者工具中：云开发 → 开通
2. 选择免费版或基础版

### 二、配置微信支付（如需支付功能）

1. 登录 [微信支付商户平台](https://pay.weixin.qq.com/)
2. 获取商户号（mchid）
3. 在云开发控制台：设置 → 全局设置 → 微信支付
4. 绑定商户号（需要商户管理员授权）

### 三、创建数据库集合

在云开发控制台 → 数据库中创建以下集合：

```
orders          - 订单数据
payment_logs    - 支付日志
user_payment_stats - 用户支付统计
```

### 四、部署云函数

1. 在 `cloudfunctions/` 目录下已有对应文件夹
2. 右键对应文件夹 → 新建 Node.js 云函数（如尚未创建）
3. 右键云函数 → 上传并部署：云端安装依赖

需要部署的云函数：
- `ai-proxy` - AI 对话代理
- `generate-image` - 图像生成
- `create-order` - 微信支付创建订单
- `pay-notify` - 微信支付结果通知
- `query-order` - 查询订单状态

### 五、配置小程序

#### AI 功能配置（utils/ai.js）
```javascript
const USE_CLOUD_FUNCTION = true  // 启用云函数
const USE_LOCAL_MODE = false     // 关闭本地模式
```

#### 微信支付配置（pages/soulmate/soulmate.js）
```javascript
const USE_CLOUD_PAY = true  // 启用云开发支付
```

### 六、配置域名白名单（如使用外部图片服务）

需要在微信公众平台配置 downloadFile 域名：
- `https://source.unsplash.com`（如使用 Unsplash）
- 或其他图片服务域名

---

## 云函数详细说明

### 1. create-order（创建支付订单）

**功能**：创建微信支付订单，返回支付参数

**调用方式**：
```javascript
wx.cloud.callFunction({
  name: 'create-order',
  data: {
    productId: 'soulmate-unlock',
    productName: '灵魂伴侣解锁',
    amount: 990,  // 单位：分
    openid: '',   // 自动获取
    attach: {     // 附加数据
      type: 'soulmate',
      birthDate: '2000-01-01',
    }
  }
})
```

**返回结果**：
```javascript
{
  success: true,
  orderNo: 'SOUL20240101123045ABC123',
  payParams: {
    appId: 'wx...',
    timeStamp: '1234567890',
    nonceStr: '...',
    package: 'prepay_id=...',
    signType: 'RSA',
    paySign: '...'
  }
}
```

### 2. pay-notify（支付结果通知）

**功能**：微信支付成功后自动调用，更新订单状态

**注意**：此云函数由微信服务器调用，无需手动调用

### 3. query-order（查询订单状态）

**功能**：查询订单的支付状态

**调用方式**：
```javascript
wx.cloud.callFunction({
  name: 'query-order',
  data: {
    orderNo: 'SOUL20240101123045ABC123'
  }
})
```

---

## 支付流程说明

```
用户点击支付
    ↓
调用 create-order 云函数
    ↓
获取支付参数（payParams）
    ↓
调用 wx.requestPayment
    ↓
用户完成支付
    ↓
微信自动调用 pay-notify 云函数
    ↓
更新订单状态为 paid
    ↓
小程序处理支付成功逻辑
```

---

## 注意事项

1. 云函数每月有免费额度（100万次调用）
2. 需要在云函数中配置真实的 API Key（如使用付费服务）
3. 云函数部署可能需要 2-3 分钟时间
4. 部署完成后，需要重新编译小程序才能生效
5. 使用外部图片时需要配置 downloadFile 域名白名单
6. **微信支付需要绑定商户号，否则无法使用**
7. **测试模式下（USE_CLOUD_PAY = false）不会真实扣款**
