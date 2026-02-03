// 获取应用实例
const app = getApp();
const api = require('../../utils/api.js');

Page({
  data: {
    // 地图相关
    latitude: 0,
    longitude: 0,
    markers: [],
    showMap: true,

    // 筛选相关
    selectedCategory: '',
    selectedTime: '',
    keyword: '',

    // 数据相关
    stalls: [],
    categories: [],
    loading: false,
    hasMore: true,
    page: 1,
    pageSize: 10,

    // UI状态
    showList: false,
    showFilter: false
  },

  onLoad() {
    this.initData();
  },

  onShow() {
    // 检查城市支持
    this.checkCity();
  },

  // 初始化数据
  async initData() {
    await this.getLocation();
    await this.loadCategories();
    await this.loadStalls();
  },

  // 获取当前位置
  async getLocation() {
    const that = this;
    try {
      const res = await wx.getLocation({
        type: 'gcj02'
      });
      that.setData({
        latitude: res.latitude,
        longitude: res.longitude
      });
    } catch (err) {
      console.error('获取位置失败', err);
      // 使用默认位置（汕尾市）
      that.setData({
        latitude: 22.7864,
        longitude: 115.3649
      });
    }
  },

  // 检查城市
  async checkCity() {
    const that = this;
    const app = getApp();
    // 当前仅支持汕尾市
    const currentCity = app.globalData.currentCity;
    if (currentCity !== '汕尾市') {
      wx.showModal({
        title: '温馨提示',
        content: '目前仅在汕尾市开放，已为您切换到汕尾市',
        showCancel: false,
        success(res) {
          if (res.confirm) {
            that.switchCity('汕尾市');
          }
        }
      });
    }
  },

  // 切换城市
  switchCity(city) {
    const app = getApp();
    app.globalData.currentCity = city;
    app.globalData.isCitySupported = true;
    // 重置数据并重新加载
    this.setData({
      page: 1,
      stalls: [],
      markers: []
    });
    this.loadStalls();
  },

  // 加载分类
  async loadCategories() {
    try {
      // 从云数据库加载分类数据
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

      // 构建地图标记
      const newMarkers = newStalls.map(stall => ({
        id: stall._id,
        latitude: stall.location.latitude,
        longitude: stall.location.longitude,
        iconPath: '/images/marker.png',
        width: 30,
        height: 30,
        callout: {
          content: stall.displayName,
          color: '#333',
          fontSize: 12,
          borderRadius: 5,
          bgColor: '#fff',
          padding: 5,
          display: 'BYCLICK'
        }
      }));

      this.setData({
        stalls: this.data.page === 1 ? newStalls : [...this.data.stalls, ...newStalls],
        markers: this.data.page === 1 ? newMarkers : [...this.data.markers, ...newMarkers],
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
      page: 1
    });
    this.loadStalls();
  },

  // 选择分类
  onCategorySelect(e) {
    this.setData({
      selectedCategory: e.detail.id,
      page: 1
    });
    this.loadStalls();
  },

  // 选择时间
  onTimeSelect(e) {
    this.setData({
      selectedTime: e.detail.type,
      page: 1
    });
    this.loadStalls();
  },

  // 地图标记点击
  onMarkerTap(e) {
    const stallId = e.detail.markerId;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${stallId}`
    });
  },

  // 点击地摊卡片
  onStallTap(e) {
    const stallId = e.detail.stall._id;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${stallId}`
    });
  },

  // 定位到当前位置
  onLocate() {
    this.getLocation();
  },

  // 切换地图/列表
  onToggleView() {
    this.setData({
      showList: !this.data.showList
    });
  },

  // 显示/隐藏筛选
  onToggleFilter() {
    this.setData({
      showFilter: !this.data.showFilter
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
      stalls: [],
      markers: []
    });
    this.loadStalls().then(() => {
      wx.stopPullDownRefresh();
    });
  }
});
