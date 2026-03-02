// 游客推荐摊位表单
Page({
    data: {
        // 表单数据
        form: {
            displayName: '',
            landmark: '',
            categoryId: '',
            categoryName: '',
            goodsTags: [],
            location: null,
            scheduleTypes: [],
            customTimeStart: '',
            customTimeEnd: '',
            images: [],
            phone: ''
        },
        
        // 时间选择器范围
        timePickerRange: ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', 
                         '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
                         '18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '24:00'],
        
        // 分类选项
        categories: [
            { id: 'food_snack', name: '小吃/烧烤', icon: '🍢' },
            { id: 'food_fruit', name: '水果/零食', icon: '🍉' },
            { id: 'handicraft', name: '手工/饰品', icon: '🎨' },
            { id: 'toy_culture', name: '玩具/文创', icon: '🧸' },
            { id: 'other', name: '其他', icon: '📦' }
        ],
        
        // 商品标签选项
        goodsOptions: {
            'food_snack': ['烤串', '炸鸡', '煎饼', '奶茶', '烧烤', '麻辣烫', '臭豆腐', '糖葫芦'],
            'food_fruit': ['水果切', '鲜榨果汁', '坚果', '零食', '糖炒栗子', '烤红薯'],
            'handicraft': ['手链', '耳环', '钥匙扣', '编织品', '手工皂', '香薰', '包包'],
            'toy_culture': ['盲盒', '手办', '文具', '贴纸', '气球', '图书', '小玩具'],
            'other': ['鲜花', '袜子', '手机配件', '日用百货', '二手物品']
        },
        
        // 当前显示的商品标签
        currentGoodsOptions: [],
        
        // 自定义商品输入
        customGoodsInput: '',
        
        // 时间选项
        scheduleOptions: [
            { id: 'afternoon', name: '下午', icon: '🌤' },
            { id: 'evening', name: '晚上', icon: '🌙' },
            { id: 'weekend', name: '周末', icon: '📅' },
            { id: 'unfixed', name: '不固定', icon: '🔄' }
        ],
        
        // 表单验证
        errors: {}
    },

    onLoad() {
        // 页面加载
    },

    // 选择摊位位置
    async onSelectLocation() {
        try {
            const chooseRes = await wx.chooseLocation();
            
            this.setData({
                'form.location': {
                    latitude: chooseRes.latitude,
                    longitude: chooseRes.longitude,
                    name: chooseRes.name,
                    address: chooseRes.address
                },
                errors: {}
            });
        } catch (err) {
            console.error('选择位置失败', err);
            if (err.errMsg && err.errMsg.indexOf('cancel') === -1) {
                wx.showToast({
                    title: '选择位置失败',
                    icon: 'none'
                });
            }
        }
    },

    // 重新选择位置
    onReselectLocation() {
        this.onSelectLocation();
    },

    // 输入摊位名称
    onNameInput(e) {
        this.setData({
            'form.displayName': e.detail.value
        });
    },

    // 输入外观描述
    onLandmarkInput(e) {
        this.setData({
            'form.landmark': e.detail.value
        });
    },

    // 选择分类
    onCategorySelect(e) {
        const { id, name } = e.currentTarget.dataset;
        const goodsOptions = this.data.goodsOptions[id] || [];
        
        this.setData({
            'form.categoryId': id,
            'form.categoryName': name,
            'form.goodsTags': [],
            currentGoodsOptions: goodsOptions,
            customGoodsInput: '',
            errors: {}
        });
    },

    // 选择商品标签
    onGoodsTagSelect(e) {
        const { tag } = e.currentTarget.dataset;
        const { goodsTags } = this.data.form;
        
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
            'form.goodsTags': newTags
        });
    },
    
    // 输入自定义商品
    onCustomGoodsInput(e) {
        this.setData({
            customGoodsInput: e.detail.value
        });
    },
    
    // 添加自定义商品
    onAddCustomGoods() {
        const { customGoodsInput, form } = this.data;
        const trimmedInput = customGoodsInput.trim();
        
        if (!trimmedInput) {
            wx.showToast({
                title: '请输入商品名称',
                icon: 'none'
            });
            return;
        }
        
        if (form.goodsTags.includes(trimmedInput)) {
            wx.showToast({
                title: '该商品已添加',
                icon: 'none'
            });
            return;
        }
        
        if (form.goodsTags.length >= 5) {
            wx.showToast({
                title: '最多选5个',
                icon: 'none'
            });
            return;
        }
        
        this.setData({
            'form.goodsTags': [...form.goodsTags, trimmedInput],
            customGoodsInput: ''
        });
    },

    // 选择出摊时间
    onScheduleSelect(e) {
        const { id } = e.currentTarget.dataset;
        const { scheduleTypes } = this.data.form;
        
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
            'form.scheduleTypes': newTypes,
            // 如果不是不固定，清空自定义时间
            'form.customTimeStart': newTypes.includes('unfixed') ? this.data.form.customTimeStart : '',
            'form.customTimeEnd': newTypes.includes('unfixed') ? this.data.form.customTimeEnd : ''
        });
    },
    
    // 选择自定义开始时间
    onCustomTimeStartChange(e) {
        const index = e.detail.value;
        const time = this.data.timePickerRange[index];
        this.setData({
            'form.customTimeStart': time
        });
    },
    
    // 选择自定义结束时间
    onCustomTimeEndChange(e) {
        const index = e.detail.value;
        const time = this.data.timePickerRange[index];
        this.setData({
            'form.customTimeEnd': time
        });
    },

    // 选择图片
    onChooseImages() {
        const remainCount = 3 - this.data.form.images.length;
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
            const uploadedImages = [...this.data.form.images];

            for (const filePath of filePaths) {
                const compressedPath = await this.compressImage(filePath);
                const fileID = await this.uploadImage(compressedPath);
                uploadedImages.push(fileID);
            }

            this.setData({
                'form.images': uploadedImages
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
                    if (info.width > 800) {
                        const canvasCtx = wx.createCanvasContext('compressCanvas');
                        const ratio = 800 / info.width;
                        const newHeight = info.height * ratio;

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
                        resolve(filePath);
                    }
                },
                fail: reject
            });
        });
    },

    // 上传图片到云存储
    async uploadImage(filePath) {
        const cloudPath = `recommendations/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
        const res = await wx.cloud.uploadFile({
            cloudPath,
            filePath
        });
        return res.fileID;
    },

    // 预览图片
    onPreviewImage(e) {
        const index = e.currentTarget.dataset.index;
        wx.previewImage({
            current: this.data.form.images[index],
            urls: this.data.form.images
        });
    },

    // 删除图片
    onDeleteImage(e) {
        const index = e.currentTarget.dataset.index;
        const images = this.data.form.images.filter((_, i) => i !== index);
        this.setData({
            'form.images': images
        });
    },

    // 输入手机号
    onPhoneInput(e) {
        this.setData({
            'form.phone': e.detail.value
        });
    },

    // 验证表单
    validateForm() {
        const { form } = this.data;
        const errors = {};
        
        if (!form.location) {
            errors.location = '请选择摊位位置';
        }
        
        if (!form.displayName || !form.displayName.trim()) {
            errors.name = '请输入摊位名称';
        }
        
        if (!form.categoryId) {
            errors.category = '请选择摊位类型';
        }
        
        if (form.goodsTags.length === 0) {
            errors.goods = '请至少选择一个商品标签';
        }
        
        this.setData({ errors });
        return Object.keys(errors).length === 0;
    },

    // 提交推荐
    async onSubmit() {
        if (!this.validateForm()) {
            wx.showToast({
                title: '请完善必填信息',
                icon: 'none'
            });
            return;
        }
        
        try {
            wx.showLoading({ title: '提交中...', mask: true });
            
            const { form } = this.data;
            
            // 构建出摊时间数据
            let scheduleData = {
                types: form.scheduleTypes
            };
            
            // 如果有自定义时间，添加到数据中
            if (form.scheduleTypes.includes('unfixed') && form.customTimeStart && form.customTimeEnd) {
                scheduleData.customTime = `${form.customTimeStart} - ${form.customTimeEnd}`;
                scheduleData.customTimeStart = form.customTimeStart;
                scheduleData.customTimeEnd = form.customTimeEnd;
            }
            
            // 调用云函数提交推荐
            const { result } = await wx.cloud.callFunction({
                name: 'submitStallRecommendation',
                data: {
                    stallData: {
                        displayName: form.displayName.trim(),
                        landmark: form.landmark.trim(),
                        categoryId: form.categoryId,
                        categoryName: form.categoryName,
                        goodsTags: form.goodsTags,
                        location: form.location,
                        scheduleTypes: form.scheduleTypes,
                        schedule: scheduleData,
                        images: form.images,
                        contact: {
                            phone: form.phone
                        }
                    }
                }
            });
            
            wx.hideLoading();
            
            if (result && result.code === 0) {
                wx.showModal({
                    title: '推荐成功',
                    content: '感谢你为平台贡献内容！我们会尽快审核，审核通过后将上架展示。',
                    showCancel: false,
                    success: () => {
                        wx.navigateBack();
                    }
                });
            } else {
                throw new Error(result && result.message ? result.message : '提交失败，请稍后重试');
            }
        } catch (err) {
            wx.hideLoading();
            console.error('提交失败', err);
            wx.showToast({
                title: err.message || '提交失败',
                icon: 'error'
            });
        }
    }
});
