Component({
  properties: {
    stall: {
      type: Object,
      value: {}
    },
    showReliability: {
      type: Boolean,
      value: false
    }
  },

  methods: {
    // 点击卡片
    onTap() {
      console.log('[DEBUG stall-card] 点击卡片，stall数据:', this.data.stall);
      if (!this.data.stall || !this.data.stall._id) {
        console.error('[DEBUG stall-card] stall数据无效!');
        wx.showToast({ title: '数据错误', icon: 'none' });
        return;
      }
      this.triggerEvent('tap', { stall: this.data.stall });
    }
  }
});
