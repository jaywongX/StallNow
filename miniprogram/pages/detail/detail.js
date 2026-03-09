const cachedApi = require('../../utils/cached-api.js');

Page({
  data: {
    stallId: '',
    stall: null,
    loading: true,
    showContact: false,
    showContactModal: false,
    showFeedbackModal: false,
    isAdmin: false,
    scheduleDisplay: '', // 格式化后的时间显示
    
    // 收藏引导
    showFavoriteGuide: false,
    isFavorite: false,
    fromScan: false,
    
    // 点赞状态
    isLiked: false,
    likeCount: 0,
    
    // 摊位状态
    isStallActive: true,
    stallStatusText: '',
    
    // 认领状态
    claimStatus: null, // 用户的认领状态
    checkingClaimStatus: false
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
      this.checkLikeStatus();
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
      // 使用带缓存的API
      const result = await cachedApi.getStallDetail(this.data.stallId);
      const stall = result.data;
      
      // 判断摊位状态
      const stallStatus = this.checkStallStatus(stall);
      
      // 格式化时间显示
      const scheduleDisplay = this.formatScheduleDisplay(stall);
      
      this.setData({
        stall: stall,
        isStallActive: stallStatus.isActive,
        stallStatusText: stallStatus.statusText,
        scheduleDisplay: scheduleDisplay,
        loading: false
      });

      // 加载认领状态
      this.loadClaimStatus();
    } catch (err) {
      console.error('加载详情失败', err);
      this.setData({ loading: false });
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }
  },

  // 格式化时间显示
  formatScheduleDisplay(stall) {
    if (!stall.schedule) return '时间待定';
    
    const schedule = stall.schedule;
    const types = schedule.types || [];
    
    // 时间选项名称映射
    const typeNames = {
      'morning': '早上',
      'afternoon': '下午',
      'evening': '晚上',
      'weekend': '周末',
      'unfixed': '不固定'
    };
    
    // 如果选择了不固定且有自定义时间段
    if (types.includes('unfixed') && schedule.customTimeStart && schedule.customTimeEnd) {
      return `${schedule.customTimeStart} - ${schedule.customTimeEnd}`;
    }
    
    // 如果选择了不固定但没有自定义时间段
    if (types.includes('unfixed')) {
      return '时间不固定，请提前联系确认';
    }
    
    // 显示选中的时间段
    if (types.length > 0) {
      const typeLabels = types.map(t => typeNames[t] || t).join('、');
      return typeLabels;
    }
    
    // 兼容旧数据
    return schedule.display || schedule.timeRange || '时间待定';
  },

  // 加载认领状态
  async loadClaimStatus() {
    const stall = this.data.stall;
    if (!stall) return;

    // 情况1：摊主自己申请的摊位，直接判断是否为创建者
    if (stall.createdBy === 'vendor_self') {
      const result = await cachedApi.getUserInfo();
      if (result.code === 0 && result.data && result.data.openid === stall._openid) {
        this.setData({
          claimStatus: { isOwner: true, isCreator: true },
          checkingClaimStatus: false
        });
      }
      return;
    }

    // 情况2：代录入摊位，查询认领状态
    if (stall.createdBy === 'admin_proxy') {
      this.setData({ checkingClaimStatus: true });
      try {
        const { result } = await wx.cloud.callFunction({
          name: 'getMyClaimStatus',
          data: { stallId: this.data.stallId }
        });
        if (result.code === 0) {
          this.setData({
            claimStatus: result.data,
            checkingClaimStatus: false
          });
        }
      } catch (err) {
        console.error('获取认领状态失败', err);
        this.setData({ checkingClaimStatus: false });
      }
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
      await cachedApi.submitFeedback({
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
      await cachedApi.offlineStall(this.data.stallId);
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

  // 检查点赞状态
  async checkLikeStatus() {
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'checkLike',
        data: { stallId: this.data.stallId }
      });
      
      if (result.code === 0) {
        this.setData({
          isLiked: result.data.isLiked,
          likeCount: result.data.likeCount
        });
      }
    } catch (err) {
      console.error('检查点赞状态失败', err);
    }
  },

  // 点赞/取消点赞
  async onToggleLike() {
    try {
      const action = this.data.isLiked ? 'remove' : 'add';
      
      const { result } = await wx.cloud.callFunction({
        name: 'toggleLike',
        data: { 
          stallId: this.data.stallId,
          action
        }
      });
      
      if (result.code === 0) {
        this.setData({
          isLiked: result.data.isLiked,
          likeCount: result.data.likeCount
        });
        
        wx.showToast({
          title: action === 'add' ? '点赞成功' : '已取消',
          icon: 'none'
        });
        
        // 清理缓存
        const cachedApi = require('../../utils/cached-api.js');
        cachedApi.clearStallDetailCache(this.data.stallId);
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      console.error('点赞操作失败', err);
      wx.showToast({
        title: err.message || '操作失败',
        icon: 'none'
      });
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

  // 摊主认领摊位 - 跳转到申请页面
  onClaimStall() {
    wx.navigateTo({
      url: `/pages/claim-apply/claim-apply?stallId=${this.data.stallId}`
    });
  },

  // 重新申请认领
  onReapplyClaim() {
    wx.showModal({
      title: '重新申请',
      content: '您的上次认领申请被拒绝，确认要重新申请吗？',
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({
            url: `/pages/claim-apply/claim-apply?stallId=${this.data.stallId}`
          });
        }
      }
    });
  },

  // 管理摊位
  onManageStall() {
    wx.navigateTo({
      url: `/pages/vendor-manage/vendor-manage?stallId=${this.data.stallId}`
    });
  }
});
