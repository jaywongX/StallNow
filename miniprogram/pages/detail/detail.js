const api = require('../../utils/api.js');

Page({
  data: {
    stallId: '',
    stall: null,
    loading: true,
    showContact: false,
    showContactModal: false,
    showFeedbackModal: false,
    isAdmin: false,
    
    // 收藏引导
    showFavoriteGuide: false,
    isFavorite: false,
    fromScan: false,
    
    // 摊位状态
    isStallActive: true,
    stallStatusText: ''
  },

  onLoad(options) {
    // 获取管理员状态
    const app = getApp();
    this.setData({
      isAdmin: app.globalData.isAdmin || false
    });

    // 处理扫码进入场景
    // scene 是二维码参数，直接为 stallId
    if (options.scene) {
      const stallId = decodeURIComponent(options.scene);
      if (stallId) {
        this.setData({ 
          stallId: stallId,
          fromScan: true
        });
        this.loadStallDetail();
        this.checkFavoriteStatus();
        return;
      }
    }

    if (options.id) {
      this.setData({ stallId: options.id });
      this.loadStallDetail();
      this.checkFavoriteStatus();
    } else {
      wx.showToast({
        title: '参数错误',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  // 加载地摊详情
  async loadStallDetail() {
    this.setData({ loading: true });

    try {
      const result = await api.getStallDetail(this.data.stallId);
      const stall = result.data;
      
      // 判断摊位状态
      const stallStatus = this.checkStallStatus(stall);
      
      this.setData({
        stall: stall,
        isStallActive: stallStatus.isActive,
        stallStatusText: stallStatus.statusText,
        loading: false
      });
    } catch (err) {
      console.error('加载详情失败', err);
      this.setData({ loading: false });
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }
  },
  
  // 检查摊位状态
  checkStallStatus(stall) {
    // status: 1=正常, 2=下线
    // activeStatus: 'active'=正常, 'inactive'=停用(违规/弃用)
    const status = stall.status;
    const activeStatus = stall.activeStatus;
    
    // 已下线或已停用
    if (status === 2 || activeStatus === 'inactive') {
      return {
        isActive: false,
        statusText: status === 2 ? '该摊位当前未在摆摊' : '该摊位已停用'
      };
    }
    
    return {
      isActive: true,
      statusText: ''
    };
  },

  // 显示联系方式
  onShowContact() {
    this.setData({ showContactModal: true });
  },

  // 确认查看联系方式
  onConfirmContact() {
    this.setData({
      showContact: true,
      showContactModal: false
    });
  },

  // 取消查看联系方式
  onCancelContact() {
    this.setData({ showContactModal: false });
  },

  // 复制联系方式
  onCopyContact(e) {
    const text = e.currentTarget.dataset.text;
    wx.setClipboardData({
      data: text,
      success() {
        wx.showToast({
          title: '已复制',
          icon: 'success'
        });
      }
    });
  },

  // 预览图片
  onPreviewImage(e) {
    const current = e.currentTarget.dataset.src;
    const urls = this.data.stall.images || [];
    wx.previewImage({
      current,
      urls
    });
  },

  // 导航
  onNavigate() {
    const stall = this.data.stall;
    if (!stall || !stall.location) return;

    wx.openLocation({
      latitude: stall.location.latitude,
      longitude: stall.location.longitude,
      name: stall.displayName,
      address: stall.address || ''
    });
  },

  // 显示反馈
  onShowFeedback() {
    this.setData({ showFeedbackModal: true });
  },

  // 提交反馈
  onSubmitFeedback(e) {
    const type = e.currentTarget.dataset.type;
    const that = this;

    wx.showModal({
      title: '确认反馈',
      content: '确认要提交这个反馈吗？',
      success(res) {
        if (res.confirm) {
          that.doSubmitFeedback(type);
        }
      }
    });
  },

  // 执行提交反馈
  async doSubmitFeedback(type) {
    try {
      await api.submitFeedback({
        stallId: this.data.stallId,
        type: type
      });
      wx.showToast({
        title: '感谢反馈',
        icon: 'success'
      });
      this.setData({ showFeedbackModal: false });
    } catch (err) {
      console.error('提交反馈失败', err);
      wx.showToast({
        title: '提交失败',
        icon: 'none'
      });
    }
  },

  // 取消反馈
  onCancelFeedback() {
    this.setData({ showFeedbackModal: false });
  },

  // 我是摊主 - 扫码确认
  onConfirmStall() {
    const that = this;
    wx.showModal({
      title: '摊主确认',
      content: '请扫描摊位二维码确认',
      confirmText: '去扫码',
      success(res) {
        if (res.confirm) {
          wx.scanCode({
            success(scanRes) {
              that.doConfirmStall(scanRes.result);
            }
          });
        }
      }
    });
  },

  // 执行确认摊位
  async doConfirmStall(qrCode) {
    try {
      const result = await api.confirmStall(this.data.stallId);
      if (result.code === 0) {
        wx.showToast({
          title: '确认成功',
          icon: 'success'
        });
        // 刷新详情
        this.loadStallDetail();
      } else {
        throw new Error(result.message || '确认失败');
      }
    } catch (err) {
      console.error('确认失败', err);
      wx.showToast({
        title: err.message || '确认失败',
        icon: 'none'
      });
    }
  },

  // 一键下线
  onOfflineStall() {
    const that = this;
    wx.showModal({
      title: '确认下线',
      content: '确认要下线这个摊位吗？',
      confirmColor: '#F44336',
      success(res) {
        if (res.confirm) {
          that.doOfflineStall();
        }
      }
    });
  },

  // 执行下线
  async doOfflineStall() {
    try {
      await api.offlineStall(this.data.stallId);
      wx.showToast({
        title: '已下线',
        icon: 'success'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } catch (err) {
      console.error('下线失败', err);
      wx.showToast({
        title: '下线失败',
        icon: 'none'
      });
    }
  },

  // 预览微信二维码
  onPreviewQRCode(e) {
    const url = e.currentTarget.dataset.url;
    wx.previewImage({
      current: url,
      urls: [url]
    });
  },

  // 检查收藏状态
  async checkFavoriteStatus() {
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'checkFavorite',
        data: { stallId: this.data.stallId }
      });
      
      if (result.code === 0) {
        const isFavorite = result.data.isFavorite;
        this.setData({ isFavorite });
        
        // 如果是扫码进入且未收藏，显示收藏引导
        if (this.data.fromScan && !isFavorite) {
          // 延迟显示，让用户先看内容
          setTimeout(() => {
            this.setData({ showFavoriteGuide: true });
          }, 1500);
        }
      }
    } catch (err) {
      console.error('检查收藏状态失败', err);
    }
  },

  // 关闭收藏引导
  onCloseFavoriteGuide() {
    this.setData({ showFavoriteGuide: false });
    // 记录已关闭，不再显示
    wx.setStorageSync(`favorite_guide_closed_${this.data.stallId}`, true);
  },

  // 收藏摊位
  async onFavoriteStall() {
    try {
      wx.showLoading({ title: '处理中...' });
      
      const { result } = await wx.cloud.callFunction({
        name: 'toggleFavorite',
        data: { 
          stallId: this.data.stallId,
          action: 'add'
        }
      });
      
      wx.hideLoading();
      
      if (result.code === 0) {
        this.setData({ 
          isFavorite: true,
          showFavoriteGuide: false
        });
        wx.showToast({ title: '收藏成功', icon: 'success' });
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: err.message || '收藏失败', icon: 'none' });
    }
  },

  // 取消收藏
  async onUnfavoriteStall() {
    try {
      wx.showLoading({ title: '处理中...' });
      
      const { result } = await wx.cloud.callFunction({
        name: 'toggleFavorite',
        data: { 
          stallId: this.data.stallId,
          action: 'remove'
        }
      });
      
      wx.hideLoading();
      
      if (result.code === 0) {
        this.setData({ isFavorite: false });
        wx.showToast({ title: '已取消收藏', icon: 'success' });
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: err.message || '操作失败', icon: 'none' });
    }
  },

  // 摊主认领摊位
  async onClaimStall() {
    wx.showModal({
      title: '认领摊位',
      content: '确认这是您的摊位吗？认领后您可以管理这个摊位。',
      confirmText: '确认认领',
      success: async (res) => {
        if (res.confirm) {
          await this.doClaimStall();
        }
      }
    });
  },

  // 执行认领
  async doClaimStall() {
    try {
      wx.showLoading({ title: '处理中...' });
      
      const { result } = await wx.cloud.callFunction({
        name: 'claimStall',
        data: { stallId: this.data.stallId }
      });
      
      wx.hideLoading();
      
      if (result.code === 0) {
        wx.showToast({
          title: '认领成功',
          icon: 'success'
        });
        // 刷新详情
        this.loadStallDetail();
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      wx.hideLoading();
      wx.showToast({
        title: err.message || '认领失败',
        icon: 'none'
      });
    }
  }
});
