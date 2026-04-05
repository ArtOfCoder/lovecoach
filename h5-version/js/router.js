/**
 * H5 路由管理
 */

window.router = {
  pages: {},
  currentPage: null,
  pageStack: [],
  
  // 注册页面
  registerPage(name, config) {
    this.pages[name] = config;
  },
  
  // 导航到新页面
  navigateTo(url) {
    const pageName = url.replace(/^\//, '').split('?')[0];
    this.pageStack.push(this.currentPage);
    this.switchPage(pageName);
  },
  
  // 重定向（替换当前页）
  redirectTo(url) {
    const pageName = url.replace(/^\//, '').split('?')[0];
    this.switchPage(pageName);
  },
  
  // 切换 Tab
  switchTab(url) {
    const pageName = url.replace(/^\//, '').split('?')[0];
    this.pageStack = []; // 清空栈
    this.switchPage(pageName);
    this.updateTabBar(pageName);
  },
  
  // 返回
  navigateBack(delta = 1) {
    for (let i = 0; i < delta && this.pageStack.length > 0; i++) {
      const pageName = this.pageStack.pop();
      this.switchPage(pageName);
    }
  },
  
  // 切换页面
  switchPage(pageName) {
    this.currentPage = pageName;
    
    // 更新 TabBar 状态
    if (['index', 'ai-coach', 'soulmate', 'profile'].includes(pageName)) {
      this.updateTabBar(pageName);
    }
    
    // 加载页面内容
    this.loadPage(pageName);
    
    // 触发页面生命周期
    const pageConfig = this.pages[pageName];
    if (pageConfig && pageConfig.onLoad) {
      pageConfig.onLoad(this.getPageOptions());
    }
    if (pageConfig && pageConfig.onShow) {
      pageConfig.onShow();
    }
    
    // 滚动到顶部
    document.getElementById('page-container').scrollTop = 0;
  },
  
  // 加载页面 HTML
  loadPage(pageName) {
    const container = document.getElementById('page-container');
    
    // 根据页面名加载对应的 HTML 内容
    fetch(`./pages/${pageName}/${pageName}.html`)
      .then(res => res.text())
      .then(html => {
        container.innerHTML = html;
        this.bindPageEvents(pageName);
      })
      .catch(() => {
        // 如果没有 HTML 文件，使用 JS 渲染
        this.renderPageByJS(pageName, container);
      });
  },
  
  // 使用 JS 渲染页面
  renderPageByJS(pageName, container) {
    const pageConfig = this.pages[pageName];
    if (pageConfig && pageConfig.render) {
      container.innerHTML = pageConfig.render();
      this.bindPageEvents(pageName);
    }
  },
  
  // 绑定页面事件
  bindPageEvents(pageName) {
    const pageConfig = this.pages[pageName];
    if (!pageConfig) return;
    
    // 绑定点击事件
    container.querySelectorAll('[bindtap]').forEach(el => {
      const methodName = el.getAttribute('bindtap');
      el.addEventListener('click', (e) => {
        if (pageConfig[methodName]) {
          pageConfig[methodName].call(pageConfig, e);
        }
      });
    });
    
    // 绑定输入事件
    container.querySelectorAll('[bindinput]').forEach(el => {
      const methodName = el.getAttribute('bindinput');
      el.addEventListener('input', (e) => {
        if (pageConfig[methodName]) {
          pageConfig[methodName].call(pageConfig, e);
        }
      });
    });
  },
  
  // 更新 TabBar
  updateTabBar(activePage) {
    document.querySelectorAll('.tab-item').forEach(item => {
      item.classList.remove('active');
      if (item.dataset.page === activePage) {
        item.classList.add('active');
      }
    });
  },
  
  // 获取页面参数
  getPageOptions() {
    const hash = window.location.hash;
    const query = hash.split('?')[1];
    const options = {};
    if (query) {
      query.split('&').forEach(param => {
        const [key, value] = param.split('=');
        options[key] = decodeURIComponent(value);
      });
    }
    return options;
  }
};

// TabBar 点击事件
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.tab-item').forEach(item => {
    item.addEventListener('click', () => {
      const page = item.dataset.page;
      window.router.switchTab(`/${page}`);
    });
  });
});
