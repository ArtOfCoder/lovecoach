# 恋爱进化论 - H5完整版

## 版本说明

这是**保留完整AI功能**的H5版本，使用DeepSeek API提供真实的AI能力。

### 与小程序版本的区别

| 功能 | H5版本（本目录） | 小程序版本 |
|------|------------------|------------|
| AI顾问 | ✅ 真实AI对话 | 本地知识库 |
| 灵魂伴侣描述 | ✅ AI生成 | 本地模板 |
| 灵魂伴侣图片 | ✅ AI生成图片 | 本地渐变图案 |
| 聊天回复建议 | ✅ AI生成 | 本地模板 |
| 审核限制 | 无限制 | 需移除AI功能 |

## 技术栈

- 纯HTML5 + CSS3 + JavaScript
- DeepSeek API（AI对话）
- 响应式设计，支持移动端

## 文件结构

```
h5-version/
├── index.html              # 入口页面
├── README.md               # 本文件
├── js/
│   ├── wx-simulator.js     # 微信小程序API模拟器
│   ├── app.js              # 主应用逻辑
│   ├── router.js           # 路由管理（如需要）
│   └── ...
├── pages/
│   ├── ai-coach/           # AI顾问页面
│   │   ├── ai-coach.html
│   │   ├── ai-coach.css
│   │   └── ai-coach.js
│   ├── soulmate/           # 灵魂伴侣页面
│   │   ├── soulmate.html
│   │   ├── soulmate.css
│   │   └── soulmate.js
│   └── ...
├── utils/
│   ├── ai.js               # AI模块（DeepSeek API）
│   └── storage.js          # 本地存储工具
├── styles/
│   ├── common.css          # 公共样式
│   └── pages.css           # 页面样式
└── images/                 # 图片资源
```

## 部署方式

### 方式1：静态托管（推荐）

将本目录下的所有文件上传到任意静态托管服务：

- **GitHub Pages**：免费，适合开源项目
- **Vercel**：免费，支持自动部署
- **Netlify**：免费，支持自动部署
- **腾讯云COS**：国内访问快
- **阿里云OSS**：国内访问快

#### Vercel部署步骤：

1. 将代码推送到GitHub仓库
2. 登录 [Vercel](https://vercel.com)
3. 导入GitHub仓库
4. 框架预设选择"Other"
5. 部署完成即可获得访问链接

#### 腾讯云COS部署步骤：

1. 登录 [腾讯云控制台](https://console.cloud.tencent.com)
2. 创建COS存储桶（选择公有读私有写）
3. 开启静态网站托管
4. 上传本目录所有文件到存储桶
5. 获得访问链接

### 方式2：自有服务器

将文件上传到任意Web服务器（Nginx/Apache等）：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/h5-version;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## API配置

AI功能使用DeepSeek API，配置在 `utils/ai.js`：

```javascript
const API_CONFIG = {
  baseUrl: 'https://api.deepseek.com/v1/chat/completions',
  apiKey: 'sk-dc86cbd1925a4bbcb7d267eb210d0bfc',
  model: 'deepseek-chat',
}
```

**注意**：生产环境建议：
1. 使用自己的API Key
2. 通过后端代理API请求，避免前端暴露Key
3. 添加访问频率限制

## 浏览器兼容性

- Chrome 80+
- Safari 13+
- Firefox 75+
- Edge 80+
- 微信内置浏览器（iOS/Android）

## 本地开发

由于浏览器安全限制（CORS），直接打开HTML文件可能无法正常工作。建议使用本地服务器：

```bash
# Python 3
python -m http.server 8080

# Node.js
npx serve .

# PHP
php -S localhost:8080
```

然后访问 `http://localhost:8080`

## 免责声明

本H5版本仅供学习和娱乐使用，AI生成的内容仅供参考，不构成专业建议。

## 联系方式

- 微信：news-tomato
