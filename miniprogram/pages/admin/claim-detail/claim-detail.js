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
      // 获取认领申请详情
      const { result } = await wx.cloud.callFunction({
        name: 'getClaimApplications',
        data: {
          isAdmin: true,
          page: 1,
          pageSize: 1
        }
      });

      if (result.code === 0) {
        // 在当前列表中找到对应的申请
        const claim = result.data.list.find(item => item._id === this.data.claimId);
        
        if (claim) {
          // 获取摊位详细信息
          const stallRes = await wx.cloud.callFunction({
            name: 'getStallDetail',
            data: { stallId: claim.stallId }
          });

          if (stallRes.result.code === 0) {
            claim.stallDetail = stallRes.result.data;
          }

          // 获取云存储图片的临时链接
          await this.loadImageTempUrls(claim);

          this.setData({ 
            claim: claim,
            loading: false
          });
        } else {
          throw new Error('认领申请不存在');
        }
      } else {
        throw new Error(result.message);
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

  // 获取云存储图片的临时链接
  async loadImageTempUrls(claim) {
    // 收集所有需要转换的 fileID
    const fileIds = [];
    
    // 摊位照片
    if (claim.stallPhotos && claim.stallPhotos.length > 0) {
      claim.stallPhotos.forEach(id => {
        if (id && id.startsWith('cloud://')) {
          fileIds.push(id);
        }
      });
    }
    
    // 身份证照片
    if (claim.idCardPhoto && claim.idCardPhoto.startsWith('cloud://')) {
      fileIds.push(claim.idCardPhoto);
    }
    
    // 如果没有需要转换的，直接返回
    if (fileIds.length === 0) {
      return;
    }
    
    try {
      const { fileList } = await wx.cloud.getTempFileURL({
        fileList: fileIds
      });
      
      // 创建映射表
      const urlMap = {};
      if (fileList) {
        fileList.forEach(item => {
          if (item.tempFileURL) {
            urlMap[item.fileID] = item.tempFileURL;
          }
        });
      }
      
      // 替换为临时链接
      if (claim.stallPhotos) {
        claim.stallPhotos = claim.stallPhotos.map(id => urlMap[id] || id);
      }
      if (claim.idCardPhoto) {
        claim.idCardPhoto = urlMap[claim.idCardPhoto] || claim.idCardPhoto;
      }
    } catch (err) {
      console.error('获取图片临时链接失败', err);
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

  // 显示审核通过弹窗
  onShowPassModal() {
    this.setData({
      showAuditModal: true,
      auditAction: 'pass',
      auditRemark: ''
    });
  },

  // 显示审核拒绝弹窗
  onShowRejectModal() {
    this.setData({
      showAuditModal: true,
      auditAction: 'reject',
      auditRemark: ''
    });
  },

  // 关闭审核弹窗
  onCloseAuditModal() {
    this.setData({
      showAuditModal: false,
      auditAction: '',
      auditRemark: ''
    });
  },

  // 输入审核备注
  onRemarkInput(e) {
    this.setData({ auditRemark: e.detail.value });
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
