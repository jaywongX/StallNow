// 摊位管理页面
const app = getApp();

Page({
    data: {
        loading: true,
        stall: null,
        statusText: '',
        statusClass: '',

        // 小程序码弹窗
        showQRModal: false,
        qrCodeUrl: '',
        generatingQR: false
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
            console.log('[DEBUG] 开始加载摊位数据...');

            const { result } = await wx.cloud.callFunction({
                name: 'getUserInfo'
            });
            console.log('[DEBUG] getUserInfo 返回:', result);

            if (result.code === 0 && result.data) {
                const userInfo = result.data;
                console.log('[DEBUG] 用户信息:', userInfo);
                console.log('[DEBUG] stallIds:', userInfo.stallIds);

                // 获取第一个摊位详情
                if (userInfo.stallIds && userInfo.stallIds.length > 0) {
                    const stallId = userInfo.stallIds[0];
                    console.log('[DEBUG] 查询摊位ID:', stallId);

                    const stallRes = await wx.cloud.callFunction({
                        name: 'getStallDetail',
                        data: { stallId: stallId }
                    });
                    console.log('[DEBUG] getStallDetail 返回:', stallRes);

                    if (stallRes.result.code === 0) {
                        const stall = stallRes.result.data;
                        console.log('[DEBUG] 摊位数据:', stall);
                        this.updateStallStatus(stall);
                    } else {
                        console.error('[DEBUG] 获取摊位详情失败:', stallRes.result.message);
                        throw new Error(stallRes.result.message || '获取摊位详情失败');
                    }
                } else {
                    // 没有摊位数据
                    console.log('[DEBUG] 用户没有绑定摊位');
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
            console.error('[DEBUG] 加载失败:', err);
            wx.showModal({
                title: '加载失败',
                content: err.message || '未知错误',
                showCancel: false
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
        const { stall } = this.data;
        if (!stall || !stall._id) {
            wx.showToast({
                title: '摊位信息加载中',
                icon: 'none'
            });
            return;
        }
        wx.navigateTo({
            url: `/pages/vendor-edit/vendor-edit?id=${stall._id}`
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

    // 分享摊位 - 打开小程序码弹窗
    async onShareTap() {
        this.setData({ showQRModal: true });

        const { stall } = this.data;
        if (!stall || !stall._id) return;

        // 如果有 fileID，优先用它获取新的临时链接（避免403）
        if (stall.qrCodeFileID) {
            try {
                this.setData({ generatingQR: true });
                const { fileList } = await wx.cloud.getTempFileURL({
                    fileList: [stall.qrCodeFileID]
                });

                if (fileList && fileList[0] && fileList[0].tempFileURL) {
                    this.setData({ qrCodeUrl: fileList[0].tempFileURL });
                }
            } catch (err) {
                console.log('获取临时链接失败', err);
            } finally {
                this.setData({ generatingQR: false });
            }
        }

        // 同时调用云函数，确保二维码是最新的
        this.generateQRCode();
    },


    // 关闭小程序码弹窗
    onCloseQRModal() {
        this.setData({ showQRModal: false });
    },

    // 阻止弹窗内容点击冒泡
    onModalContentTap() {
        // 什么都不做，只是阻止冒泡
    },

    // 生成小程序码
    async generateQRCode() {
        const { stall } = this.data;
        if (!stall || !stall._id) return;

        try {
            this.setData({ generatingQR: true });

            const { result } = await wx.cloud.callFunction({
                name: 'generateStallQRCode',
                data: { stallId: stall._id }
            });

            if (result.code === 0 && result.data) {
                // 更新二维码URL和stall对象中的qrCodeFileID
                const stall = this.data.stall;
                stall.qrCodeFileID = result.data.qrCodeFileID || stall.qrCodeFileID;
                this.setData({
                    qrCodeUrl: result.data.qrCodeUrl,
                    stall: stall
                });
            } else {
                throw new Error(result.message);
            }
        } catch (err) {
            console.error('生成小程序码失败', err);
            // 不显示错误提示，因为可能已经有二维码显示了
        } finally {
            this.setData({ generatingQR: false });
        }
    },


    // 二维码图片加载失败时刷新链接
    async onQRCodeError() {
        console.log('二维码加载失败，尝试刷新链接');
        const { stall } = this.data;

        if (!stall || !stall.qrCodeFileID) {
            // 没有 fileID，需要重新生成
            this.generateQRCode();
            return;
        }

        try {
            this.setData({ generatingQR: true });

            // 使用 fileID 获取新的临时链接
            const { fileList } = await wx.cloud.getTempFileURL({
                fileList: [stall.qrCodeFileID]
            });

            if (fileList && fileList[0] && fileList[0].tempFileURL) {
                this.setData({ qrCodeUrl: fileList[0].tempFileURL });
            } else {
                throw new Error('获取链接失败');
            }
        } catch (err) {
            console.error('刷新链接失败', err);
            // 刷新失败则重新生成
            this.generateQRCode();
        } finally {
            this.setData({ generatingQR: false });
        }
    },

    // 保存小程序码到相册
    async onSaveQRCode() {
        const { qrCodeUrl, stall } = this.data;
        if (!qrCodeUrl || !stall) {
            wx.showToast({ title: '请先生成小程序码', icon: 'none' });
            return;
        }

        try {
            wx.showLoading({ title: '保存中...' });

            // 方法1: 如果有 fileID，优先使用 fileID 下载
            if (stall.qrCodeFileID) {
                const fileRes = await wx.cloud.downloadFile({
                    fileID: stall.qrCodeFileID
                });

                if (fileRes.tempFilePath) {
                    await wx.saveImageToPhotosAlbum({
                        filePath: fileRes.tempFilePath
                    });
                    wx.hideLoading();
                    wx.showToast({ title: '已保存到相册', icon: 'success' });
                    return;
                }
            }

            // 方法2: 使用 URL 下载（添加域名白名单检查）
            const downloadRes = await wx.downloadFile({
                url: qrCodeUrl,
                header: {
                    'Content-Type': 'application/octet-stream'
                }
            });

            if (downloadRes.statusCode !== 200) {
                console.error('下载失败，statusCode:', downloadRes.statusCode);
                throw new Error('下载图片失败，状态码: ' + downloadRes.statusCode);
            }

            // 保存到相册
            await wx.saveImageToPhotosAlbum({
                filePath: downloadRes.tempFilePath
            });

            wx.hideLoading();
            wx.showToast({ title: '已保存到相册', icon: 'success' });
        } catch (err) {
            wx.hideLoading();
            console.error('保存失败', err);

            if (err.errMsg && err.errMsg.includes('auth deny')) {
                wx.showModal({
                    title: '需要授权',
                    content: '保存图片需要访问相册权限',
                    confirmText: '去设置',
                    success: (res) => {
                        if (res.confirm) {
                            wx.openSetting();
                        }
                    }
                });
            } else if (err.errMsg && err.errMsg.includes('downloadFile:fail')) {
                wx.showModal({
                    title: '保存失败',
                    content: '下载链接无效，请重新生成小程序码后再试',
                    showCancel: false
                });
            } else {
                wx.showToast({
                    title: err.message || '保存失败',
                    icon: 'error'
                });
            }
        }
    },

    onShareAppMessage() {
        const { stall } = this.data;
        return {
            title: `来看看我的摊位：${stall.displayName}`,
            path: `/pages/detail/detail?id=${stall._id}`
        };
    }
});
