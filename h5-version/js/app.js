/**
 * H5版本主应用 - 保留完整AI功能
 */

// 当前页面
let currentPage = 'index';

// 页面配置
const pageConfigs = {
  'index': {
    title: '恋爱进化论',
    html: './pages/index/index.html',
    css: ['./pages/index/index.css'],
    js: './pages/index/index.js'
  },
  'ai-coach': {
    title: 'AI顾问',
    html: './pages/ai-coach/ai-coach.html',
    css: ['./pages/ai-coach/ai-coach.css'],
    js: './pages/ai-coach/ai-coach.js'
  },
  'soulmate': {
    title: '灵魂伴侣',
    html: './pages/soulmate/soulmate.html',
    css: ['./pages/soulmate/soulmate.css'],
    js: './pages/soulmate/soulmate.js'
  },
  'course': {
    title: '恋爱课程',
    html: './pages/course/course.html',
    css: ['./pages/course/course.css'],
    js: './pages/course/course.js'
  },
  'chat-reply': {
    title: '聊天回复',
    html: './pages/chat-reply/chat-reply.html',
    css: ['./pages/chat-reply/chat-reply.css'],
    js: './pages/chat-reply/chat-reply.js'
  },
  'profile': {
    title: '我的',
    html: './pages/profile/profile.html',
    css: ['./pages/profile/profile.css'],
    js: './pages/profile/profile.js'
  },
  'admin': {
    title: '管理后台',
    html: './pages/admin/admin.html',
    css: ['./pages/admin/admin.css'],
    js: './pages/admin/admin.js'
  }
};

// 初始化应用
function initApp() {
  // 加载首页
  loadPage('index');
}

// 加载页面
function loadPage(pageName) {
  const config = pageConfigs[pageName];
  if (!config) {
    console.error('Page not found:', pageName);
    return;
  }
  
  currentPage = pageName;
  
  // 更新标题
  document.title = config.title;
  
  // 加载CSS
  config.css.forEach(cssUrl => loadCSS(cssUrl));
  
  // 加载页面HTML
  fetch(config.html)
    .then(res => res.text())
    .then(html => {
      document.getElementById('page-container').innerHTML = html;
      
      // 加载并执行JS
      return loadScript(config.js);
    })
    .then(() => {
      // 调用页面初始化函数
      const initFunc = window[pageName.replace('-', '') + 'Page'] || 
                       window[pageName.replace('-', '_') + 'Page'] ||
                       window[pageName.charAt(0).toUpperCase() + pageName.slice(1).replace('-', '') + 'Page'];
      
      if (initFunc && initFunc.init) {
        initFunc.init();
      }
    })
    .catch(err => {
      console.error('Page load error:', err);
      document.getElementById('page-container').innerHTML = `
        <div style="padding: 40px; text-align: center; color: #999;">
          <div style="font-size: 48px; margin-bottom: 16px;">😅</div>
          <div>页面加载失败，请刷新重试</div>
          <div style="font-size: 12px; margin-top: 8px; color: #ccc;">${err.message}</div>
        </div>
      `;
    });
}

// 切换Tab
function switchTab(pageName) {
  // 切离当前页时，恢复page-container的滚动（AI顾问页会锁住它）
  const pageContainer = document.getElementById('page-container');
  if (pageContainer) {
    pageContainer.style.overflow = '';
    pageContainer.style.overflowY = 'auto';
  }

  // 更新TabBar状态
  document.querySelectorAll('.tab-item').forEach(item => {
    item.classList.remove('active');
    if (item.dataset.page === pageName) {
      item.classList.add('active');
    }
  });
  
  // 加载页面
  loadPage(pageName);
}

// 加载CSS
function loadCSS(url) {
  if (document.querySelector(`link[href="${url}"]`)) return;
  
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = url;
  document.head.appendChild(link);
}

// 已加载的脚本缓存
const loadedScripts = new Set();

// 加载JS
function loadScript(url) {
  return new Promise((resolve, reject) => {
    // 检查是否已经加载（使用缓存和DOM查询）
    if (loadedScripts.has(url) || document.querySelector(`script[src="${url}"]`)) {
      loadedScripts.add(url);
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = url + '?v=' + Date.now(); // 添加时间戳防止缓存
    script.onload = () => {
      loadedScripts.add(url);
      resolve();
    };
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

// 启动应用
document.addEventListener('DOMContentLoaded', initApp);

// 导出全局函数
window.switchTab = switchTab;
window.loadPage = loadPage;
