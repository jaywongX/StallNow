Component({
  properties: {
    categories: {
      type: Array,
      value: []
    },
    selectedId: {
      type: String,
      value: ''
    }
  },

  methods: {
    // 选择分类
    onSelect(e) {
      const id = e.currentTarget.dataset.id;
      this.triggerEvent('select', { id });
    }
  }
});
