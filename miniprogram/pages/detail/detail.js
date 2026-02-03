const api = require('../../utils/api.js');

Page({
  data: {
    stallId: '',
    stall: null,
    loading: true,
    showContact: false,
    showContactModal: false,
    showFeedbackModal: false
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ stallId: options.id });
      this.loadStallDetail();
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
      this.setData({
        stall: result.data,
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
      if (result.success) {
        wx.showToast({
          title: '确认成功',
          icon: 'success'
        });
        // 刷新详情
        this.loadStallDetail();
      }
    } catch (err) {
      console.error('确认失败', err);
      wx.showToast({
        title: '确认失败',
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
  }
});
