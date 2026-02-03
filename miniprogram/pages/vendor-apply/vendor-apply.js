// 摊主入驻申请表单
Page({
    data: {
        // 表单数据
        form: {
            categoryId: '',
            categoryName: '',
            goodsTags: [],
            location: null,  // 定位位置 {latitude, longitude, name, address}
            address: '',     // 常出没区域（可选）
            scheduleTypes: [],
            displayName: '',
            phone: '',
            wechatId: ''
        },
        
        // 定位状态
        locationName: '',
        isLocating: false,
        
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
        
        // 时间选项
        scheduleOptions: [
            { id: 'afternoon', name: '下午', icon: '🌤' },
            { id: 'evening', name: '晚上', icon: '🌙' },
            { id: 'weekend', name: '周末', icon: '📅' },
            { id: 'unfixed', name: '不固定', icon: '🔄' }
        ],
        
        // 当前显示的商品标签
        currentGoodsOptions: [],
        
        // 表单验证
        errors: {}
    },

    onLoad() {
        // 页面加载，不自动获取定位，等待用户手动选择
    },

    // 选择摊位位置（用户点击后弹出地图）
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
                locationName: chooseRes.name || chooseRes.address || '已选择位置',
                errors: {}  // 清除错误提示
            });
        } catch (err) {
            console.error('选择位置失败', err);
            // 用户取消选择时不显示错误
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

    // 选择分类
    onCategorySelect(e) {
        const { id, name } = e.currentTarget.dataset;
        const goodsOptions = this.data.goodsOptions[id] || [];
        
        this.setData({
            'form.categoryId': id,
            'form.categoryName': name,
            'form.goodsTags': [],
            currentGoodsOptions: goodsOptions,
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

    // 输入常出没区域
    onAddressInput(e) {
        this.setData({
            'form.address': e.detail.value
        });
    },

    // 选择时间
    onScheduleSelect(e) {
        const { id } = e.currentTarget.dataset;
        const { scheduleTypes } = this.data.form;
        
        let newTypes;
        if (scheduleTypes.includes(id)) {
            newTypes = scheduleTypes.filter(t => t !== id);
        } else {
            newTypes = [...scheduleTypes, id];
        }
        
        this.setData({
            'form.scheduleTypes': newTypes
        });
    },

    // 输入摊位名称
    onNameInput(e) {
        this.setData({
            'form.displayName': e.detail.value
        });
    },

    // 输入电话
    onPhoneInput(e) {
        this.setData({
            'form.phone': e.detail.value
        });
    },

    // 输入微信号
    onWechatInput(e) {
        this.setData({
            'form.wechatId': e.detail.value
        });
    },

    // 验证表单
    validateForm() {
        const { form } = this.data;
        const errors = {};
        
        if (!form.categoryId) {
            errors.category = '请选择摊位类型';
        }
        
        if (form.goodsTags.length === 0) {
            errors.goods = '请至少选择一个商品标签';
        }
        
        // 定位位置为必填
        if (!form.location) {
            errors.location = '请选择摊位定位位置';
        }
        
        // 常出没区域改为可选
        if (form.scheduleTypes.length === 0) {
            errors.schedule = '请至少选择一个出摊时间';
        }
        
        this.setData({ errors });
        return Object.keys(errors).length === 0;
    },

    // 提交申请
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
            
            // 调用云函数提交申请
            const { result } = await wx.cloud.callFunction({
                name: 'submitApplication',
                data: {
                    stallData: {
                        categoryId: form.categoryId,
                        categoryName: form.categoryName,
                        goodsTags: form.goodsTags,
                        location: form.location,       // 定位位置（必选）
                        address: form.address,         // 常出没区域（可选）
                        scheduleTypes: form.scheduleTypes,
                        displayName: form.displayName,
                        contact: {
                            phone: form.phone,
                            wechatId: form.wechatId
                        }
                    }
                }
            });
            
            wx.hideLoading();
            
            if (result.code === 0) {
                wx.showModal({
                    title: '提交成功',
                    content: '我们会在1-2个工作日内完成审核，请耐心等待',
                    showCancel: false,
                    success: () => {
                        // 返回摊主专区
                        wx.navigateBack();
                    }
                });
            } else {
                throw new Error(result.message);
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
