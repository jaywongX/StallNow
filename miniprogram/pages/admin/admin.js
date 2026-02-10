const api = require('../../utils/api.js');

Page({
  data: {
    activeTab: 'applications',
    applications: [],
    stalls: [],
    feedbacks: [],
    loading: false,
    statusFilter: 0,
    
    // 代录入表单数据
    categories: [],
    scheduleOptions: [
      { id: 'afternoon', name: '下午', icon: '🌤' },
      { id: 'evening', name: '晚上', icon: '🌙' },
      { id: 'weekend', name: '周末', icon: '📅' },
      { id: 'unfixed', name: '不固定', icon: '🔄' }
    ],
    // 时间选择器范围
    timePickerRange: ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', 
                     '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
                     '18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '24:00'],
    // 商品标签选项
    goodsOptions: {
      'food_snack': ['烤串', '炸鸡', '煎饼', '奶茶', '烧烤', '麻辣烫', '臭豆腐', '糖葫芦'],
      'food_fruit': ['水果切', '鲜榨果汁', '坚果', '零食', '糖炒栗子', '烤红薯'],
      'handicraft': ['手链', '耳环', '钥匙扣', '编织品', '手工皂', '香薰', '包包'],
      'toy_culture': ['盲盒', '手办', '文具', '贴纸', '气球', '图书', '小玩具'],
      'other': ['鲜花', '袜子', '手机配件', '日用百货', '二手物品']
    },
    currentGoodsOptions: [],
    proxyForm: {
      displayName: '',
      categoryId: '',
      categoryName: '',
      goodsTags: [],
      landmark: '',
      location: null,
      address: '',
      scheduleTypes: [],
      customTimeStart: '',
      customTimeEnd: '',
      phone: '',
      images: [],
      remark: ''
    },
    errors: {}
  },

  onLoad() {
    this.loadData();
    this.loadCategories();
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
  
  // ========== 代录入相关方法 ==========
  
  // 输入框变更
  onProxyInput(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    this.setData({
      [`proxyForm.${field}`]: value
    });
  },
  
  // 选择分类
  onProxyCategorySelect(e) {
    const { id, name } = e.currentTarget.dataset;
    const goodsOptions = this.data.goodsOptions[id] || [];
    this.setData({
      'proxyForm.categoryId': id,
      'proxyForm.categoryName': name,
      'proxyForm.goodsTags': [],
      currentGoodsOptions: goodsOptions,
      errors: {}
    });
  },
  
  // 选择商品标签
  onProxyGoodsTagSelect(e) {
    const { tag } = e.currentTarget.dataset;
    const { goodsTags } = this.data.proxyForm;
    
    let newTags;
    if (goodsTags.includes(tag)) {
      newTags = goodsTags.filter(t => t !== tag);
    } else {
      if (goodsTags.length >= 5) {
        wx.showToast({
          title: '最多选5个',
          icon: 'none'
        });
        return;
      }
      newTags = [...goodsTags, tag];
    }
    
    this.setData({
      'proxyForm.goodsTags': newTags
    });
  },
  
  // 选择出摊时间
  onProxyScheduleSelect(e) {
    const { id } = e.currentTarget.dataset;
    const { scheduleTypes } = this.data.proxyForm;
    
    let newTypes;
    if (scheduleTypes.includes(id)) {
      // 取消选择
      newTypes = scheduleTypes.filter(t => t !== id);
    } else {
      // 选择"不固定"时，清空其他选择
      if (id === 'unfixed') {
        newTypes = ['unfixed'];
      } else {
        // 选择其他时，如果已选"不固定"则移除
        newTypes = scheduleTypes.filter(t => t !== 'unfixed');
        newTypes.push(id);
      }
    }
    
    this.setData({
      'proxyForm.scheduleTypes': newTypes,
      // 如果不是不固定，清空自定义时间
      'proxyForm.customTimeStart': newTypes.includes('unfixed') ? this.data.proxyForm.customTimeStart : '',
      'proxyForm.customTimeEnd': newTypes.includes('unfixed') ? this.data.proxyForm.customTimeEnd : ''
    });
  },
  
  // 选择自定义开始时间
  onCustomTimeStartChange(e) {
    const index = e.detail.value;
    const time = this.data.timePickerRange[index];
    this.setData({
      'proxyForm.customTimeStart': time
    });
  },
  
  // 选择自定义结束时间
  onCustomTimeEndChange(e) {
    const index = e.detail.value;
    const time = this.data.timePickerRange[index];
    this.setData({
      'proxyForm.customTimeEnd': time
    });
  },
  
  // 选择位置
  async onProxySelectLocation() {
    try {
      const chooseRes = await wx.chooseLocation();
      this.setData({
        'proxyForm.location': {
          latitude: chooseRes.latitude,
          longitude: chooseRes.longitude,
          name: chooseRes.name,
          address: chooseRes.address
        }
      });
    } catch (err) {
      console.error('选择位置失败', err);
    }
  },
  
  // 上传图片
  onProxyUploadImage() {
    const remainCount = 3 - this.data.proxyForm.images.length;
    if (remainCount <= 0) {
      wx.showToast({ title: '最多上传3张图片', icon: 'none' });
      return;
    }

    wx.chooseImage({
      count: remainCount,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.compressAndUploadImages(res.tempFilePaths);
      }
    });
  },

  // 压缩并上传图片
  async compressAndUploadImages(filePaths) {
    wx.showLoading({ title: '处理中...' });

    try {
      const uploadedImages = [...this.data.proxyForm.images];

      for (const filePath of filePaths) {
        // 压缩图片
        const compressedPath = await this.compressImage(filePath);
        // 上传到云存储
        const fileID = await this.uploadImage(compressedPath);
        uploadedImages.push(fileID);
      }

      this.setData({
        'proxyForm.images': uploadedImages
      });
      wx.hideLoading();
      wx.showToast({ title: '上传成功', icon: 'success' });
    } catch (err) {
      console.error('上传图片失败', err);
      wx.hideLoading();
      wx.showToast({ title: '上传失败', icon: 'none' });
    }
  },

  // 压缩图片
  compressImage(filePath) {
    return new Promise((resolve, reject) => {
      wx.getImageInfo({
        src: filePath,
        success: (info) => {
          // 如果图片宽度大于 800px，进行压缩
          if (info.width > 800) {
            const canvasCtx = wx.createCanvasContext('compressCanvas');
            const ratio = 800 / info.width;
            const newHeight = info.height * ratio;

            // 绘制压缩后的图片
            canvasCtx.drawImage(filePath, 0, 0, 800, newHeight);
            canvasCtx.draw(false, () => {
              wx.canvasToTempFilePath({
                canvasId: 'compressCanvas',
                width: 800,
                height: newHeight,
                destWidth: 800,
                destHeight: newHeight,
                fileType: 'jpg',
                quality: 0.8,
                success: (res) => {
                  resolve(res.tempFilePath);
                },
                fail: reject
              });
            });
          } else {
            // 图片尺寸合适，直接返回
            resolve(filePath);
          }
        },
        fail: reject
      });
    });
  },

  // 上传图片到云存储
  async uploadImage(filePath) {
    const cloudPath = `stalls/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
    const res = await wx.cloud.uploadFile({
      cloudPath,
      filePath
    });
    return res.fileID;
  },
  
  // 预览图片
  onProxyPreviewImage(e) {
    const { index } = e.currentTarget.dataset;
    wx.previewImage({
      current: this.data.proxyForm.images[index],
      urls: this.data.proxyForm.images
    });
  },
  
  // 删除图片
  onProxyDeleteImage(e) {
    const { index } = e.currentTarget.dataset;
    const images = this.data.proxyForm.images.filter((_, i) => i !== index);
    this.setData({
      'proxyForm.images': images
    });
  },
  
  // 验证表单
  validateProxyForm() {
    const { proxyForm } = this.data;
    const errors = {};
    
    if (!proxyForm.categoryId) {
      errors.category = '请选择商品类型';
    }
    
    if (proxyForm.goodsTags.length === 0) {
      errors.goods = '请至少选择一个商品标签';
    }
    
    if (!proxyForm.location) {
      errors.location = '请选择摊位定位位置';
    }
    
    if (proxyForm.scheduleTypes.length === 0) {
      errors.schedule = '请至少选择一个出摊时间';
    }
    
    // 如果选择了"不固定"，需要填写自定义时间
    if (proxyForm.scheduleTypes.includes('unfixed')) {
      if (!proxyForm.customTimeStart || !proxyForm.customTimeEnd) {
        errors.schedule = '请选择自定义时间段';
      }
    }
    
    this.setData({ errors });
    return Object.keys(errors).length === 0;
  },

  // 提交代录入
  async onProxySubmit() {
    if (!this.validateProxyForm()) {
      wx.showToast({
        title: '请完善必填信息',
        icon: 'none'
      });
      return;
    }
    
    wx.showLoading({ title: '提交中...', mask: true });
    
    try {
      const { proxyForm } = this.data;
      
      // 构建出摊时间数据
      let scheduleData = {
        types: proxyForm.scheduleTypes
      };
      
      // 如果有自定义时间，添加到数据中
      if (proxyForm.scheduleTypes.includes('unfixed') && proxyForm.customTimeStart && proxyForm.customTimeEnd) {
        scheduleData.customTime = `${proxyForm.customTimeStart} - ${proxyForm.customTimeEnd}`;
        scheduleData.customTimeStart = proxyForm.customTimeStart;
        scheduleData.customTimeEnd = proxyForm.customTimeEnd;
      }
      
      const result = await wx.cloud.callFunction({
        name: 'createStallByAdmin',
        data: {
          stallData: {
            displayName: proxyForm.displayName,
            categoryId: proxyForm.categoryId,
            categoryName: proxyForm.categoryName,
            goodsTags: proxyForm.goodsTags,
            landmark: proxyForm.landmark,
            location: proxyForm.location,
            address: proxyForm.address,
            scheduleTypes: proxyForm.scheduleTypes,
            schedule: scheduleData,
            contact: {
              phone: proxyForm.phone
            },
            images: proxyForm.images,
            remark: proxyForm.remark
          }
        }
      });
      
      wx.hideLoading();
      
      if (result.result.code === 0) {
        wx.showModal({
          title: '录入成功',
          content: '摊位已上架，状态为"营业中（待认领）"',
          showCancel: false,
          success: () => {
            // 重置表单
            this.setData({
              proxyForm: {
                displayName: '',
                categoryId: '',
                categoryName: '',
                goodsTags: [],
                landmark: '',
                location: null,
                address: '',
                scheduleTypes: [],
                customTimeStart: '',
                customTimeEnd: '',
                phone: '',
                images: [],
                remark: ''
              },
              currentGoodsOptions: [],
              errors: {}
            });
            // 切换到摊位管理
            this.setData({ activeTab: 'stalls' });
            this.loadData();
          }
        });
      } else {
        wx.showToast({ title: result.result.message || '录入失败', icon: 'none' });
      }
    } catch (err) {
      console.error('代录入失败', err);
      wx.hideLoading();
      wx.showToast({ title: '录入失败', icon: 'none' });
    }
  },

  // 切换标签
  onTabChange(e) {
    const tab = e.currentTarget.dataset.tab;
    console.log('[DEBUG admin] 切换标签:', tab);
    this.setData({
      activeTab: tab,
      statusFilter: 0
    }, () => {
      console.log('[DEBUG admin] 标签切换完成, activeTab:', this.data.activeTab);
      this.loadData();
    });
  },

  // 加载数据
  async loadData() {
    console.log('[DEBUG admin] loadData, activeTab:', this.data.activeTab, 'statusFilter:', this.data.statusFilter);
    this.setData({ loading: true });

    try {
      switch (this.data.activeTab) {
        case 'applications':
          await this.loadApplications();
          break;
        case 'proxyApply':
          // 代录入页面不需要加载数据，显示表单即可
          break;
        case 'stalls':
          await this.loadStalls();
          break;
        case 'feedbacks':
          await this.loadFeedbacks();
          break;
        default:
          console.error('[DEBUG admin] 未知的activeTab:', this.data.activeTab);
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

      // 为每个申请添加地图标记数据
      const applications = (result.data || []).map(item => {
        if (item.stallData && item.stallData.location) {
          item.mapMarkers = [{
            id: 1,
            latitude: item.stallData.location.latitude,
            longitude: item.stallData.location.longitude,
            title: item.stallData.displayName || '摊位位置',
            iconPath: '/images/marker.png',
            width: 30,
            height: 30
          }];
        }
        return item;
      });

      this.setData({ applications });
    } catch (err) {
      console.error('加载申请失败', err);
    }
  },

  // 加载地摊列表
  async loadStalls() {
    try {
      console.log('[DEBUG admin] loadStalls, statusFilter:', this.data.statusFilter);
      const db = wx.cloud.database();
      const query = this.data.statusFilter == 0 ? { status: 1 }
        : this.data.statusFilter == 1 ? { status: 2 }
        : { status: 3 };
      console.log('[DEBUG admin] loadStalls 查询条件:', query);

      const res = await db.collection('stalls')
        .where(query)
        .orderBy('updateTime', 'desc')
        .get();
      console.log('[DEBUG admin] loadStalls 查询结果:', res.data.length, '条');
      this.setData({ stalls: res.data || [] });
    } catch (err) {
      console.error('加载地摊失败', err);
    }
  },

  // 加载反馈列表
  async loadFeedbacks() {
    console.log('[DEBUG admin] loadFeedbacks, statusFilter:', this.data.statusFilter);
    try {
      const result = await api.getFeedbacks({
        status: this.data.statusFilter
      });
      console.log('[DEBUG admin] getFeedbacks result:', result);

      if (result.code === 0) {
        console.log('[DEBUG admin] 反馈列表数据:', result.data.length, '条');
        this.setData({ feedbacks: result.data || [] });
      } else {
        throw new Error(result.message || '加载失败');
      }
    } catch (err) {
      console.error('加载反馈失败', err);
      wx.showToast({
        title: err.message || '加载反馈失败',
        icon: 'none'
      });
    }
  },

  // 切换状态筛选
  onStatusFilter(e) {
    const status = e.currentTarget.dataset.status;
    console.log('[DEBUG admin] 切换状态筛选，status:', status, '当前activeTab:', this.data.activeTab);
    this.setData({
      statusFilter: parseInt(status)
    }, () => {
      console.log('[DEBUG admin] setData后，activeTab:', this.data.activeTab);
      this.loadData();
    });
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
      const result = await api.auditApplication({
        applicationId: id,
        status: action === 'approve' ? 1 : 2
      });

      // 检查云函数返回的业务状态码
      if (result.code !== 0) {
        throw new Error(result.message || '审核失败');
      }

      wx.showToast({
        title: '操作成功',
        icon: 'success'
      });
      this.loadData();
    } catch (err) {
      console.error('审核失败', err);
      wx.showToast({
        title: err.message || '操作失败',
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
      const result = await api.offlineStall(id);

      // 检查云函数返回的业务状态码
      if (result.code !== 0) {
        throw new Error(result.message || '下线失败');
      }

      wx.showToast({ title: '已下线', icon: 'success' });
      this.loadData();
    } catch (err) {
      wx.showToast({ title: err.message || '操作失败', icon: 'none' });
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
      const result = await api.confirmStall(id);

      // 检查云函数返回的业务状态码
      if (result.code !== 0) {
        throw new Error(result.message || '确认失败');
      }

      wx.showToast({ title: '已确认', icon: 'success' });
      this.loadData();
    } catch (err) {
      wx.showToast({ title: err.message || '操作失败', icon: 'none' });
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
    console.log('[DEBUG admin] 处理反馈, id:', id, 'action:', action);
    try {
      const result = await api.handleFeedback({
        feedbackId: id,
        action: action
      });
      console.log('[DEBUG admin] handleFeedback result:', result);

      if (result.code !== 0) {
        throw new Error(result.message || '操作失败');
      }

      wx.showToast({
        title: '操作成功',
        icon: 'success'
      });

      // 延迟刷新，等待数据库更新完成
      setTimeout(() => {
        this.loadData();
      }, 300);
    } catch (err) {
      console.error('处理反馈失败', err);
      wx.showToast({
        title: err.message || '操作失败',
        icon: 'none'
      });
    }
  },

  // 预览图片
  onPreviewImage(e) {
    const url = e.currentTarget.dataset.url;
    wx.previewImage({
      urls: [url]
    });
  },

  // 预览摊位图片
  onPreviewStallImage(e) {
    const images = e.currentTarget.dataset.images;
    const current = e.currentTarget.dataset.current;
    wx.previewImage({
      current,
      urls: images
    });
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadData().then(() => {
      wx.stopPullDownRefresh();
    });
  }
});

