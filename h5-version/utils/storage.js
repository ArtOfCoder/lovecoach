/**
 * H5版本 本地存储工具
 */

const Storage = {
  // 获取
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  },

  // 设置
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Storage set error:', e);
      return false;
    }
  },

  // 删除
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      return false;
    }
  },

  // 清空
  clear() {
    try {
      localStorage.clear();
      return true;
    } catch (e) {
      return false;
    }
  },

  // 获取用户档案
  getProfile() {
    return this.get('user_profile', {});
  },

  // 保存用户档案
  setProfile(profile) {
    return this.set('user_profile', profile);
  },

  // 获取AI对话历史
  getChatHistory() {
    return this.get('ai_chat_history', []);
  },

  // 保存AI对话历史
  setChatHistory(history) {
    return this.set('ai_chat_history', history);
  },

  // 获取灵魂伴侣数据
  getSoulmateData() {
    return this.get('soulmate_data', null);
  },

  // 保存灵魂伴侣数据
  setSoulmateData(data) {
    return this.set('soulmate_data', data);
  },

  // 检查是否解锁
  isUnlocked() {
    return this.get('soulmate_unlocked', false);
  },

  // 设置解锁状态
  setUnlocked(unlocked) {
    return this.set('soulmate_unlocked', unlocked);
  }
};

// 导出
window.Storage = Storage;
