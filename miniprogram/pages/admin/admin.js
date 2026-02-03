const api = require('../../utils/api.js');

Page({
  data: {
    activeTab: 'applications',
    applications: [],
    stalls: [],
    feedbacks: [],
    loading: false,
    statusFilter: 0
  },

  onLoad() {
    this.loadData();
  },

  // 切换标签
  onTabChange(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      activeTab: tab,
      statusFilter: 0
    });
    this.loadData();
  },

  // 加载数据
  async loadData() {
    this.setData({ loading: true });

    try {
      switch (this.data.activeTab) {
        case 'applications':
          await this.loadApplications();
          break;
        case 'stalls':
          await this.loadStalls();
          break;
        case 'feedbacks':
          await this.loadFeedbacks();
          break;
      }
    } catch (err) {
      console.error('加载数据失败', err);
    }

    this.setData({ loading: false });
  },

  // 加载申请列表
  async loadApplications() {
    try {
      const result = await api.adminGetApplications({
        status: this.data.statusFilter
      });
      this.setData({ applications: result.data || [] });
    } catch (err) {
      console.error('加载申请失败', err);
    }
  },

  // 加载地摊列表
  async loadStalls() {
    try {
      const db = wx.cloud.database();
      const query = this.data.statusFilter === 0 ? { status: 1 }
        : this.data.statusFilter === 1 ? { status: 2 }
        : { status: 3 };

      const res = await db.collection('stalls')
        .where(query)
        .orderBy('updateTime', 'desc')
        .get();
      this.setData({ stalls: res.data || [] });
    } catch (err) {
      console.error('加载地摊失败', err);
    }
  },

  // 加载反馈列表
  async loadFeedbacks() {
    try {
      const db = wx.cloud.database();
      const query = this.data.statusFilter === 0 ? { status: 0 }
        : this.data.statusFilter === 1 ? { status: 1 }
        : { status: 2 };

      const res = await db.collection('feedbacks')
        .where(query)
        .orderBy('createTime', 'desc')
        .get();
      this.setData({ feedbacks: res.data || [] });
    } catch (err) {
      console.error('加载反馈失败', err);
    }
  },

  // 切换状态筛选
  onStatusFilter(e) {
    const status = e.currentTarget.dataset.status;
    this.setData({
      statusFilter: status
    });
    this.loadData();
  },

  // 审核申请
  onAuditApplication(e) {
    const id = e.currentTarget.dataset.id;
    const action = e.currentTarget.dataset.action;

    wx.showModal({
      title: action === 'approve' ? '通过申请' : '拒绝申请',
      content: '确认要' + (action === 'approve' ? '通过' : '拒绝') + '这个申请吗？',
      success: async (res) => {
        if (res.confirm) {
          await this.doAuditApplication(id, action);
        }
      }
    });
  },

  // 执行审核
  async doAuditApplication(id, action) {
    try {
      await api.auditApplication({
        applicationId: id,
        status: action === 'approve' ? 1 : 2
      });
      wx.showToast({
        title: '操作成功',
        icon: 'success'
      });
      this.loadData();
    } catch (err) {
      console.error('审核失败', err);
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      });
    }
  },

  // 地摊操作
  onStallAction(e) {
    const id = e.currentTarget.dataset.id;
    const action = e.currentTarget.dataset.action;

    switch (action) {
      case 'offline':
        this.offlineStall(id);
        break;
      case 'online':
        this.onlineStall(id);
        break;
      case 'confirm':
        this.confirmStall(id);
        break;
    }
  },

  // 下线地摊
  async offlineStall(id) {
    try {
      await api.offlineStall(id);
      wx.showToast({ title: '已下线', icon: 'success' });
      this.loadData();
    } catch (err) {
      wx.showToast({ title: '操作失败', icon: 'none' });
    }
  },

  // 上架地摊
  async onlineStall(id) {
    try {
      const db = wx.cloud.database();
      await db.collection('stalls').doc(id).update({
        data: { status: 1 }
      });
      wx.showToast({ title: '已上架', icon: 'success' });
      this.loadData();
    } catch (err) {
      wx.showToast({ title: '操作失败', icon: 'none' });
    }
  },

  // 确认地摊
  async confirmStall(id) {
    try {
      await api.confirmStall(id);
      wx.showToast({ title: '已确认', icon: 'success' });
      this.loadData();
    } catch (err) {
      wx.showToast({ title: '操作失败', icon: 'none' });
    }
  },

  // 处理反馈
  onHandleFeedback(e) {
    const id = e.currentTarget.dataset.id;
    const action = e.currentTarget.dataset.action;

    wx.showModal({
      title: action === 'mark' ? '标记反馈' : '处理反馈',
      content: '确认要' + (action === 'mark' ? '标记' : '处理') + '这个反馈吗？',
      success: async (res) => {
        if (res.confirm) {
          await this.doHandleFeedback(id, action);
        }
      }
    });
  },

  // 执行反馈处理
  async doHandleFeedback(id, action) {
    try {
      const db = wx.cloud.database();
      await db.collection('feedbacks').doc(id).update({
        data: {
          status: action === 'mark' ? 1 : 2,
          processedAt: new Date()
        }
      });
      wx.showToast({
        title: '操作成功',
        icon: 'success'
      });
      this.loadData();
    } catch (err) {
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      });
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadData().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 导航到合规页面
  onNavigate(e) {
    const url = e.currentTarget.dataset.url;
    wx.navigateTo({
      url: url
    });
  }
});

