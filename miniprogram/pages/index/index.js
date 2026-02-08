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
    showFilter: false,
    cityNoticeShown: false
  },

  async onLoad() {
    await this.initData();
    // 等待城市检查完成后显示提示
    this.checkCityAfterReady();
  },

  onShow() {
    // 城市检查在onLoad中处理，这里只检查是否已有结果
    if (this.cityCheckReady) {
      this.checkCity();
    }
  },

  // 等待城市检查完成后显示提示
  async checkCityAfterReady() {
    const app = getApp();
    
    // 如果有Promise，等待检查完成
    if (app.globalData.cityCheckPromise) {
      await app.globalData.cityCheckPromise;
    }
    
    this.cityCheckReady = true;
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
    const app = getApp();
    const { CITY_CONFIG } = app;
    
    try {
      const res = await wx.getLocation({
        type: 'gcj02'
      });
      
      // 保存用户实际位置
      app.globalData.userLocation = {
        latitude: res.latitude,
        longitude: res.longitude
      };
      
      // 如果开启了多城市支持或城市已支持，使用用户位置
      if (CITY_CONFIG.multiCityEnabled || app.globalData.isCitySupported) {
        that.setData({
          latitude: res.latitude,
          longitude: res.longitude
        });
      } else {
        // 使用默认位置
        that.setData({
          latitude: CITY_CONFIG.defaultCity.location.latitude,
          longitude: CITY_CONFIG.defaultCity.location.longitude
        });
      }
    } catch (err) {
      console.error('获取位置失败', err);
      // 使用默认位置
      that.setData({
        latitude: CITY_CONFIG.defaultCity.location.latitude,
        longitude: CITY_CONFIG.defaultCity.location.longitude
      });
    }
  },

  // 检查城市并显示提示
  async checkCity() {
    const app = getApp();
    const { CITY_CONFIG } = app;
    
    // 如果开启了多城市支持，不显示提示
    if (CITY_CONFIG.multiCityEnabled) {
      return;
    }
    
    // 如果自动切换了城市，显示提示
    if (app.globalData.citySwitched && !this.data.cityNoticeShown) {
      this.setData({ cityNoticeShown: true });
      
      wx.showModal({
        title: '已为您切换城市',
        content: `目前仅在汕尾市开放，已为您切换到${CITY_CONFIG.defaultCity.name}${CITY_CONFIG.defaultCity.district}${CITY_CONFIG.defaultCity.address}`,
        showCancel: false,
        confirmText: '知道了',
        success: () => {
          // 使用默认位置
          this.setData({
            latitude: CITY_CONFIG.defaultCity.location.latitude,
            longitude: CITY_CONFIG.defaultCity.location.longitude
          });
          // 重新加载摊位
          this.setData({ page: 1, stalls: [], markers: [] });
          this.loadStalls();
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
    console.log('[DEBUG] 开始加载摊位列表...');

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
      console.log('[DEBUG] getStalls 请求参数:', options);

      const result = await api.getStalls(options);
      console.log('[DEBUG] getStalls 返回结果:', result);
      const newStalls = result.data || [];

      // 构建地图标记（id 必须是数字）
      let markerId = 1;
      const newMarkers = newStalls.map(stall => ({
        id: markerId++,  // 使用数字ID
        _stallId: stall._id,  // 保存原始ID用于跳转
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
    const markerId = e.detail.markerId;
    // 通过 markerId 查找对应的摊位ID
    const marker = this.data.markers.find(m => m.id === markerId);
    if (marker && marker._stallId) {
      wx.navigateTo({
        url: `/pages/detail/detail?id=${marker._stallId}`
      });
    }
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
