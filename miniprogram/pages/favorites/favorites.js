const app = getApp();

Page({
  data: {
    favorites: [],
    loading: true,
    hasMore: true,
    page: 1,
    pageSize: 20
  },

  onLoad() {
    this.loadFavorites();
  },

  onShow() {
    // 每次显示时重新加载，确保数据最新
    this.refreshFavorites();
  },

  // 刷新收藏列表
  async refreshFavorites() {
    this.setData({
      page: 1,
      favorites: [],
      hasMore: true
    });
    await this.loadFavorites();
  },

  // 加载收藏列表
  async loadFavorites() {
    if (!this.data.hasMore && this.data.page > 1) {
      return;
    }

    this.setData({ loading: true });

    try {
      const { result } = await wx.cloud.callFunction({
        name: 'getFavorites',
        data: {
          page: this.data.page,
          pageSize: this.data.pageSize
        }
      });

      if (result.code === 0) {
        const newList = result.data.list.map(stall => ({
          ...stall,
          // 判断摊位状态
          isActive: stall.status === 1 && stall.activeStatus !== 'inactive'
        }));

        this.setData({
          favorites: this.data.page === 1 ? newList : [...this.data.favorites, ...newList],
          hasMore: result.data.hasMore,
          loading: false,
          page: this.data.page + 1
        });
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      console.error('加载收藏列表失败', err);
      this.setData({ loading: false });
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.refreshFavorites().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 上拉加载更多
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadFavorites();
    }
  },

  // 跳转到摊位详情
  onStallTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    });
  },

  // 导航到摊位
  onNavigate(e) {
    const { stall } = e.currentTarget.dataset;
    if (!stall || !stall.location) {
      wx.showToast({
        title: '暂无位置信息',
        icon: 'none'
      });
      return;
    }

    wx.openLocation({
      latitude: stall.location.latitude,
      longitude: stall.location.longitude,
      name: stall.displayName,
      address: stall.address || ''
    });
  },

  // 取消收藏
  async onRemoveFavorite(e) {
    const { id, index } = e.currentTarget.dataset;

    const res = await wx.showModal({
      title: '确认取消',
      content: '确定要取消收藏吗？'
    });

    if (!res.confirm) return;

    try {
      wx.showLoading({ title: '处理中...' });

      const { result } = await wx.cloud.callFunction({
        name: 'toggleFavorite',
        data: {
          stallId: id,
          action: 'remove'
        }
      });

      wx.hideLoading();

      if (result.code === 0) {
        // 从列表中移除
        const favorites = [...this.data.favorites];
        favorites.splice(index, 1);
        this.setData({ favorites });

        wx.showToast({
          title: '已取消收藏',
          icon: 'success'
        });
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      wx.hideLoading();
      console.error('取消收藏失败', err);
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      });
    }
  },

  // 预览图片
  onPreviewImage(e) {
    const { url, urls } = e.currentTarget.dataset;
    wx.previewImage({
      current: url,
      urls: urls
    });
  }
});
