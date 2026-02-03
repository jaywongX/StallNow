// 摊主专区入口页面
const app = getApp();

Page({
    data: {
        status: 'loading', // loading / not_vendor / pending / approved
        userInfo: null,
        application: null
    },

    onLoad() {
        this.checkVendorStatus();
    },

    onShow() {
        // 每次显示时刷新状态
        if (this.data.status !== 'loading') {
            this.checkVendorStatus();
        }
    },

    // 检查摊主状态
    async checkVendorStatus() {
        try {
            wx.showLoading({ title: '加载中' });
            
            const { result } = await wx.cloud.callFunction({
                name: 'checkVendorStatus'
            });

            wx.hideLoading();

            if (result.code === 0) {
                const { role, application } = result.data;
                
                // 更新全局数据
                app.globalData.role = role;
                app.globalData.isVendor = role === 'vendor';

                if (role === 'vendor') {
                    // 已入驻，跳转到管理页
                    wx.redirectTo({
                        url: '/pages/vendor-manage/vendor-manage'
                    });
                } else if (application && application.status === 0) {
                    // 审核中
                    this.setData({
                        status: 'pending',
                        application
                    });
                } else {
                    // 未入驻
                    this.setData({
                        status: 'not_vendor'
                    });
                }
            } else {
                throw new Error(result.message);
            }
        } catch (err) {
            wx.hideLoading();
            console.error('检查状态失败', err);
            wx.showToast({
                title: '加载失败',
                icon: 'error'
            });
            this.setData({ status: 'not_vendor' });
        }
    },

    // 点击入驻按钮
    onApplyTap() {
        wx.navigateTo({
            url: '/pages/vendor-apply/vendor-apply'
        });
    },

    // 联系客服
    onContactTap() {
        wx.showModal({
            title: '联系客服',
            content: '如有疑问，请在"我的"页面提交反馈',
            showCancel: false
        });
    }
});
