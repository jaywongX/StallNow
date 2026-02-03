// 摊位管理页面
const app = getApp();

Page({
    data: {
        loading: true,
        stall: null,
        statusText: '',
        statusClass: ''
    },

    onLoad() {
        this.loadStallData();
    },

    onShow() {
        // 每次显示时刷新数据
        if (!this.data.loading) {
            this.loadStallData();
        }
    },

    // 加载摊位数据
    async loadStallData() {
        try {
            this.setData({ loading: true });
            
            const { result } = await wx.cloud.callFunction({
                name: 'getUserInfo'
            });

            if (result.code === 0 && result.data) {
                const userInfo = result.data;
                
                // 获取第一个摊位详情
                if (userInfo.stallIds && userInfo.stallIds.length > 0) {
                    const stallRes = await wx.cloud.callFunction({
                        name: 'getStallDetail',
                        data: { stallId: userInfo.stallIds[0] }
                    });
                    
                    if (stallRes.result.code === 0) {
                        const stall = stallRes.result.data;
                        this.updateStallStatus(stall);
                    }
                } else {
                    // 没有摊位数据
                    this.setData({ loading: false });
                    wx.showModal({
                        title: '提示',
                        content: '您还没有摊位信息',
                        showCancel: false,
                        success: () => {
                            wx.redirectTo({ url: '/pages/vendor/vendor' });
                        }
                    });
                }
            } else {
                throw new Error(result.message);
            }
        } catch (err) {
            console.error('加载失败', err);
            wx.showToast({
                title: '加载失败',
                icon: 'error'
            });
            this.setData({ loading: false });
        }
    },

    // 更新摊位状态显示
    updateStallStatus(stall) {
        const now = new Date();
        const lastConfirmed = stall.lastConfirmedAt ? new Date(stall.lastConfirmedAt) : null;
        
        let statusText, statusClass;
        
        if (stall.status === 2) {
            statusText = '⚪ 已下线';
            statusClass = 'offline';
        } else if (lastConfirmed) {
            const daysDiff = Math.floor((now - lastConfirmed) / (1000 * 60 * 60 * 24));
            if (daysDiff <= 30) {
                statusText = '🟢 今日可能在';
                statusClass = 'active';
            } else if (daysDiff <= 90) {
                statusText = '🟡 最近没摆';
                statusClass = 'warning';
            } else {
                statusText = '⚪ 信息过期';
                statusClass = 'expired';
            }
        } else {
            statusText = '⚪ 未确认';
            statusClass = 'expired';
        }

        this.setData({
            stall,
            statusText,
            statusClass,
            loading: false
        });
    },

    // 编辑摊位信息
    onEditTap() {
        wx.showToast({
            title: '编辑功能开发中',
            icon: 'none'
        });
    },

    // 修改出摊时间
    onScheduleTap() {
        wx.showToast({
            title: '时间设置开发中',
            icon: 'none'
        });
    },

    // 暂时不摆了（下线）
    onOfflineTap() {
        const { stall } = this.data;
        
        if (stall.status === 2) {
            // 已经是下线状态，改为上线
            wx.showModal({
                title: '确认上线',
                content: '确定要恢复摆摊吗？',
                success: (res) => {
                    if (res.confirm) {
                        this.updateStallStatus_api(1);
                    }
                }
            });
        } else {
            // 下线
            wx.showModal({
                title: '确认下线',
                content: '下线后用户将看不到你的摊位，确定要暂时不摆吗？',
                confirmText: '暂时不摆',
                confirmColor: '#FF6B35',
                success: (res) => {
                    if (res.confirm) {
                        this.updateStallStatus_api(2);
                    }
                }
            });
        }
    },

    // 更新摊位状态
    async updateStallStatus_api(status) {
        try {
            wx.showLoading({ title: '处理中...' });
            
            const { result } = await wx.cloud.callFunction({
                name: 'offlineStall',
                data: {
                    stallId: this.data.stall._id,
                    status
                }
            });
            
            wx.hideLoading();
            
            if (result.code === 0) {
                wx.showToast({
                    title: status === 2 ? '已下线' : '已上线',
                    icon: 'success'
                });
                this.loadStallData();
            } else {
                throw new Error(result.message);
            }
        } catch (err) {
            wx.hideLoading();
            wx.showToast({
                title: err.message || '操作失败',
                icon: 'error'
            });
        }
    },

    // 查看摊位详情
    onViewDetail() {
        wx.navigateTo({
            url: `/pages/detail/detail?id=${this.data.stall._id}`
        });
    },

    // 分享摊位
    onShareTap() {
        wx.showShareMenu({
            withShareTicket: true,
            menus: ['shareAppMessage']
        });
    },

    onShareAppMessage() {
        const { stall } = this.data;
        return {
            title: `来看看我的摊位：${stall.displayName}`,
            path: `/pages/detail/detail?id=${stall._id}`
        };
    }
});
