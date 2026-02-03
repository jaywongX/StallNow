// 小程序入口文件
App({
    onLaunch() {
        // 初始化云开发环境
        if (!wx.cloud) {
            console.error('请使用 2.2.3 或以上的基础库以使用云能力');
        } else {
            const config = {
                // 开发环境（微信工具环境）
                dev: {
                    env: 'cloudbase-3g9hw9hm1c01fd63'
                },
                // 生产环境（浏览器环境）
                prod: {
                    env: 'stallnow-7grwcvzp21981e44'
                }
            }

            // 根据编译模式选择
            const env = __wxConfig.envVersion === 'release'
                ? config.prod.env
                : config.dev.env

            wx.cloud.init({ env, traceUser: true })
        }

        // 获取用户位置
        this.getUserLocation();
    },

    onShow() {
        // 小程序显示时的处理
        // 已移除城市检查，使用默认城市
    },

    // 获取用户位置
    getUserLocation() {
        const that = this;
        wx.getLocation({
            type: 'gcj02',
            success(res) {
                that.globalData.location = {
                    latitude: res.latitude,
                    longitude: res.longitude
                };
            },
            fail(err) {
                console.error('获取位置失败', err);
                wx.showModal({
                    title: '提示',
                    content: '需要获取您的位置信息以推荐附近摊位',
                    confirmText: '去设置',
                    success(res) {
                        if (res.confirm) {
                            wx.openSetting();
                        }
                    }
                });
            }
        });
    },

    globalData: {
        location: null,
        currentCity: '汕尾市',
        isCitySupported: true
    }
});
