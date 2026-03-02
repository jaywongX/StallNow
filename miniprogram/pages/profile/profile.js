// 我的页面
const app = getApp();

Page({
    data: {
        userInfo: {},
        role: 'user',
        isAdmin: false,
        currentCity: '汕尾市',
        showHelpModal: false,
        showDisclaimerModal: false
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
            
            // 获取服务器用户信息
            const { result } = await wx.cloud.callFunction({
                name: 'getUserInfo'
            });

            if (result.code === 0) {
                const serverUserInfo = result.data;
                
                this.setData({
                    userInfo: {
                        ...serverUserInfo,
                        nickName: serverUserInfo?.nickName || '',
                        avatarUrl: serverUserInfo?.avatarUrl || ''
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

    // 选择头像
    async onChooseAvatar(e) {
        const { avatarUrl } = e.detail;
        
        // 显示加载
        wx.showLoading({ title: '保存中...' });
        
        try {
            // 上传头像到云存储
            const cloudPath = `avatars/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
            const uploadRes = await wx.cloud.uploadFile({
                cloudPath,
                filePath: avatarUrl
            });
            
            // 更新到服务器
            await wx.cloud.callFunction({
                name: 'updateUserInfo',
                data: {
                    avatarUrl: uploadRes.fileID
                }
            });
            
            // 更新本地显示
            this.setData({
                'userInfo.avatarUrl': uploadRes.fileID
            });
            
            wx.hideLoading();
            wx.showToast({ title: '头像已更新', icon: 'success' });
        } catch (err) {
            wx.hideLoading();
            console.error('上传头像失败', err);
            wx.showToast({ title: '更新失败', icon: 'none' });
        }
    },

    // 昵称输入
    onNicknameInput(e) {
        this.setData({
            'userInfo.nickName': e.detail.value
        });
    },

    // 昵称失焦保存
    async onNicknameBlur(e) {
        const nickName = e.detail.value.trim();
        
        if (!nickName) {
            return;
        }
        
        try {
            await wx.cloud.callFunction({
                name: 'updateUserInfo',
                data: { nickName }
            });
            
            wx.showToast({ title: '昵称已更新', icon: 'success' });
        } catch (err) {
            console.error('更新昵称失败', err);
            wx.showToast({ title: '更新失败', icon: 'none' });
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
        wx.navigateTo({
            url: '/pages/favorites/favorites'
        });
    },

    // 推荐摊位
    onRecommendTap() {
        wx.navigateTo({
            url: '/pages/recommend-stall/recommend-stall'
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
        this.setData({
            showDisclaimerModal: true
        });
    },

    // 关闭免责声明弹窗
    onCloseDisclaimerModal() {
        this.setData({
            showDisclaimerModal: false
        });
    },

    // 使用说明
    onHelpTap() {
        this.setData({
            showHelpModal: true
        });
    },

    // 关闭使用说明弹窗
    onCloseHelpModal() {
        this.setData({
            showHelpModal: false
        });
    },

    // 管理后台（仅管理员）
    onAdminTap() {
        wx.navigateTo({
            url: '/pages/admin/admin'
        });
    }
});
