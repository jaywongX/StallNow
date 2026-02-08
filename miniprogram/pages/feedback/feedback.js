// 意见反馈页面
Page({
    data: {
        // 反馈类型
        feedbackTypes: [
            { id: 'feature', name: '功能建议', icon: '💡' },
            { id: 'bug', name: 'Bug反馈', icon: '🐛' },
            { id: 'content', name: '内容纠错', icon: '📝' },
            { id: 'other', name: '其他', icon: '📦' }
        ],
        
        // 表单数据
        form: {
            type: '',
            content: '',
            contact: ''
        },
        
        // 表单验证错误
        errors: {},
        
        // 提交状态
        submitting: false
    },

    onLoad() {
        // 页面加载
    },

    // 选择反馈类型
    onTypeSelect(e) {
        const { id } = e.currentTarget.dataset;
        this.setData({
            'form.type': id,
            errors: {}
        });
    },

    // 输入反馈内容
    onContentInput(e) {
        this.setData({
            'form.content': e.detail.value
        });
    },

    // 输入联系方式
    onContactInput(e) {
        this.setData({
            'form.contact': e.detail.value
        });
    },

    // 验证表单
    validateForm() {
        const { form } = this.data;
        const errors = {};
        
        if (!form.type) {
            errors.type = '请选择反馈类型';
        }
        
        if (!form.content.trim()) {
            errors.content = '请填写反馈内容';
        } else if (form.content.trim().length < 10) {
            errors.content = '反馈内容至少需要10个字';
        }
        
        this.setData({ errors });
        return Object.keys(errors).length === 0;
    },

    // 提交反馈
    async onSubmit() {
        if (!this.validateForm()) {
            wx.showToast({
                title: '请完善信息',
                icon: 'none'
            });
            return;
        }
        
        this.setData({ submitting: true });
        
        try {
            const { form } = this.data;
            
            // 调用云函数提交反馈
            const { result } = await wx.cloud.callFunction({
                name: 'submitFeedback',
                data: {
                    type: form.type,
                    content: form.content.trim(),
                    contact: form.contact.trim()
                }
            });
            
            if (result.code === 0) {
                wx.showModal({
                    title: '提交成功',
                    content: '感谢您的反馈，我们会尽快处理！',
                    showCancel: false,
                    success: () => {
                        // 返回上一页
                        wx.navigateBack();
                    }
                });
            } else {
                throw new Error(result.message || '提交失败');
            }
        } catch (err) {
            console.error('提交反馈失败', err);
            wx.showToast({
                title: err.message || '提交失败',
                icon: 'none'
            });
        } finally {
            this.setData({ submitting: false });
        }
    }
});
