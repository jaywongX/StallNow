// 我的页面
const app = getApp();

Page({
    data: {
        userInfo: {},
        role: 'user',
        isAdmin: false,
        currentCity: '汕尾市'
    },

    onLoad() {
        this.loadUserInfo();
    },

    onShow() {
        this.loadUserInfo();
    },

    // 加载用户信息
    async loadUserInfo() {
        try {
            // 先获取全局数据
            const globalData = app.globalData;
            
            // 获取微信用户信息
            const wxUserInfo = wx.getStorageSync('wxUserInfo');
            
            // 获取服务器用户信息
            const { result } = await wx.cloud.callFunction({
                name: 'getUserInfo'
            });

            if (result.code === 0) {
                const serverUserInfo = result.data;
                
                this.setData({
                    userInfo: {
                        ...serverUserInfo,
                        nickName: wxUserInfo?.nickName || serverUserInfo?.nickName || '微信用户',
                        avatarUrl: wxUserInfo?.avatarUrl || serverUserInfo?.avatarUrl || ''
                    },
                    role: serverUserInfo?.role || 'user',
                    isAdmin: serverUserInfo?.role === 'admin',
                    currentCity: globalData.currentCity
                });
                
                // 更新全局数据
                app.globalData.role = serverUserInfo?.role || 'user';
                app.globalData.isAdmin = serverUserInfo?.role === 'admin';
            }
        } catch (err) {
            console.error('获取用户信息失败', err);
        }
    },

    // 获取微信用户信息
    async getWxUserProfile() {
        try {
            const res = await wx.getUserProfile({
                desc: '用于完善用户资料'
            });
            
            wx.setStorageSync('wxUserInfo', res.userInfo);
            
            // 更新到服务器
            await wx.cloud.callFunction({
                name: 'updateUserInfo',
                data: {
                    nickName: res.userInfo.nickName,
                    avatarUrl: res.userInfo.avatarUrl
                }
            });
            
            this.loadUserInfo();
        } catch (err) {
            console.error('获取用户信息失败', err);
        }
    },

    // 切换城市
    onCityTap() {
        wx.showToast({
            title: '城市切换开发中',
            icon: 'none'
        });
    },

    // 收藏的摊位
    onFavoritesTap() {
        wx.showToast({
            title: '收藏功能开发中',
            icon: 'none'
        });
    },

    // 最近看过
    onHistoryTap() {
        wx.showToast({
            title: '历史功能开发中',
            icon: 'none'
        });
    },

    // 关于我们
    onAboutTap() {
        wx.navigateTo({
            url: '/pages/about/about'
        });
    },

    // 隐私政策
    onPrivacyTap() {
        wx.navigateTo({
            url: '/pages/privacy/privacy'
        });
    },

    // 意见反馈
    onFeedbackTap() {
        wx.navigateTo({
            url: '/pages/feedback/feedback'
        });
    },

    // 免责声明
    onDisclaimerTap() {
        wx.showModal({
            title: '免责声明',
            content: '本小程序仅提供地摊信息展示服务，不对地摊商品质量、交易行为等承担任何责任。请用户自行辨别信息真伪，谨慎交易。',
            showCancel: false
        });
    },

    // 使用说明
    onHelpTap() {
        wx.showModal({
            title: '使用说明',
            content: '1. 在「附近」查看周围的地摊\n2. 在「逛摊」浏览分类推荐\n3. 摊主可在「我是摊主」入驻\n4. 有问题请在「意见反馈」中提交',
            showCancel: false
        });
    },

    // 管理后台（仅管理员）
    onAdminTap() {
        wx.navigateTo({
            url: '/pages/admin/admin'
        });
    }
});
