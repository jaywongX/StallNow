const api = require('../../utils/api.js');

Page({
  data: {
    // 筛选条件
    selectedCategory: '',
    selectedCategoryName: '分类',
    selectedTime: '',
    selectedDistance: '', // 距离筛选：''附近, 500, 1000, 3000
    selectedDistanceName: '附近',
    keyword: '',
    sortBy: 'default', // default, distance, activity
    filterConfirmed: false, // 只看近期确认的
    
    // 筛选弹窗
    showFilterModal: false,
    
    // 用户位置
    userLatitude: null,
    userLongitude: null,

    // 数据
    stalls: [],
    categories: [],
    loading: false,
    hasMore: true,
    page: 1,
    pageSize: 10,
    
    // 距离选项（美团样式）
    distanceOptions: [
      { value: '', name: '附近' },
      { value: 500, name: '附近500m' },
      { value: 1000, name: '附近1km' },
      { value: 3000, name: '附近3km' },
      { value: -1, name: '全城' }
    ],
    
    // 出摊时间选项
    timeOptions: [
      { value: '', name: '全部时间' },
      { value: 'afternoon', name: '下午' },
      { value: 'evening', name: '晚上' },
      { value: 'weekend', name: '周末' },
      { value: 'unfixed', name: '不固定' }
    ],
    
    // 排序选项
    sortOptions: [
      { id: 'default', name: '智能排序' },
      { id: 'distance', name: '离我最近' },
      { id: 'activity', name: '最近活跃' },
      { id: 'newest', name: '最新上架' }
    ],
    
    // 筛选选项
    filterOptions: [
      { id: 'confirmed', name: '只看近期确认的', checked: false }
    ]
  },

  onLoad() {
    this.initData();
    this.getUserLocation();
  },
  
  // 获取用户位置（用于距离排序）
  async getUserLocation() {
    try {
      const res = await wx.getLocation({ type: 'gcj02' });
      this.setData({
        userLatitude: res.latitude,
        userLongitude: res.longitude
      });
    } catch (err) {
      console.log('获取位置失败，距离排序将不可用');
    }
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
        pageSize: this.data.pageSize,
        sortBy: this.data.sortBy,
        filterConfirmed: this.data.filterConfirmed
      };
      
      // 如果按距离排序或有距离筛选，需要传入用户位置
      if ((this.data.sortBy === 'distance' || this.data.selectedDistance) && this.data.userLatitude) {
        options.latitude = this.data.userLatitude;
        options.longitude = this.data.userLongitude;
      }
      
      // 距离筛选（米）
      if (this.data.selectedDistance && this.data.selectedDistance > 0) {
        options.maxDistance = this.data.selectedDistance;
      }

      const result = await api.getStalls(options);
      let newStalls = result.data || [];
      
      // 计算每个摊位的距离
      if (this.data.userLatitude && newStalls.length > 0) {
        newStalls = newStalls.map(stall => {
          const distance = this.calculateDistance(
            this.data.userLatitude, 
            this.data.userLongitude,
            stall.location.latitude, 
            stall.location.longitude
          );
          return { ...stall, distance: Math.round(distance) };
        });
      }
      
      // 前端距离筛选（如果后端不支持）
      if (this.data.selectedDistance && this.data.selectedDistance > 0 && this.data.userLatitude) {
        newStalls = newStalls.filter(stall => stall.distance <= this.data.selectedDistance);
      }
      
      // 前端距离排序（如果后端不支持）
      if (this.data.sortBy === 'distance' && this.data.userLatitude && newStalls.length > 0) {
        newStalls = this.sortByDistance(newStalls);
      }
      
      // 活跃度排序（最近确认时间）
      if (this.data.sortBy === 'activity' && newStalls.length > 0) {
        newStalls = this.sortByActivity(newStalls);
      }
      
      // 最新上架排序
      if (this.data.sortBy === 'newest' && newStalls.length > 0) {
        newStalls = this.sortByNewest(newStalls);
      }
      
      // 筛选只看近期确认的
      if (this.data.filterConfirmed) {
        newStalls = newStalls.filter(stall => stall.reliability === 0);
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
  
  // 按距离排序
  sortByDistance(stalls) {
    const { userLatitude, userLongitude } = this.data;
    if (!userLatitude || !userLongitude) return stalls;
    
    return stalls.sort((a, b) => {
      const distA = this.calculateDistance(userLatitude, userLongitude, a.location.latitude, a.location.longitude);
      const distB = this.calculateDistance(userLatitude, userLongitude, b.location.latitude, b.location.longitude);
      return distA - distB;
    });
  },
  
  // 计算两点间距离（简化版）
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // 地球半径（米）
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  },
  
  // 按活跃度排序（最近确认时间）
  sortByActivity(stalls) {
    return stalls.sort((a, b) => {
      const timeA = a.lastConfirmedAt ? new Date(a.lastConfirmedAt).getTime() : 0;
      const timeB = b.lastConfirmedAt ? new Date(b.lastConfirmedAt).getTime() : 0;
      return timeB - timeA; // 降序，最新的在前
    });
  },
  
  // 按最新上架排序
  sortByNewest(stalls) {
    return stalls.sort((a, b) => {
      const timeA = a.createTime ? new Date(a.createTime).getTime() : 0;
      const timeB = b.createTime ? new Date(b.createTime).getTime() : 0;
      return timeB - timeA; // 降序，最新的在前
    });
  },
  
  // 打开距离选择弹窗
  onOpenDistanceFilter() {
    this.setData({ showDistanceModal: true });
  },
  
  // 关闭距离选择弹窗
  onCloseDistanceFilter() {
    this.setData({ showDistanceModal: false });
  },
  
  // 选择距离
  onDistanceSelect(e) {
    const value = e.currentTarget.dataset.value;
    const name = e.currentTarget.dataset.name;
    
    // 检查是否需要位置权限
    if (value && value > 0 && !this.data.userLatitude) {
      wx.showModal({
        title: '需要位置权限',
        content: '距离筛选需要获取您的位置信息',
        confirmText: '去设置',
        success: (res) => {
          if (res.confirm) {
            wx.openSetting();
          }
        }
      });
      return;
    }
    
    this.setData({
      selectedDistance: value,
      selectedDistanceName: name,
      showDistanceModal: false,
      page: 1,
      stalls: [],
      hasMore: true
    }, () => {
      this.loadStalls();
    });
  },
  
  // 打开分类选择弹窗
  onOpenCategoryFilter() {
    this.setData({ showCategoryModal: true });
  },
  
  // 关闭分类选择弹窗
  onCloseCategoryFilter() {
    this.setData({ showCategoryModal: false });
  },
  
  // 选择分类（从弹窗）
  onCategorySelectFromModal(e) {
    const id = e.currentTarget.dataset.id;
    const name = e.currentTarget.dataset.name;
    this.setData({
      selectedCategory: id,
      selectedCategoryName: name || '分类',
      showCategoryModal: false,
      page: 1,
      stalls: [],
      hasMore: true
    }, () => {
      this.loadStalls();
    });
  },
  
  // 选择时间（从弹窗）
  onTimeSelectFromModal(e) {
    const value = e.currentTarget.dataset.value;
    this.setData({
      selectedTime: value
    });
  },
  
  // 打开筛选弹窗
  onOpenFilter() {
    this.setData({ showFilterModal: true });
  },
  
  // 关闭筛选弹窗
  onCloseFilter() {
    this.setData({ showFilterModal: false });
  },
  
  // 选择排序
  onSortSelect(e) {
    const sortBy = e.currentTarget.dataset.id;
    if (sortBy === 'distance' && !this.data.userLatitude) {
      wx.showModal({
        title: '需要位置权限',
        content: '距离排序需要获取您的位置信息',
        confirmText: '去设置',
        success: (res) => {
          if (res.confirm) {
            wx.openSetting();
          }
        }
      });
      return;
    }
    this.setData({ sortBy }, () => {
      this.onFilterApply();
    });
  },
  
  // 切换筛选选项
  onFilterToggle(e) {
    const { id } = e.currentTarget.dataset;
    if (id === 'confirmed') {
      this.setData({ filterConfirmed: !this.data.filterConfirmed });
    }
  },
  
  // 应用筛选
  onFilterApply() {
    this.setData({
      page: 1,
      stalls: [],
      hasMore: true,
      showFilterModal: false
    }, () => {
      this.loadStalls();
    });
  },
  
  // 重置筛选
  onFilterReset() {
    this.setData({
      selectedTime: '',
      sortBy: 'default',
      filterConfirmed: false
    });
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
    
    if (!stallId) {
      console.error('无效的摊位ID');
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
