/**
 * 入驻申请 Mock 数据
 * 用于测试 submitApplication、adminGetApplications 等云函数
 */

const mockApplications = [
  {
    _id: 'app_001',
    userId: 'user_001',
    stallData: {
      displayName: '烧烤｜老街夜市',
      categoryId: 'category_001',
      landmark: '红色棚子，门口有个大烧烤架',
      location: {
        latitude: 23.1291,
        longitude: 113.2644,
        address: '老街夜市东口往里走50米'
      },
      schedule: {
        type: 'evening',
        timeRange: '18:00-02:00',
        note: '下雨天不出摊'
      },
      images: [
        'cloud://test-env/stalls/app_001_1.jpg',
        'cloud://test-env/stalls/app_001_2.jpg'
      ],
      contact: {
        hasContact: true,
        phone: '13800138000',
        wechatQR: 'cloud://test-env/stalls/app_001_qr.jpg'
      },
      description: '招牌羊肉串，现烤现卖'
    },
    status: 0, // 待审核
    submitTime: new Date('2025-02-01T10:00:00'),
    remark: ''
  },
  {
    _id: 'app_002',
    userId: 'user_002',
    stallData: {
      displayName: '手工饰品｜广场附近',
      categoryId: 'category_002',
      landmark: '白色折叠桌',
      location: {
        latitude: 23.1295,
        longitude: 113.2650,
        address: '人民广场喷泉旁边'
      },
      schedule: {
        type: 'weekend',
        timeRange: '14:00-21:00',
        note: '周末才出摊'
      },
      images: [
        'cloud://test-env/stalls/app_002_1.jpg'
      ],
      contact: {
        hasContact: false
      },
      description: '手工编织手链、耳环'
    },
    status: 1, // 已通过
    submitTime: new Date('2025-01-15T14:30:00'),
    auditTime: new Date('2025-01-16T09:00:00'),
    auditBy: 'admin_001',
    remark: '信息完整，审核通过',
    stallId: 'stall_002'
  },
  {
    _id: 'app_003',
    userId: 'user_003',
    stallData: {
      displayName: '水果摊｜小区门口',
      categoryId: 'category_003',
      landmark: '绿色三轮车',
      location: {
        latitude: 23.1280,
        longitude: 113.2630,
        address: '阳光小区门口'
      },
      schedule: {
        type: 'afternoon',
        timeRange: '15:00-20:00',
        note: '每天出摊'
      },
      images: [],
      contact: {
        hasContact: true,
        phone: '13900139000'
      },
      description: '当季新鲜水果'
    },
    status: 2, // 已拒绝
    submitTime: new Date('2025-01-10T16:00:00'),
    auditTime: new Date('2025-01-11T10:00:00'),
    auditBy: 'admin_001',
    remark: '缺少摊位照片，无法确认真实性'
  }
];

/**
 * 用户 Mock 数据
 * 用于测试用户关联查询
 */
const mockUsers = [
  {
    _id: 'user_001',
    _openid: 'openid_test_001',
    nickName: '烧烤老王',
    avatarUrl: 'https://example.com/avatar1.jpg',
    role: 'user',
    createTime: new Date('2025-01-01')
  },
  {
    _id: 'user_002',
    _openid: 'openid_test_002',
    nickName: '手工小姐姐',
    avatarUrl: 'https://example.com/avatar2.jpg',
    role: 'vendor',
    createTime: new Date('2025-01-10')
  },
  {
    _id: 'user_003',
    _openid: 'openid_test_003',
    nickName: '水果大叔',
    avatarUrl: 'https://example.com/avatar3.jpg',
    role: 'user',
    createTime: new Date('2025-01-05')
  },
  {
    _id: 'admin_001',
    _openid: 'openid_admin_001',
    nickName: '管理员',
    avatarUrl: 'https://example.com/admin.jpg',
    role: 'admin',
    createTime: new Date('2024-12-01')
  }
];

/**
 * 获取指定状态的申请
 * @param {number} status - 状态码
 * @returns {Array} 申请列表
 */
function getApplicationsByStatus(status) {
  return mockApplications.filter(app => app.status === status);
}

/**
 * 根据ID获取申请
 * @param {string} appId - 申请ID
 * @returns {Object|null} 申请对象
 */
function getApplicationById(appId) {
  return mockApplications.find(app => app._id === appId) || null;
}

/**
 * 根据用户ID获取申请
 * @param {string} userId - 用户ID
 * @returns {Array} 申请列表
 */
function getApplicationsByUser(userId) {
  return mockApplications.filter(app => app.userId === userId);
}

/**
 * 根据ID获取用户
 * @param {string} userId - 用户ID
 * @returns {Object|null} 用户对象
 */
function getUserById(userId) {
  return mockUsers.find(user => user._id === userId) || null;
}

module.exports = {
  mockApplications,
  mockUsers,
  getApplicationsByStatus,
  getApplicationById,
  getApplicationsByUser,
  getUserById
};
