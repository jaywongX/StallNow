// 认领审核详情页（管理员）
Page({
  data: {
    claimId: '',
    claim: null,
    loading: true,
    
    // 审核弹窗
    showAuditModal: false,
    auditAction: '', // 'pass' 或 'reject'
    auditRemark: '',
    canConfirm: true, // 是否可以确认（拒绝时需要填写原因）
    auditing: false,
    
    // 权限检查
    isAdmin: false
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ claimId: options.id });
      this.checkAdminAuth();
    } else {
      wx.showToast({
        title: '参数错误',
        icon: 'none'
      });
      wx.navigateBack();
    }
  },

  // 检查管理员权限
  async checkAdminAuth() {
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'getUserInfo'
      });

      if (result.code === 0 && result.data.role === 'admin') {
        this.setData({ isAdmin: true });
        this.loadClaimDetail();
      } else {
        wx.showModal({
          title: '权限不足',
          content: '您没有管理员权限',
          showCancel: false,
          success: () => {
            wx.navigateBack();
          }
        });
      }
    } catch (err) {
      console.error('检查权限失败', err);
      wx.showToast({
        title: '检查权限失败',
        icon: 'none'
      });
    }
  },

  // 加载认领申请详情
  async loadClaimDetail() {
    this.setData({ loading: true });

    try {
      // 直接通过 ID 获取认领申请详情（云函数已转换图片链接）
      const { result } = await wx.cloud.callFunction({
        name: 'getClaimApplications',
        data: {
          claimId: this.data.claimId,
          isAdmin: true
        }
      });

      if (result.code === 0 && result.data.claim) {
        const claim = result.data.claim;

        // 获取摊位详细信息
        const stallRes = await wx.cloud.callFunction({
          name: 'getStallDetail',
          data: { stallId: claim.stallId }
        });

        if (stallRes.result.code === 0) {
          claim.stallDetail = stallRes.result.data;
        }

        this.setData({ 
          claim: claim,
          loading: false
        });
      } else {
        throw new Error(result.message || '认领申请不存在');
      }
    } catch (err) {
      console.error('加载详情失败', err);
      wx.showToast({
        title: err.message || '加载失败',
        icon: 'none'
      });
      this.setData({ loading: false });
    }
  },

  // 预览图片
  onPreviewImage(e) {
    const url = e.currentTarget.dataset.url;
    const urls = e.currentTarget.dataset.urls || [url];
    wx.previewImage({
      current: url,
      urls: urls
    });
  },

  // 阻止事件冒泡（空方法）
  onPreventBubble() {
    // 阻止点击事件冒泡到父元素
  },

  // 显示审核通过弹窗
  onShowPassModal() {
    this.setData({
      showAuditModal: true,
      auditAction: 'pass',
      auditRemark: '',
      canConfirm: true
    });
  },

  // 显示审核拒绝弹窗
  onShowRejectModal() {
    this.setData({
      showAuditModal: true,
      auditAction: 'reject',
      auditRemark: '',
      canConfirm: false
    });
  },

  // 关闭审核弹窗
  onCloseAuditModal() {
    this.setData({
      showAuditModal: false,
      auditAction: '',
      auditRemark: '',
      canConfirm: true
    });
  },

  // 输入审核备注
  onRemarkInput(e) {
    const remark = e.detail.value;
    const canConfirm = this.data.auditAction === 'pass' || remark.trim().length > 0;
    this.setData({ 
      auditRemark: remark,
      canConfirm: canConfirm
    });
  },

  // 确认审核
  async onConfirmAudit() {
    const { auditAction, auditRemark, claimId } = this.data;

    // 拒绝时必须填写原因
    if (auditAction === 'reject' && !auditRemark.trim()) {
      wx.showToast({
        title: '请填写拒绝原因',
        icon: 'none'
      });
      return;
    }

    this.setData({ auditing: true });

    try {
      const { result } = await wx.cloud.callFunction({
        name: 'auditClaimApplication',
        data: {
          claimId: claimId,
          action: auditAction,
          remark: auditRemark.trim()
        }
      });

      if (result.code === 0) {
        wx.showToast({
          title: auditAction === 'pass' ? '审核通过' : '已拒绝',
          icon: 'success'
        });
        
        this.setData({ 
          showAuditModal: false,
          auditing: false
        });

        // 刷新详情
        setTimeout(() => {
          this.loadClaimDetail();
        }, 500);
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      console.error('审核失败', err);
      wx.showToast({
        title: err.message || '审核失败',
        icon: 'none'
      });
      this.setData({ auditing: false });
    }
  },

  // 导航到摊位位置
  onNavigateToStall() {
    const stall = this.data.claim.stallDetail;
    if (stall && stall.location) {
      wx.openLocation({
        latitude: stall.location.latitude,
        longitude: stall.location.longitude,
        name: stall.displayName,
        address: stall.address || ''
      });
    }
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

  // 格式化时间
  formatTime(timeStr) {
    if (!timeStr) return '';
    const date = new Date(timeStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }
});
