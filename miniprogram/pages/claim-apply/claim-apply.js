// 摊位认领申请页面
const { uploadImage, compressImage } = require('../../utils/api.js');

Page({
  data: {
    stallId: '',
    stallInfo: null,
    
    // 当前步骤：1基本信息 2证明材料 3确认提交
    currentStep: 1,
    
    // 基本信息
    realName: '',
    phone: '',
    wechatId: '',
    
    // 证明材料
    stallPhotos: [], // 摊位照片（必填1-3张）
    idCardPhoto: '', // 身份证照片（可选）
    
    // 确认勾选
    agreementChecked: false,
    
    // 状态
    loading: false,
    submitting: false,
    
    // 错误提示
    errors: {}
  },

  onLoad(options) {
    if (options.stallId) {
      this.setData({ stallId: options.stallId });
      this.loadStallInfo();
    } else {
      wx.showToast({
        title: '参数错误',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  // 加载摊位信息
  async loadStallInfo() {
    this.setData({ loading: true });
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'getStallDetail',
        data: { stallId: this.data.stallId }
      });

      if (result.code === 0) {
        this.setData({
          stallInfo: result.data,
          loading: false
        });
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      console.error('加载摊位信息失败', err);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
      this.setData({ loading: false });
    }
  },

  // 基本信息输入
  onRealNameInput(e) {
    this.setData({ 
      realName: e.detail.value,
      'errors.realName': ''
    });
  },

  onPhoneInput(e) {
    this.setData({ 
      phone: e.detail.value,
      'errors.phone': ''
    });
  },

  onWechatIdInput(e) {
    this.setData({ wechatId: e.detail.value });
  },

  // 验证基本信息
  validateStep1() {
    const errors = {};
    const { realName, phone } = this.data;

    if (!realName || realName.trim().length < 2) {
      errors.realName = '请填写真实姓名（至少2个字）';
    }

    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      errors.phone = '请输入正确的手机号码';
    }

    this.setData({ errors });
    return Object.keys(errors).length === 0;
  },

  // 下一步
  onNextStep() {
    if (this.data.currentStep === 1) {
      if (this.validateStep1()) {
        this.setData({ currentStep: 2 });
      }
    } else if (this.data.currentStep === 2) {
      // 验证证明材料
      if (this.data.stallPhotos.length === 0) {
        wx.showToast({
          title: '请至少上传1张摊位照片',
          icon: 'none'
        });
        return;
      }
      this.setData({ currentStep: 3 });
    }
  },

  // 上一步
  onPrevStep() {
    this.setData({ currentStep: this.data.currentStep - 1 });
  },

  // 上传摊位照片
  async onUploadStallPhoto() {
    const { stallPhotos } = this.data;
    if (stallPhotos.length >= 3) {
      wx.showToast({
        title: '最多上传3张',
        icon: 'none'
      });
      return;
    }

    try {
      const res = await wx.chooseMedia({
        count: 3 - stallPhotos.length,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        camera: 'back'
      });

      wx.showLoading({ title: '上传中...' });

      for (const file of res.tempFiles) {
        // 压缩图片
        const compressed = await compressImage(file.tempFilePath);
        // 上传图片
        const uploadRes = await uploadImage(compressed.tempFilePath || file.tempFilePath, 'claim/');
        
        this.setData({
          stallPhotos: [...this.data.stallPhotos, uploadRes.fileID]
        });
      }

      wx.hideLoading();
    } catch (err) {
      console.error('上传失败', err);
      wx.hideLoading();
      wx.showToast({
        title: '上传失败',
        icon: 'none'
      });
    }
  },

  // 删除摊位照片
  onDeleteStallPhoto(e) {
    const index = e.currentTarget.dataset.index;
    const stallPhotos = this.data.stallPhotos.filter((_, i) => i !== index);
    this.setData({ stallPhotos });
  },

  // 预览照片
  onPreviewPhoto(e) {
    const url = e.currentTarget.dataset.url;
    wx.previewImage({
      current: url,
      urls: this.data.stallPhotos
    });
  },

  // 上传身份证照片（可选）
  async onUploadIdCard() {
    try {
      const res = await wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera']
      });

      wx.showLoading({ title: '上传中...' });

      const file = res.tempFiles[0];
      const compressed = await compressImage(file.tempFilePath);
      const uploadRes = await uploadImage(compressed.tempFilePath || file.tempFilePath, 'claim/');

      this.setData({ idCardPhoto: uploadRes.fileID });
      wx.hideLoading();
    } catch (err) {
      console.error('上传失败', err);
      wx.hideLoading();
      wx.showToast({
        title: '上传失败',
        icon: 'none'
      });
    }
  },

  // 删除身份证照片
  onDeleteIdCard() {
    this.setData({ idCardPhoto: '' });
  },

  // 勾选协议
  onAgreementChange(e) {
    this.setData({
      agreementChecked: e.detail.value.length > 0
    });
  },

  // 提交申请
  async onSubmit() {
    if (!this.data.agreementChecked) {
      wx.showToast({
        title: '请确认信息真实有效',
        icon: 'none'
      });
      return;
    }

    const {
      stallId,
      realName,
      phone,
      wechatId,
      stallPhotos,
      idCardPhoto
    } = this.data;

    this.setData({ submitting: true });

    try {
      const { result } = await wx.cloud.callFunction({
        name: 'submitClaimApplication',
        data: {
          stallId,
          realName: realName.trim(),
          phone,
          wechatId: wechatId.trim(),
          stallPhotos,
          idCardPhoto
        }
      });

      if (result.code === 0) {
        wx.showToast({
          title: '提交成功',
          icon: 'success'
        });
        // 跳转到成功页面或返回
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      console.error('提交失败', err);
      wx.showToast({
        title: err.message || '提交失败',
        icon: 'none'
      });
    } finally {
      this.setData({ submitting: false });
    }
  }
});
