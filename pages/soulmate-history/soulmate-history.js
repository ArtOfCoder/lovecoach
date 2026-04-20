// pages/soulmate-history/soulmate-history.js
// 星座配对历史记录页面

const storage = require('../../utils/storage')

Page({
  data: {
    history: [],
    loading: true,
    emptyText: '暂无历史记录',
  },

  onShow() {
    this.loadHistory()
  },

  loadHistory() {
    this.setData({ loading: true })
    
    // 只获取已解锁的记录
    const history = storage.getSoulmateHistory(true)
    
    // 格式化数据
    const formattedHistory = history.map(item => ({
      ...item,
      formattedDate: this.formatDate(item.createTime),
      formattedTime: this.formatTime(item.createTime),
      displayImage: item.soulmate?.imageUrl || item.imageUrl,
    }))
    
    this.setData({
      history: formattedHistory,
      loading: false,
      emptyText: formattedHistory.length === 0 ? '暂无测试记录\n快去做星座配对测试吧' : '',
    })
  },

  formatDate(timestamp) {
    const date = new Date(timestamp)
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  },

  formatTime(timestamp) {
    const date = new Date(timestamp)
    const h = String(date.getHours()).padStart(2, '0')
    const m = String(date.getMinutes()).padStart(2, '0')
    return `${h}:${m}`
  },

  // 查看详情
  viewDetail(e) {
    const { id } = e.currentTarget.dataset
    const record = storage.getSoulmateRecordById(id)
    if (!record) {
      wx.showToast({ title: '记录不存在', icon: 'none' })
      return
    }
    
    // 跳转到详情页或显示弹窗
    wx.navigateTo({
      url: `/pages/soulmate-detail/soulmate-detail?id=${id}`,
    })
  },

  // 长按保存图片
  onLongPressImage(e) {
    const { url } = e.currentTarget.dataset
    if (!url) return
    
    wx.showActionSheet({
      itemList: ['保存图片到相册', '预览图片'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.saveImage(url)
        } else if (res.tapIndex === 1) {
          wx.previewImage({
            current: url,
            urls: [url],
          })
        }
      },
    })
  },

  // 保存图片
  saveImage(imageUrl) {
    if (!imageUrl) {
      wx.showToast({ title: '图片不存在', icon: 'none' })
      return
    }

    wx.showLoading({ title: '保存中...' })

    // 判断是本地路径还是网络 URL
    const isLocalFile = imageUrl.startsWith('wxfile://') || imageUrl.startsWith('http://tmp') || (!imageUrl.startsWith('http'))

    const doSave = (filePath) => {
      wx.saveImageToPhotosAlbum({
        filePath,
        success: () => {
          wx.hideLoading()
          wx.showToast({ title: '已保存到相册', icon: 'success' })
        },
        fail: (err) => {
          wx.hideLoading()
          if (err.errMsg && err.errMsg.includes('auth deny')) {
            wx.showModal({
              title: '需要相册权限',
              content: '请在设置中允许访问相册',
              confirmText: '去设置',
              success: (r) => {
                if (r.confirm) wx.openSetting()
              },
            })
          } else {
            wx.showToast({ title: '保存失败，请重试', icon: 'none' })
          }
        },
      })
    }

    if (isLocalFile) {
      doSave(imageUrl)
    } else {
      wx.downloadFile({
        url: imageUrl,
        success: (res) => {
          if (res.statusCode === 200) {
            doSave(res.tempFilePath)
          } else {
            wx.hideLoading()
            wx.showToast({ title: '下载失败，请重试', icon: 'none' })
          }
        },
        fail: (err) => {
          wx.hideLoading()
          console.error('[保存图片] 下载失败:', err)
          wx.showToast({ title: '下载失败，请检查网络', icon: 'none' })
        },
      })
    }
  },

  // 删除单条记录
  deleteRecord(e) {
    const { id } = e.currentTarget.dataset
    wx.showModal({
      title: '删除记录',
      content: '确定要删除这条记录吗？删除后无法恢复。',
      confirmColor: '#FF6B8A',
      success: (res) => {
        if (res.confirm) {
          storage.deleteSoulmateRecord(id)
          this.loadHistory()
          wx.showToast({ title: '已删除', icon: 'success' })
        }
      },
    })
  },

  // 清空所有记录
  clearAll() {
    if (this.data.history.length === 0) {
      wx.showToast({ title: '没有可删除的记录', icon: 'none' })
      return
    }
    
    wx.showModal({
      title: '清空记录',
      content: '确定要清空所有历史记录吗？此操作不可恢复。',
      confirmColor: '#FF6B8A',
      success: (res) => {
        if (res.confirm) {
          storage.clearSoulmateHistory()
          this.loadHistory()
          wx.showToast({ title: '已清空', icon: 'success' })
        }
      },
    })
  },

  // 重新测算
  goToSoulmate() {
    wx.navigateTo({ url: '/pages/soulmate/soulmate' })
  },

  onShareAppMessage() {
    return {
      title: '我的星座配对测试记录',
      path: '/pages/soulmate-history/soulmate-history',
    }
  },
})
