Component({
  properties: {
    reliability: {
      type: Number,
      value: 0
    },
    expanded: {
      type: Boolean,
      value: false
    }
  },

  data: {
    config: {
      0: { icon: '🟢', text: '近期确认', desc: '30天内确认', color: '#4CAF50' },
      1: { icon: '🟡', text: '信息较旧', desc: '31-90天前确认', color: '#FF9800' },
      2: { icon: '🔴', text: '已过期', desc: '超过90天未确认', color: '#F44336' }
    }
  },

  methods: {
    // 展开/收起
    onToggle() {
      this.setData({
        expanded: !this.data.expanded
      });
    },

    // 获取配置
    getConfig() {
      return this.data.config[this.data.reliability] || this.data.config[2];
    }
  }
});
