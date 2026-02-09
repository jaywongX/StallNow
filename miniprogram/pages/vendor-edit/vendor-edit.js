// 编辑摊位信息页面
const app = getApp();

Page({
    data: {
        stallId: '',
        
        // 表单数据
        form: {
            categoryId: '',
            categoryName: '',
            goodsTags: [],
            address: '',     // 常出没区域
            scheduleTypes: [],
            customTimeStart: '',
            customTimeEnd: '',
            displayName: '',
            phone: '',
            wechatId: '',
            images: []
        },
        
        // 原始数据（用于比较变化）
        originalForm: {},
        
        // 时间选项
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
        
        // 分类选项（只读，不能修改）
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
        
        // 页面状态
        loading: true,
        saving: false,
        hasChanged: false,
        
        // 表单验证
        errors: {}
    },
    
    onLoad(options) {
        if (!options.id) {
            wx.showToast({ title: '参数错误', icon: 'error' });
            wx.navigateBack();
            return;
        }
        this.setData({ stallId: options.id });
        this.loadStallData();
    },
    
    // 加载摊位数据
    async loadStallData() {
        try {
            this.setData({ loading: true });
            
            const { result } = await wx.cloud.callFunction({
                name: 'getStallDetail',
                data: { stallId: this.data.stallId }
            });
            
            if (result.code === 0 && result.data) {
                const stall = result.data;
                
                // 构建表单数据
                const form = {
                    categoryId: stall.categoryId || '',
                    categoryName: stall.categoryName || '',
                    goodsTags: stall.goodsTags || [],
                    address: stall.address || '',
                    scheduleTypes: stall.scheduleTypes || [],
                    customTimeStart: stall.schedule?.customTimeStart || '',
                    customTimeEnd: stall.schedule?.customTimeEnd || '',
                    displayName: stall.displayName || '',
                    phone: stall.contact?.phone || '',
                    wechatId: stall.contact?.wechatId || '',
                    images: stall.images || []
                };
                
                // 获取当前分类的商品选项
                const currentGoodsOptions = this.data.goodsOptions[form.categoryId] || [];
                
                // 获取分类图标
                const category = this.data.categories.find(c => c.id === form.categoryId);
                const categoryIcon = category ? category.icon : '📦';
                
                this.setData({
                    form,
                    originalForm: JSON.parse(JSON.stringify(form)),
                    currentGoodsOptions,
                    categoryIcon,
                    loading: false
                });
            } else {
                throw new Error(result.message || '加载失败');
            }
        } catch (err) {
            console.error('加载摊位数据失败', err);
            wx.showToast({ title: err.message || '加载失败', icon: 'error' });
            this.setData({ loading: false });
        }
    },
    
    // 判断是否选择了"不固定"
    hasUnfixedSelected() {
        return this.data.form.scheduleTypes.includes('unfixed');
    },
    
    // 判断商品标签是否选中（供WXML使用）
    isGoodsTagSelected(tag) {
        return this.data.form.goodsTags.includes(tag);
    },
    
    // 判断出摊时间是否选中（供WXML使用）
    isScheduleSelected(id) {
        return this.data.form.scheduleTypes.includes(id);
    },
    
    // 检查是否有修改
    checkChanges() {
        const formStr = JSON.stringify(this.data.form);
        const originalStr = JSON.stringify(this.data.originalForm);
        this.setData({ hasChanged: formStr !== originalStr });
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
                wx.showToast({ title: '最多选5个', icon: 'none' });
                return;
            }
            newTags = [...goodsTags, tag];
        }
        
        this.setData({
            'form.goodsTags': newTags
        }, () => this.checkChanges());
    },
    
    // 输入常出没区域
    onAddressInput(e) {
        this.setData({
            'form.address': e.detail.value
        }, () => this.checkChanges());
    },
    
    // 选择时间
    onScheduleSelect(e) {
        const { id } = e.currentTarget.dataset;
        const { scheduleTypes } = this.data.form;
        
        let newTypes;
        if (scheduleTypes.includes(id)) {
            newTypes = scheduleTypes.filter(t => t !== id);
        } else {
            if (id === 'unfixed') {
                newTypes = ['unfixed'];
            } else {
                newTypes = scheduleTypes.filter(t => t !== 'unfixed');
                newTypes.push(id);
            }
        }
        
        this.setData({
            'form.scheduleTypes': newTypes,
            'form.customTimeStart': newTypes.includes('unfixed') ? this.data.form.customTimeStart : '',
            'form.customTimeEnd': newTypes.includes('unfixed') ? this.data.form.customTimeEnd : ''
        }, () => this.checkChanges());
    },
    
    // 选择自定义开始时间
    onCustomTimeStartChange(e) {
        const index = e.detail.value;
        const time = this.data.timePickerRange[index];
        this.setData({
            'form.customTimeStart': time
        }, () => this.checkChanges());
    },
    
    // 选择自定义结束时间
    onCustomTimeEndChange(e) {
        const index = e.detail.value;
        const time = this.data.timePickerRange[index];
        this.setData({
            'form.customTimeEnd': time
        }, () => this.checkChanges());
    },
    
    // 输入摊位名称
    onNameInput(e) {
        this.setData({
            'form.displayName': e.detail.value
        }, () => this.checkChanges());
    },
    
    // 输入电话
    onPhoneInput(e) {
        this.setData({
            'form.phone': e.detail.value
        }, () => this.checkChanges());
    },
    
    // 输入微信号
    onWechatInput(e) {
        this.setData({
            'form.wechatId': e.detail.value
        }, () => this.checkChanges());
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
            }, () => {
                this.checkChanges();
                wx.hideLoading();
                wx.showToast({ title: '上传成功', icon: 'success' });
            });
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
                                success: (res) => resolve(res.tempFilePath),
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
        const cloudPath = `stalls/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
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
        }, () => this.checkChanges());
    },
    
    // 验证表单
    validateForm() {
        const { form } = this.data;
        const errors = {};
        
        if (!form.displayName.trim()) {
            errors.displayName = '请输入摊位名称';
        }
        
        if (form.goodsTags.length === 0) {
            errors.goods = '请至少选择一个商品标签';
        }
        
        if (form.scheduleTypes.length === 0) {
            errors.schedule = '请至少选择一个出摊时间';
        }
        
        if (form.scheduleTypes.includes('unfixed')) {
            if (!form.customTimeStart || !form.customTimeEnd) {
                errors.schedule = '请选择自定义时间段';
            }
        }
        
        this.setData({ errors });
        return Object.keys(errors).length === 0;
    },
    
    // 保存修改
    async onSave() {
        if (!this.validateForm()) {
            wx.showToast({ title: '请完善必填信息', icon: 'none' });
            return;
        }
        
        if (!this.data.hasChanged) {
            wx.showToast({ title: '没有需要保存的修改', icon: 'none' });
            return;
        }
        
        try {
            this.setData({ saving: true });
            wx.showLoading({ title: '保存中...', mask: true });
            
            const { form, stallId } = this.data;
            
            // 构建出摊时间数据
            let scheduleData = {
                types: form.scheduleTypes
            };
            
            if (form.scheduleTypes.includes('unfixed') && form.customTimeStart && form.customTimeEnd) {
                scheduleData.customTime = `${form.customTimeStart} - ${form.customTimeEnd}`;
                scheduleData.customTimeStart = form.customTimeStart;
                scheduleData.customTimeEnd = form.customTimeEnd;
            }
            
            const { result } = await wx.cloud.callFunction({
                name: 'updateStall',
                data: {
                    stallId,
                    updateData: {
                        displayName: form.displayName,
                        goodsTags: form.goodsTags,
                        address: form.address,
                        scheduleTypes: form.scheduleTypes,
                        schedule: scheduleData,
                        images: form.images,
                        contact: {
                            phone: form.phone,
                            wechatId: form.wechatId
                        }
                    }
                }
            });
            
            wx.hideLoading();
            this.setData({ saving: false });
            
            if (result.code === 0) {
                wx.showModal({
                    title: '保存成功',
                    content: '摊位信息已更新',
                    showCancel: false,
                    success: () => {
                        wx.navigateBack();
                    }
                });
            } else {
                throw new Error(result.message || '保存失败');
            }
        } catch (err) {
            wx.hideLoading();
            this.setData({ saving: false });
            console.error('保存失败', err);
            wx.showToast({
                title: err.message || '保存失败',
                icon: 'error'
            });
        }
    },
    
    // 取消编辑
    onCancel() {
        if (this.data.hasChanged) {
            wx.showModal({
                title: '确认放弃',
                content: '您有未保存的修改，确定要放弃吗？',
                success: (res) => {
                    if (res.confirm) {
                        wx.navigateBack();
                    }
                }
            });
        } else {
            wx.navigateBack();
        }
    }
});
