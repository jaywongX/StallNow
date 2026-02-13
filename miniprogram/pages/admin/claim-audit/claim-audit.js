// 认领审核列表页（管理员）
Page({
  data: {
    // 筛选状态：0待审核 1已通过 2已拒绝
    currentStatus: 0,
    statusTabs: [
      { value: 0, label: '待审核', key: 'pending' },
      { value: 1, label: '已通过', key: 'passed' },
      { value: 2, label: '已拒绝', key: 'rejected' }
    ],
    statusStats: {
      pending: 0,
      passed: 0,
      rejected: 0,
      total: 0
    },
    
    // 列表数据
    claims: [],
    loading: false,
    hasMore: true,
    page: 1,
    pageSize: 20,
    
    // 权限检查
    isAdmin: false,
    checkingAuth: true
  },

  onLoad() {
    this.checkAdminAuth();
  },

  onShow() {
    // 每次显示页面时刷新数据
    if (this.data.isAdmin) {
      this.refreshList();
    }
  },

  onPullDownRefresh() {
    this.refreshList();
    wx.stopPullDownRefresh();
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMore();
    }
  },

  // 检查管理员权限
  async checkAdminAuth() {
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'getUserInfo'
      });

      if (result.code === 0 && result.data.role === 'admin') {
        this.setData({ 
          isAdmin: true,
          checkingAuth: false
        });
        this.refreshList();
      } else {
        this.setData({ checkingAuth: false });
        wx.showModal({
          title: '权限不足',
          content: '您没有管理员权限，无法访问此页面',
          showCancel: false,
          success: () => {
            wx.navigateBack();
          }
        });
      }
    } catch (err) {
      console.error('检查权限失败', err);
      this.setData({ checkingAuth: false });
      wx.showToast({
        title: '检查权限失败',
        icon: 'none'
      });
    }
  },

  // 切换状态筛选
  onStatusChange(e) {
    const status = parseInt(e.currentTarget.dataset.status);
    if (status !== this.data.currentStatus) {
      this.setData({ 
        currentStatus: status,
        page: 1,
        claims: [],
        hasMore: true
      });
      this.loadClaims();
    }
  },

  // 刷新列表
  refreshList() {
    this.setData({
      page: 1,
      claims: [],
      hasMore: true
    });
    this.loadClaims();
  },

  // 加载认领申请列表
  async loadClaims() {
    if (this.data.loading) return;

    this.setData({ loading: true });

    try {
      const { result } = await wx.cloud.callFunction({
        name: 'getClaimApplications',
        data: {
          status: this.data.currentStatus,
          page: this.data.page,
          pageSize: this.data.pageSize,
          isAdmin: true
        }
      });

      if (result.code === 0) {
        const { list, total, hasMore, statusStats } = result.data;
        
        this.setData({
          claims: this.data.page === 1 ? list : [...this.data.claims, ...list],
          hasMore: hasMore,
          statusStats: statusStats || this.data.statusStats,
          loading: false
        });
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      console.error('加载失败', err);
      wx.showToast({
        title: err.message || '加载失败',
        icon: 'none'
      });
      this.setData({ loading: false });
    }
  },

  // 加载更多
  loadMore() {
    this.setData({ page: this.data.page + 1 });
    this.loadClaims();
  },

  // 跳转到审核详情
  onGoToDetail(e) {
    const claimId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/admin/claim-detail/claim-detail?id=${claimId}`
    });
  },

  // 格式化时间
  formatTime(timeStr) {
    if (!timeStr) return '';
    const date = new Date(timeStr);
    const now = new Date();
    const diff = now - date;
    
    // 1小时内
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return minutes < 1 ? '刚刚' : `${minutes}分钟前`;
    }
    
    // 24小时内
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours}小时前`;
    }
    
    // 其他显示日期
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  }
});
