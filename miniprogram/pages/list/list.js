const api = require('../../utils/api.js');

Page({
  data: {
    // 筛选条件
    selectedCategory: '',
    selectedTime: '',
    keyword: '',

    // 数据
    stalls: [],
    categories: [],
    loading: false,
    hasMore: true,
    page: 1,
    pageSize: 10
  },

  onLoad() {
    this.initData();
  },

  // 初始化
  async initData() {
    await this.loadCategories();
    await this.loadStalls();
  },

  // 加载分类
  async loadCategories() {
    try {
      const db = wx.cloud.database();
      const res = await db.collection('categories')
        .orderBy('sort', 'asc')
        .get();
      this.setData({
        categories: res.data || []
      });
    } catch (err) {
      console.error('加载分类失败', err);
    }
  },

  // 加载地摊列表
  async loadStalls() {
    if (this.data.loading || !this.data.hasMore) return;

    this.setData({ loading: true });

    try {
      const app = getApp();
      const options = {
        city: app.globalData.currentCity || '汕尾市',
        categoryId: this.data.selectedCategory,
        timeType: this.data.selectedTime,
        keyword: this.data.keyword,
        page: this.data.page,
        pageSize: this.data.pageSize
      };

      const result = await api.getStalls(options);
      const newStalls = result.data || [];
      console.log('[DEBUG list] 加载到的摊位数量:', newStalls.length);
      if (newStalls.length > 0) {
        console.log('[DEBUG list] 第一条摊位数据:', newStalls[0]);
        console.log('[DEBUG list] 第一条摊位的_id:', newStalls[0]._id);
      }

      this.setData({
        stalls: this.data.page === 1 ? newStalls : [...this.data.stalls, ...newStalls],
        loading: false,
        hasMore: newStalls.length >= this.data.pageSize,
        page: this.data.page + 1
      });
    } catch (err) {
      console.error('加载地摊失败', err);
      this.setData({ loading: false });
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }
  },

  // 搜索
  onSearch(e) {
    this.setData({
      keyword: e.detail.value,
      page: 1,
      stalls: []
    });
    this.loadStalls();
  },

  // 选择分类
  onCategorySelect(e) {
    this.setData({
      selectedCategory: e.detail.id,
      page: 1,
      stalls: [],
      hasMore: true
    }, () => {
      this.loadStalls();
    });
  },

  // 选择时间
  onTimeSelect(e) {
    this.setData({
      selectedTime: e.detail.type,
      page: 1,
      stalls: [],
      hasMore: true
    }, () => {
      this.loadStalls();
    });
  },

  // 点击地摊卡片
  onStallTap(e) {
    const stallId = e.currentTarget.dataset.id;
    console.log('[DEBUG list] 点击卡片，stallId:', stallId);
    
    if (!stallId) {
      console.error('[DEBUG list] 无效的摊位ID');
      wx.showToast({ title: '数据错误', icon: 'none' });
      return;
    }
    
    wx.navigateTo({
      url: `/pages/detail/detail?id=${stallId}`
    });
  },

  // 触底加载更多
  onReachBottom() {
    this.loadStalls();
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({
      page: 1,
      stalls: []
    });
    this.loadStalls().then(() => {
      wx.stopPullDownRefresh();
    });
  }
});
