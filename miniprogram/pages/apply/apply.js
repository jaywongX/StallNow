const api = require('../../utils/api.js');

Page({
  data: {
    step: 1,
    loading: false,

    // 步骤1：商品类型
    categoryId: '',
    categoryName: '',
    categories: [],

    // 步骤2：外观特征
    landmark: '',

    // 步骤3：出摊位置
    location: null,
    address: '',
    addressDetail: '',

    // 步骤4：出摊时间
    schedule: {
      type: '',
      timeRange: '',
      note: ''
    },
    timeTypes: [
      { value: 'afternoon', label: '下午' },
      { value: 'evening', label: '晚上' },
      { value: 'weekend', label: '周末' },
      { value: 'anytime', label: '不固定' }
    ],

    // 步骤5：联系方式
    contact: {
      hasContact: false,
      phone: '',
      wechatQR: ''
    },

    // 步骤6：商家名称（可选）
    vendorName: ''
  },

  onLoad() {
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

  // 上一步
  prevStep() {
    if (this.data.step > 1) {
      this.setData({ step: this.data.step - 1 });
    }
  },

  // 下一步
  nextStep() {
    if (!this.validateCurrentStep()) return;

    if (this.data.step < 6) {
      this.setData({ step: this.data.step + 1 });
    }
  },

  // 验证当前步骤
  validateCurrentStep() {
    switch (this.data.step) {
      case 1:
        if (!this.data.categoryId) {
          wx.showToast({
            title: '请选择商品类型',
            icon: 'none'
          });
          return false;
        }
        break;
      case 2:
        if (!this.data.landmark.trim()) {
          wx.showToast({
            title: '请填写外观特征',
            icon: 'none'
          });
          return false;
        }
        break;
      case 3:
        if (!this.data.address.trim()) {
          wx.showToast({
            title: '请选择出摊位置',
            icon: 'none'
          });
          return false;
        }
        break;
      case 4:
        if (!this.data.schedule.type) {
          wx.showToast({
            title: '请选择出摊时间',
            icon: 'none'
          });
          return false;
        }
        break;
      case 5:
        // 联系方式为可选，不验证
        break;
      case 6:
        // 商家名称为可选，不验证
        break;
    }
    return true;
  },

  // 选择商品类型
  onCategoryChange(e) {
    const index = e.detail.value;
    const category = this.data.categories[index];
    this.setData({
      categoryId: category._id,
      categoryName: category.name
    });
  },

  // 外观特征输入
  onLandmarkInput(e) {
    this.setData({ landmark: e.detail.value });
  },

  // 选择位置
  onChooseLocation() {
    const that = this;
    wx.chooseLocation({
      success(res) {
        that.setData({
          location: {
            latitude: res.latitude,
            longitude: res.longitude
          },
          address: res.name || res.address,
          addressDetail: res.address
        });
      }
    });
  },

  // 地址详情输入
  onAddressDetailInput(e) {
    this.setData({ addressDetail: e.detail.value });
  },

  // 选择出摊时间类型
  onTimeTypeChange(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      'schedule.type': type
    });
  },

  // 时间范围输入
  onTimeRangeInput(e) {
    this.setData({
      'schedule.timeRange': e.detail.value
    });
  },

  // 时间备注输入
  onTimeNoteInput(e) {
    this.setData({
      'schedule.note': e.detail.value
    });
  },

  // 联系方式开关
  onContactSwitch(e) {
    this.setData({
      'contact.hasContact': e.detail.value
    });
  },

  // 电话输入
  onPhoneInput(e) {
    this.setData({
      'contact.phone': e.detail.value
    });
  },

  // 上传微信二维码
  onUploadQRCode() {
    const that = this;
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success(res) {
        const tempFilePath = res.tempFilePaths[0];
        that.uploadQRCode(tempFilePath);
      }
    });
  },

  // 上传二维码到云存储
  async uploadQRCode(filePath) {
    wx.showLoading({ title: '上传中...' });
    try {
      const cloudPath = `qrcodes/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
      const fileID = await api.uploadImage(filePath, cloudPath);
      this.setData({
        'contact.wechatQR': fileID
      });
      wx.hideLoading();
      wx.showToast({
        title: '上传成功',
        icon: 'success'
      });
    } catch (err) {
      console.error('上传失败', err);
      wx.hideLoading();
      wx.showToast({
        title: '上传失败',
        icon: 'none'
      });
    }
  },

  // 商家名称输入
  onVendorNameInput(e) {
    this.setData({ vendorName: e.detail.value });
  },

  // 提交申请
  async onSubmit() {
    if (!this.validateAllSteps()) return;

    this.setData({ loading: true });
    wx.showLoading({ title: '提交中...' });

    try {
      const stallData = {
        categoryId: this.data.categoryId,
        landmark: this.data.landmark,
        location: this.data.location,
        address: this.data.addressDetail || this.data.address,
        city: '汕尾市',
        schedule: this.data.schedule,
        contact: this.data.contact.hasContact ? {
          hasContact: true,
          phone: this.data.contact.phone,
          wechatQR: this.data.contact.wechatQR
        } : {
          hasContact: false
        },
        vendorName: this.data.vendorName
      };

      await api.submitApplication(stallData);

      wx.hideLoading();
      wx.showToast({
        title: '提交成功',
        icon: 'success',
        duration: 2000
      });

      setTimeout(() => {
        wx.navigateBack();
      }, 2000);
    } catch (err) {
      console.error('提交失败', err);
      wx.hideLoading();
      wx.showToast({
        title: '提交失败',
        icon: 'none'
      });
      this.setData({ loading: false });
    }
  },

  // 验证所有步骤
  validateAllSteps() {
    // 步骤1-4为必填
    if (!this.data.categoryId) {
      wx.showToast({ title: '请选择商品类型', icon: 'none' });
      return false;
    }
    if (!this.data.landmark.trim()) {
      wx.showToast({ title: '请填写外观特征', icon: 'none' });
      return false;
    }
    if (!this.data.address.trim()) {
      wx.showToast({ title: '请选择出摊位置', icon: 'none' });
      return false;
    }
    if (!this.data.schedule.type) {
      wx.showToast({ title: '请选择出摊时间', icon: 'none' });
      return false;
    }
    return true;
  }
});
