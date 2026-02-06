/**
 * 云函数测试入口文件
 * 运行所有云函数测试
 */

/**
 * 快速冒烟测试
 * 验证测试环境是否正常
 */
describe('测试环境验证', () => {

  test('Jest 运行正常', () => {
    expect(true).toBe(true);
  });

  test('Mock 数据加载正常', () => {
    const mock = require('../mock');
    expect(mock.mockStalls).toBeDefined();
    expect(mock.mockApplications).toBeDefined();
    expect(mock.mockUsers).toBeDefined();
    expect(mock.mockStalls.length).toBeGreaterThan(0);
  });

  test('测试辅助函数可用', () => {
    const helpers = require('../utils/test-helpers');
    expect(typeof helpers.createMockCloud).toBe('function');
    expect(typeof helpers.createMockEvent).toBe('function');
    expect(typeof helpers.assertCloudResult).toBe('function');
  });
});

/**
 * 测试套件汇总信息
 */
describe('测试套件信息', () => {

  test('显示测试覆盖的云函数', () => {
    const testedFunctions = [
      'getStalls - 获取摊位列表（支持筛选、分页）',
      'submitApplication - 提交入驻申请（含校验逻辑）',
      'adminGetApplications - 获取申请列表（含图片URL转换）',
      'auditApplication - 审核申请（状态流转：通过/拒绝）',
      'getUserInfo - 获取用户信息（含自动注册）',
      'getStallDetail - 获取摊位详情（含访问计数）',
      'submitFeedback - 提交反馈（用户反馈+摊位反馈）'
    ];

    console.log('\n=================================');
    console.log('已覆盖的云函数测试：');
    testedFunctions.forEach(fn => console.log(`  ✓ ${fn}`));
    console.log('=================================\n');

    expect(testedFunctions.length).toBe(7);
  });
});

// 注意：不要在这里 require 其他测试文件，让 Jest 自动发现和运行
// require('./getStalls.test');
// require('./submitApplication.test');
// require('./adminGetApplications.test');
