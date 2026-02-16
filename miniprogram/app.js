// 小程序入口文件

// 城市配置
const CITY_CONFIG = {
    // 多城市支持开关：设为 true 开放多城市支持
    multiCityEnabled: false,
    // 默认城市（汕尾市城区二马路附近）
    defaultCity: {
        name: '汕尾市',
        district: '城区',
        address: '二马路',
        location: {
            latitude: 22.7863,
            longitude: 115.3650
        }
    },
    // 当前支持的城市列表
    supportedCities: ['汕尾市', '汕尾', '城区', '海丰县', '陆河县', '陆丰市']
};

App({
    // 导出城市配置供其他页面使用
    CITY_CONFIG,

    async onLaunch() {
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

        // 初始化城市配置到全局数据
        this.globalData.currentCity = CITY_CONFIG.defaultCity.name;
        this.globalData.defaultLocation = CITY_CONFIG.defaultCity.location;
        
        // 获取用户位置
        this.getUserLocation();
        
        // 自动获取用户信息（静默注册）
        // 这是关键：用户首次使用时会自动创建 users 记录
        await this.getUserInfo();
    },

    onShow() {
        // 小程序显示时的处理
    },

    // 获取用户位置并检查城市
    getUserLocation() {
        const that = this;
        wx.getLocation({
            type: 'gcj02',
            success(res) {
                that.globalData.location = {
                    latitude: res.latitude,
                    longitude: res.longitude
                };
                // 检查城市支持
                that.checkCitySupport(res.latitude, res.longitude);
            },
            fail(err) {
                console.error('获取位置失败', err);
                // 使用默认位置
                that.globalData.location = CITY_CONFIG.defaultCity.location;
                that.globalData.isCitySupported = true;
                that.globalData.citySwitched = true;
            }
        });
    },

    // 检查城市支持（通过逆地理编码）
    checkCitySupport(latitude, longitude) {
        const that = this;
        
        // 如果开启了多城市支持，直接通过
        if (CITY_CONFIG.multiCityEnabled) {
            that.globalData.isCitySupported = true;
            that.globalData.cityCheckPromise = Promise.resolve({ supported: true });
            return that.globalData.cityCheckPromise;
        }

        // 创建Promise让页面可以等待检查完成
        that.globalData.cityCheckPromise = new Promise((resolve) => {
            // 使用腾讯地图SDK或云函数进行逆地理编码
            wx.cloud.callFunction({
                name: 'checkCitySupport',
                data: { 
                    latitude, 
                    longitude,
                    checkLocation: true 
                }
            }).then(res => {
                const { supported, city } = res.result;
                
                if (!supported) {
                    // 不在支持的城市，切换到默认城市
                    that.globalData.isCitySupported = false;
                    that.globalData.citySwitched = true;
                    that.globalData.location = CITY_CONFIG.defaultCity.location;
                    
                    // 触发全局城市切换事件
                    if (that.citySwitchCallback) {
                        that.citySwitchCallback({
                            switched: true,
                            fromCity: city,
                            toCity: CITY_CONFIG.defaultCity.name
                        });
                    }
                    resolve({ supported: false, citySwitched: true, fromCity: city });
                } else {
                    that.globalData.isCitySupported = true;
                    that.globalData.citySwitched = false;
                    resolve({ supported: true, citySwitched: false });
                }
            }).catch(err => {
                console.error('检查城市失败', err);
                // 失败时使用默认位置
                that.globalData.location = CITY_CONFIG.defaultCity.location;
                that.globalData.isCitySupported = true;
                that.globalData.citySwitched = true;
                resolve({ supported: false, citySwitched: true, error: err });
            });
        });
        
        return that.globalData.cityCheckPromise;
    },

    // 注册城市切换回调
    onCitySwitch(callback) {
        this.citySwitchCallback = callback;
    },

    // 获取用户信息（含角色）
    async getUserInfo() {
        try {
            const { result } = await wx.cloud.callFunction({
                name: 'getUserInfo'
            });
            this.globalData.userInfo = result.data;
            this.globalData.role = result.data?.role || 'user';
            this.globalData.isAdmin = result.data?.role === 'admin';
            this.globalData.isVendor = result.data?.role === 'vendor';
            
            // 检查是否是新用户（没有昵称）
            this.globalData.isNewUser = !result.data?.nickName;
            
            return result.data;
        } catch (err) {
            console.error('获取用户信息失败', err);
            return null;
        }
    },

    globalData: {
        location: null,
        defaultLocation: null,
        currentCity: '汕尾市',
        isCitySupported: true,
        citySwitched: false,  // 是否自动切换了城市
        userInfo: null,
        role: 'user',
        isAdmin: false,
        isVendor: false,
        isNewUser: false  // 是否是新用户（需要设置昵称）
    }
});
