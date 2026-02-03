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

  data: {
    reliabilityConfig: {
      0: { text: '近期确认', color: '#4CAF50', icon: '🟢' },
      1: { text: '信息较旧', color: '#FF9800', icon: '🟡' },
      2: { text: '已过期', color: '#F44336', icon: '🔴' }
    }
  },

  methods: {
    // 点击卡片
    onTap() {
      this.triggerEvent('tap', { stall: this.data.stall });
    },

    // 获取可信度配置
    getReliabilityInfo() {
      const reliability = this.data.stall.reliability || 2;
      return this.data.reliabilityConfig[reliability];
    }
  }
});
