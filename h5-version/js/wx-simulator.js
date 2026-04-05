/**
 * 微信小程序 API H5 模拟器
 * 让小程序代码能在浏览器中运行
 */

// 模拟 wx 对象
const wx = {
  // 存储
  storage: {},
  
  getStorageSync(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : '';
    } catch(e) {
      return this.storage[key] || '';
    }
  },
  
  setStorageSync(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch(e) {
      this.storage[key] = data;
    }
  },
  
  removeStorageSync(key) {
    try {
      localStorage.removeItem(key);
    } catch(e) {}
    delete this.storage[key];
  },
  
  // 网络请求
  request(options) {
    const xhr = new XMLHttpRequest();
    xhr.open(options.method || 'GET', options.url, true);
    
    if (options.header) {
      Object.keys(options.header).forEach(key => {
        xhr.setRequestHeader(key, options.header[key]);
      });
    }
    
    xhr.onload = function() {
      let data;
      try {
        data = JSON.parse(xhr.responseText);
      } catch(e) {
        data = xhr.responseText;
      }
      options.success && options.success({
        statusCode: xhr.status,
        data: data
      });
    };
    
    xhr.onerror = () => options.fail && options.fail({errMsg: 'request:fail'});
    xhr.ontimeout = () => options.fail && options.fail({errMsg: 'request:fail timeout'});
    
    xhr.send(options.data ? JSON.stringify(options.data) : null);
    
    return {
      abort() { xhr.abort(); }
    };
  },
  
  // 下载文件
  downloadFile(options) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', options.url, true);
    xhr.responseType = 'blob';
    
    xhr.onload = function() {
      if (xhr.status === 200) {
        const blob = xhr.response;
        const url = URL.createObjectURL(blob);
        options.success && options.success({
          tempFilePath: url,
          statusCode: xhr.status
        });
      } else {
        options.fail && options.fail({errMsg: 'downloadFile:fail'});
      }
    };
    
    xhr.onerror = () => options.fail && options.fail({errMsg: 'downloadFile:fail'});
    xhr.send();
  },
  
  // 保存图片
  saveImageToPhotosAlbum(options) {
    const link = document.createElement('a');
    link.href = options.filePath;
    link.download = 'image.png';
    link.click();
    options.success && options.success({});
  },
  
  // 预览图片
  previewImage(options) {
    // 创建预览遮罩
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    `;
    
    const img = document.createElement('img');
    img.src = options.urls[options.current || 0];
    img.style.cssText = 'max-width: 100%; max-height: 100%;';
    
    overlay.appendChild(img);
    overlay.onclick = () => document.body.removeChild(overlay);
    document.body.appendChild(overlay);
  },
  
  // 获取图片信息
  getImageInfo(options) {
    const img = new Image();
    img.onload = () => {
      options.success && options.success({
        width: img.width,
        height: img.height,
        path: options.src
      });
    };
    img.onerror = () => options.fail && options.fail({errMsg: 'getImageInfo:fail'});
    img.src = options.src;
  },
  
  // 剪贴板
  setClipboardData(options) {
    navigator.clipboard.writeText(options.data).then(() => {
      options.success && options.success({});
    }).catch(() => {
      // 降级方案
      const input = document.createElement('input');
      input.value = options.data;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      options.success && options.success({});
    });
  },
  
  // Toast
  showToast(options) {
    const toast = document.createElement('div');
    toast.className = 'wx-toast';
    toast.textContent = options.title;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => document.body.removeChild(toast), 300);
    }, options.duration || 1500);
  },
  
  // Loading
  showLoading(options) {
    let loading = document.getElementById('wx-loading');
    if (!loading) {
      loading = document.createElement('div');
      loading.id = 'wx-loading';
      loading.innerHTML = '<div class="wx-loading-spinner"></div><div class="wx-loading-text"></div>';
      document.body.appendChild(loading);
    }
    loading.querySelector('.wx-loading-text').textContent = options.title || '加载中...';
    loading.style.display = 'flex';
  },
  
  hideLoading() {
    const loading = document.getElementById('wx-loading');
    if (loading) loading.style.display = 'none';
  },
  
  // Modal
  showModal(options) {
    const modal = document.createElement('div');
    modal.className = 'wx-modal';
    modal.innerHTML = `
      <div class="wx-modal-content">
        <div class="wx-modal-title">${options.title || ''}</div>
        <div class="wx-modal-text">${options.content || ''}</div>
        <div class="wx-modal-btns">
          ${options.showCancel !== false ? `<button class="wx-modal-cancel">${options.cancelText || '取消'}</button>` : ''}
          <button class="wx-modal-confirm">${options.confirmText || '确定'}</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('.wx-modal-confirm').onclick = () => {
      document.body.removeChild(modal);
      options.success && options.success({ confirm: true, cancel: false });
    };
    
    if (options.showCancel !== false) {
      modal.querySelector('.wx-modal-cancel').onclick = () => {
        document.body.removeChild(modal);
        options.success && options.success({ confirm: false, cancel: true });
      };
    }
  },
  
  // Action Sheet
  showActionSheet(options) {
    const sheet = document.createElement('div');
    sheet.className = 'wx-action-sheet';
    sheet.innerHTML = `
      <div class="wx-action-sheet-mask"></div>
      <div class="wx-action-sheet-content">
        ${options.itemList.map((item, i) => `<div class="wx-action-sheet-item" data-index="${i}">${item}</div>`).join('')}
        <div class="wx-action-sheet-cancel">取消</div>
      </div>
    `;
    
    document.body.appendChild(sheet);
    
    sheet.querySelectorAll('.wx-action-sheet-item').forEach(item => {
      item.onclick = () => {
        document.body.removeChild(sheet);
        options.success && options.success({ 
          tapIndex: parseInt(item.dataset.index),
          cancel: false 
        });
      };
    });
    
    sheet.querySelector('.wx-action-sheet-cancel').onclick = () => {
      document.body.removeChild(sheet);
      options.success && options.success({ cancel: true });
    };
    
    sheet.querySelector('.wx-action-sheet-mask').onclick = () => {
      document.body.removeChild(sheet);
      options.success && options.success({ cancel: true });
    };
  },
  
  // 页面导航
  navigateTo(options) {
    window.router && window.router.navigateTo(options.url);
  },
  
  redirectTo(options) {
    window.router && window.router.redirectTo(options.url);
  },
  
  switchTab(options) {
    window.router && window.router.switchTab(options.url);
  },
  
  navigateBack(options) {
    window.router && window.router.navigateBack(options.delta || 1);
  },
  
  // 获取用户信息
  getUserInfo(options) {
    // H5环境下模拟用户信息
    const userInfo = wx.getStorageSync('userInfo') || {
      nickName: '用户' + Math.floor(Math.random() * 10000),
      avatarUrl: './images/default-avatar.png',
      gender: 0
    };
    options.success && options.success({ userInfo });
  },
  
  // 获取系统信息
  getSystemInfoSync() {
    return {
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      platform: 'h5'
    };
  },
  
  // 云开发（H5模拟）
  cloud: {
    callFunction(options) {
      console.log('[Cloud Function]', options.name, options.data);
      // 模拟云函数调用
      setTimeout(() => {
        options.success && options.success({
          result: { code: 0, message: 'success', data: {} }
        });
      }, 500);
    }
  }
};

// 页面生命周期模拟
const Page = (config) => {
  return config;
};

const App = (config) => {
  window.appConfig = config;
  return config;
};

const getApp = () => {
  return window.appConfig || {};
};

// Component 模拟
const Component = (config) => {
  return config;
};
