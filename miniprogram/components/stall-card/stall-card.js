Component({
  properties: {
    stall: {
      type: Object,
      value: {}
    },
    showReliability: {
      type: Boolean,
      value: false
    },
    showDistance: {
      type: Boolean,
      value: false
    }
  },

  methods: {
    // 点击卡片
    onTap() {
      if (!this.data.stall || !this.data.stall._id) {
        console.error('stall数据无效');
        wx.showToast({ title: '数据错误', icon: 'none' });
        return;
      }
      this.triggerEvent('tap', { stall: this.data.stall });
    }
  }
});
