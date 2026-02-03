Component({
  properties: {
    selectedType: {
      type: String,
      value: ''
    }
  },

  data: {
    timeTypes: [
      { type: 'afternoon', name: '下午' },
      { type: 'evening', name: '晚上' },
      { type: 'weekend', name: '周末' },
      { type: 'anytime', name: '不固定' }
    ]
  },

  methods: {
    // 选择时间类型
    onSelect(e) {
      const type = e.currentTarget.dataset.type;
      this.triggerEvent('select', { type });
    }
  }
});
