/**
 * 摊位 Mock 数据
 * 用于测试 getStalls、getStallDetail 等云函数
 */

const mockStalls = [
  {
    _id: 'stall_001',
    displayName: '烧烤｜老街夜市',
    categoryId: 'category_001',
    categoryName: '烧烤/烤串',
    landmark: '红色棚子，门口有个大烧烤架',
    location: {
      type: 'Point',
      coordinates: [113.2644, 23.1291] // [longitude, latitude]
    },
    address: '老街夜市东口往里走50米',
    schedule: {
      type: 'evening',
      timeRange: '18:00-02:00',
      note: '下雨天不出摊'
    },
    images: [
      'cloud://test-env/stalls/stall_001_1.jpg',
      'cloud://test-env/stalls/stall_001_2.jpg'
    ],
    status: 1, // 已上架
    reliability: 0, // 近期确认
    lastConfirmedAt: new Date('2025-02-01'),
    confirmMethod: 'owner_scan',
    contact: {
      hasContact: true,
      phone: '138****1234',
      wechatQR: 'cloud://test-env/stalls/stall_001_qr.jpg'
    },
    description: '招牌羊肉串，现烤现卖，肉质新鲜',
    tags: ['羊肉串', '牛肉串', '鸡翅'],
    viewCount: 156,
    createTime: new Date('2024-12-01'),
    updateTime: new Date('2025-02-01')
  },
  {
    _id: 'stall_002',
    displayName: '手工饰品｜广场附近',
    categoryId: 'category_002',
    categoryName: '手工/饰品',
    landmark: '白色折叠桌，上面铺着蓝格子布',
    location: {
      type: 'Point',
      coordinates: [113.2650, 23.1295]
    },
    address: '人民广场喷泉旁边',
    schedule: {
      type: 'weekend',
      timeRange: '14:00-21:00',
      note: '周末和节假日才出摊'
    },
    images: [
      'cloud://test-env/stalls/stall_002_1.jpg'
    ],
    status: 1,
    reliability: 1, // 可能还在
    lastConfirmedAt: new Date('2025-01-15'),
    confirmMethod: 'visitor_view',
    contact: {
      hasContact: false
    },
    description: '手工编织手链、耳环，每件都是独一无二的',
    tags: ['手链', '耳环', '发夹'],
    viewCount: 89,
    createTime: new Date('2024-11-15'),
    updateTime: new Date('2025-01-15')
  },
  {
    _id: 'stall_003',
    displayName: '水果摊｜小区门口',
    categoryId: 'category_003',
    categoryName: '水果/零食',
    landmark: '绿色三轮车，车斗装满水果',
    location: {
      type: 'Point',
      coordinates: [113.2630, 23.1280]
    },
    address: '阳光小区门口',
    schedule: {
      type: 'afternoon',
      timeRange: '15:00-20:00',
      note: '每天出摊'
    },
    images: [
      'cloud://test-env/stalls/stall_003_1.jpg',
      'cloud://test-env/stalls/stall_003_2.jpg',
      'cloud://test-env/stalls/stall_003_3.jpg'
    ],
    status: 1,
    reliability: 0,
    lastConfirmedAt: new Date('2025-02-04'),
    confirmMethod: 'admin_check',
    contact: {
      hasContact: true,
      phone: '139****5678'
    },
    description: '当季新鲜水果，价格便宜，可削皮',
    tags: ['苹果', '香蕉', '橙子', '西瓜'],
    viewCount: 234,
    createTime: new Date('2024-10-01'),
    updateTime: new Date('2025-02-04')
  },
  {
    _id: 'stall_004',
    displayName: '玩具｜夜市西口',
    categoryId: 'category_004',
    categoryName: '玩具/文创',
    landmark: '塑料收纳箱堆成金字塔',
    location: {
      type: 'Point',
      coordinates: [113.2620, 23.1285]
    },
    address: '老街夜市西口',
    schedule: {
      type: 'evening',
      timeRange: '19:00-23:00',
      note: '周五六日必出摊'
    },
    images: [],
    status: 1,
    reliability: 2, // 信息过期
    lastConfirmedAt: new Date('2024-11-01'),
    confirmMethod: 'owner_scan',
    contact: {
      hasContact: false
    },
    description: '儿童玩具、发光棒、气球',
    tags: ['玩具车', '发光棒', '气球'],
    viewCount: 67,
    createTime: new Date('2024-09-01'),
    updateTime: new Date('2024-11-01')
  },
  {
    _id: 'stall_005',
    displayName: '煎饼果子｜地铁口',
    categoryId: 'category_005',
    categoryName: '小吃/早餐',
    landmark: '银色推车，有玻璃橱窗',
    location: {
      type: 'Point',
      coordinates: [113.2660, 23.1300]
    },
    address: '地铁A出口旁边',
    schedule: {
      type: 'morning',
      timeRange: '06:00-09:00',
      note: '早餐时段，卖完就走'
    },
    images: [
      'cloud://test-env/stalls/stall_005_1.jpg'
    ],
    status: 0, // 待审核
    reliability: 0,
    lastConfirmedAt: new Date('2025-02-03'),
    confirmMethod: 'owner_scan',
    contact: {
      hasContact: true,
      phone: '137****9012'
    },
    description: '正宗天津煎饼果子，薄脆可口',
    tags: ['煎饼果子', '豆浆'],
    viewCount: 12,
    createTime: new Date('2025-02-03'),
    updateTime: new Date('2025-02-03')
  }
];

/**
 * 分类 Mock 数据
 */
const mockCategories = [
  { _id: 'category_001', name: '烧烤/烤串', icon: '/images/category_bbq.png', sort: 1 },
  { _id: 'category_002', name: '手工/饰品', icon: '/images/category_handmade.png', sort: 2 },
  { _id: 'category_003', name: '水果/零食', icon: '/images/category_fruit.png', sort: 3 },
  { _id: 'category_004', name: '玩具/文创', icon: '/images/category_toy.png', sort: 4 },
  { _id: 'category_005', name: '小吃/早餐', icon: '/images/category_snack.png', sort: 5 },
  { _id: 'category_006', name: '其他', icon: '/images/category_other.png', sort: 6 }
];

/**
 * 获取指定状态的摊位
 * @param {number} status - 状态码
 * @returns {Array} 摊位列表
 */
function getStallsByStatus(status) {
  return mockStalls.filter(stall => stall.status === status);
}

/**
 * 获取指定分类的摊位
 * @param {string} categoryId - 分类ID
 * @returns {Array} 摊位列表
 */
function getStallsByCategory(categoryId) {
  return mockStalls.filter(stall => stall.categoryId === categoryId);
}

/**
 * 根据ID获取摊位
 * @param {string} stallId - 摊位ID
 * @returns {Object|null} 摊位对象
 */
function getStallById(stallId) {
  return mockStalls.find(stall => stall._id === stallId) || null;
}

/**
 * 关键词搜索摊位
 * @param {string} keyword - 关键词
 * @returns {Array} 匹配的摊位列表
 */
function searchStalls(keyword) {
  const lowerKeyword = keyword.toLowerCase();
  return mockStalls.filter(stall => {
    return (
      stall.displayName.toLowerCase().includes(lowerKeyword) ||
      stall.description.toLowerCase().includes(lowerKeyword) ||
      stall.tags.some(tag => tag.toLowerCase().includes(lowerKeyword)) ||
      stall.landmark.toLowerCase().includes(lowerKeyword)
    );
  });
}

module.exports = {
  mockStalls,
  mockCategories,
  getStallsByStatus,
  getStallsByCategory,
  getStallById,
  searchStalls
};
