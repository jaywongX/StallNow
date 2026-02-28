// 获取应用实例
const cachedApi = require('../../utils/cached-api.js');

Page({
  data: {
    // 地图相关
    latitude: 0,
    longitude: 0,
    markers: [],
    showMap: true,
    // 用户实际位置（用于距离计算）
    userLatitude: null,
    userLongitude: null,

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
    cityNoticeShown: false,
    
    // 标记卡片预览
    showMarkerCard: false,
    selectedStall: null,
    
    // 欢迎弹窗
    showWelcomeModal: false,
    tempNickname: ''
  },
  
  // 分类对应的颜色
  categoryColors: {
    'food_snack': '#FF6B35',   // 小吃/烧烤 - 暖橙色
    'food_fruit': '#52C41A',   // 水果/零食 - 绿色
    'handicraft': '#722ED1',   // 手工/饰品 - 紫色
    'toy_culture': '#1890FF',  // 玩具/文创 - 蓝色
    'other': '#999999'         // 其他 - 灰色
  },

  async onLoad() {
    await this.initData();
    // 等待城市检查完成后显示提示
    this.checkCityAfterReady();
    // 检查是否需要显示欢迎弹窗
    this.checkWelcomeModal();
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
    // 地图视图：加载所有摊位用于标记
    await this.loadAllStallsForMap();
  },

  // 加载所有摊位用于地图标记（不分页）
  async loadAllStallsForMap() {
    if (this.data.loading) return Promise.resolve();
    
    this.setData({ loading: true });

    try {
      const app = getApp();
      const options = {
        city: app.globalData.currentCity || '汕尾市',
        categoryId: this.data.selectedCategory,
        timeType: this.data.selectedTime,
        keyword: this.data.keyword,
        page: 1,
        pageSize: 500  // 一次性加载最多500个
      };

      const result = await cachedApi.getStalls(options);
      const newStalls = result.data || [];

      // 处理摊位数据
      newStalls.forEach(stall => {
        stall.scheduleDisplay = this.formatScheduleDisplay(stall);
        if (this.data.userLatitude) {
          stall.distance = Math.round(this.calculateDistance(
            this.data.userLatitude,
            this.data.userLongitude,
            stall.location.latitude,
            stall.location.longitude
          ));
        }
      });

      // 构建地图标记
      let markerId = 1;
      const newMarkers = newStalls.map(stall => {
        const categoryColor = this.categoryColors[stall.categoryId] || '#FF6B35';
        const shortName = stall.displayName.length > 5 
          ? stall.displayName.substring(0, 5) + '...' 
          : stall.displayName;
        return {
          id: markerId++,
          _stallId: stall._id,
          latitude: stall.location.latitude,
          longitude: stall.location.longitude,
          iconPath: '/images/marker.png',
          width: 36,
          height: 36,
          anchor: { x: 0.5, y: 1 },
          label: {
            content: shortName,
            color: '#333',
            fontSize: 12,
            anchorX: 0,
            anchorY: -38,
            bgColor: '#fff',
            padding: 6,
            borderWidth: 1,
            borderColor: categoryColor,
            borderRadius: 6,
            textAlign: 'center'
          },
          callout: {
            content: `${stall.displayName}\n${stall.categoryName || '其他'}`,
            color: '#333',
            fontSize: 14,
            borderRadius: 8,
            bgColor: '#fff',
            padding: 10,
            display: 'BYCLICK',
            borderWidth: 2,
            borderColor: categoryColor,
            anchorX: 0,
            anchorY: 0
          }
        };
      });
      
      this.setData({
        stalls: newStalls,
        markers: newMarkers,
        loading: false,
        hasMore: newStalls.length >= 500,
        page: 2
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

  // 加载地摊列表（用于列表视图的分页加载）
  async loadStalls(forceRefresh = false) {
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

      const result = await cachedApi.getStalls(options, { forceRefresh });
      const newStalls = result.data || [];

      // 处理摊位数据
      newStalls.forEach(stall => {
        stall.scheduleDisplay = this.formatScheduleDisplay(stall);
        if (this.data.userLatitude) {
          stall.distance = Math.round(this.calculateDistance(
            this.data.userLatitude,
            this.data.userLongitude,
            stall.location.latitude,
            stall.location.longitude
          ));
        }
      });

      // 追加到列表（列表视图分页）
      this.setData({
        stalls: [...this.data.stalls, ...newStalls],
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
      
      // 保存用户位置用于距离计算
      const userLocation = {
        userLatitude: res.latitude,
        userLongitude: res.longitude
      };
      
      // 如果开启了多城市支持或城市已支持，使用用户位置
      if (CITY_CONFIG.multiCityEnabled || app.globalData.isCitySupported) {
        that.setData({
          latitude: res.latitude,
          longitude: res.longitude,
          ...userLocation
        });
      } else {
        // 使用默认位置显示地图，但保留用户实际位置用于距离计算
        that.setData({
          latitude: CITY_CONFIG.defaultCity.location.latitude,
          longitude: CITY_CONFIG.defaultCity.location.longitude,
          ...userLocation
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
      markers: [],
      hasMore: true
    });
    this.loadAllStallsForMap();
  },

  // 加载分类
  async loadCategories() {
    try {
      // 使用带缓存的API获取分类数据
      const result = await cachedApi.getCategories();
      this.setData({
        categories: result.data || []
      });
    } catch (err) {
      console.error('加载分类失败', err);
    }
  },

  // 加载地摊列表
  async loadStalls(forceRefresh = false) {
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

      // 使用带缓存的API
      const result = await cachedApi.getStalls(options, { forceRefresh });
      const newStalls = result.data || [];

      // 处理摊位数据，添加显示的字段
      newStalls.forEach(stall => {
        // 处理出摊时间显示
        stall.scheduleDisplay = this.formatScheduleDisplay(stall);
        // 计算距离
        if (this.data.userLatitude) {
          stall.distance = Math.round(this.calculateDistance(
            this.data.userLatitude,
            this.data.userLongitude,
            stall.location.latitude,
            stall.location.longitude
          ));
        }
      });

      // 构建地图标记（id 必须是数字）
      let markerId = 1;
      const newMarkers = newStalls.map(stall => {
        const categoryColor = this.categoryColors[stall.categoryId] || '#FF6B35';
        // 截取摊位名称（前5个字+省略号）
        const shortName = stall.displayName.length > 5 
          ? stall.displayName.substring(0, 5) + '...' 
          : stall.displayName;
        return {
          id: markerId++,  // 使用数字ID
          _stallId: stall._id,  // 保存原始ID用于跳转
          latitude: stall.location.latitude,
          longitude: stall.location.longitude,
          // 使用 marker.png，增大尺寸
          iconPath: '/images/marker.png',
          width: 36,
          height: 36,
          anchor: { x: 0.5, y: 1 },  // 锚点设置在底部中心
          // label 显示摊位名称（常显）
          label: {
            content: shortName,
            color: '#333',
            fontSize: 12,
            anchorX: 0,
            anchorY: -38,  // 向上偏移，避免遮挡标记
            bgColor: '#fff',
            padding: 6,
            borderWidth: 1,
            borderColor: categoryColor,
            borderRadius: 6,
            textAlign: 'center'
          },
          // 点击后显示详细气泡
          callout: {
            content: `${stall.displayName}\n${stall.categoryName || '其他'}`,
            color: '#333',
            fontSize: 14,
            borderRadius: 8,
            bgColor: '#fff',
            padding: 10,
            display: 'BYCLICK',  // 点击时显示
            borderWidth: 2,
            borderColor: categoryColor,
            anchorX: 0,
            anchorY: 0
          }
        };
      });
      
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
      page: 1,
      stalls: [],
      markers: [],
      hasMore: true
    });
    this.loadAllStallsForMap();
  },

  // 选择分类
  onCategorySelect(e) {
    this.setData({
      selectedCategory: e.detail.id,
      page: 1,
      stalls: [],
      markers: [],
      hasMore: true
    }, () => {
      this.loadAllStallsForMap();
    });
  },

  // 选择时间
  onTimeSelect(e) {
    this.setData({
      selectedTime: e.detail.type,
      page: 1,
      stalls: [],
      markers: [],
      hasMore: true
    }, () => {
      this.loadAllStallsForMap();
    });
  },

  // 地图标记点击 - 显示卡片预览
  onMarkerTap(e) {
    const markerId = e.detail.markerId;
    
    if (!markerId) {
      console.error('无效的 markerId');
      return;
    }
    
    // 通过 markerId 查找对应的 marker
    const marker = this.data.markers.find(m => m.id === markerId);
    if (!marker) {
      console.error('未找到对应的 marker, markerId:', markerId);
      return;
    }
    
    // 查找对应的摊位
    const stall = this.data.stalls.find(s => s._id === marker._stallId);
    
    if (stall) {
      // 获取分类图标
      const category = this.data.categories.find(c => c.id === stall.categoryId);
      const categoryIcon = category ? category.icon : '🏪';
      
      this.setData({
        showMarkerCard: true,
        selectedStall: { ...stall, categoryIcon }
      });
    } else {
      console.error('未找到对应的摊位, _stallId:', marker._stallId);
    }
  },
  
  // 关闭标记卡片
  onCloseMarkerCard() {
    this.setData({
      showMarkerCard: false,
      selectedStall: null
    });
  },
  
  // 从卡片跳转到详情
  onGoToDetail() {
    const { selectedStall } = this.data;
    if (selectedStall) {
      this.setData({ showMarkerCard: false });
      wx.navigateTo({
        url: `/pages/detail/detail?id=${selectedStall._id}`
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

  // 格式化时间显示
  formatScheduleDisplay(stall) {
    if (!stall.schedule && !stall.scheduleTypes) return '时间待定';
    
    const schedule = stall.schedule || {};
    const types = stall.scheduleTypes || schedule.types || [];
    
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
      return '时间不固定';
    }
    
    // 显示选中的时间段
    if (types.length > 0) {
      const typeLabels = types.map(t => typeNames[t] || t).join('、');
      return typeLabels;
    }
    
    // 兼容旧数据
    if (schedule.customTime) {
      return schedule.customTime;
    }
    
    return schedule.display || schedule.type || '时间待定';
  },

  // 计算两点间距离（米）
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
      markers: [],
      hasMore: true
    });
    // 强制刷新缓存
    cachedApi.clearStallsCache();
    this.loadAllStallsForMap().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 检查是否显示欢迎弹窗
  checkWelcomeModal() {
    const app = getApp();
    // 检查是否是新用户且没有昵称
    if (app.globalData.isNewUser) {
      // 延迟显示，避免和城市提示冲突
      setTimeout(() => {
        this.setData({ showWelcomeModal: true });
      }, 1000);
    }
  },

  // 昵称输入
  onNicknameInput(e) {
    this.setData({
      tempNickname: e.detail.value
    });
  },

  // 确认昵称
  async onConfirmNickname() {
    const { tempNickname } = this.data;
    
    if (!tempNickname || !tempNickname.trim()) {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none'
      });
      return;
    }
    
    try {
      wx.showLoading({ title: '保存中...' });
      
      await wx.cloud.callFunction({
        name: 'updateUserInfo',
        data: { nickName: tempNickname.trim() }
      });
      
      // 更新全局状态
      const app = getApp();
      app.globalData.isNewUser = false;
      if (app.globalData.userInfo) {
        app.globalData.userInfo.nickName = tempNickname.trim();
      }
      
      wx.hideLoading();
      
      this.setData({ showWelcomeModal: false });
      
      wx.showToast({
        title: '欢迎加入',
        icon: 'success'
      });
    } catch (err) {
      wx.hideLoading();
      console.error('保存昵称失败', err);
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      });
    }
  },

  // 跳过欢迎
  onSkipWelcome() {
    this.setData({ showWelcomeModal: false });
    // 标记不再提示
    const app = getApp();
    app.globalData.isNewUser = false;
  }
});
