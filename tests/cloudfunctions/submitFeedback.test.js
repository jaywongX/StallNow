/**
 * submitFeedback 云函数测试
 * 测试反馈提交功能（摊位反馈 + 用户意见反馈）
 */

// 导入被测试的云函数
const submitFeedback = require('../../cloudfunctions/submitFeedback');

describe('submitFeedback 云函数测试', () => {

  beforeEach(() => {
    // 重置 mock 数据
    const cloud = jest.requireMock('wx-server-sdk');
    if (cloud._resetData) {
      cloud._resetData();
    }
    jest.clearAllMocks();
  });

  describe('用户意见反馈', () => {

    test('应成功提交用户意见反馈', async () => {
      const cloud = jest.requireMock('wx-server-sdk');
      const mockData = cloud._getMockData();

      const event = {
        type: 'suggestion',
        content: '希望增加更多筛选条件',
        contact: '13800138000'
      };

      const result = await submitFeedback.main(event, {});

      expect(result.success).toBe(true);
      expect(result.message).toContain('反馈提交成功');

      // 验证反馈已保存
      expect(mockData.feedbacks.length).toBe(1);
      expect(mockData.feedbacks[0].content).toBe('希望增加更多筛选条件');
      expect(mockData.feedbacks[0].type).toBe('suggestion');
      expect(mockData.feedbacks[0].source).toBe('user');
    });

    test('反馈应包含用户信息', async () => {
      const cloud = jest.requireMock('wx-server-sdk');
      const mockData = cloud._getMockData();

      // 设置当前用户
      cloud._setOpenId('openid_test_001');

      const event = {
        type: 'bug',
        content: '地图显示不正常'
      };

      const result = await submitFeedback.main(event, {});

      expect(result.success).toBe(true);

      const feedback = mockData.feedbacks[0];
      expect(feedback.openId).toBe('openid_test_001');
      expect(feedback.userId).toBe('user_001'); // 关联到用户
    });

    test('缺少联系信息也应提交成功', async () => {
      const cloud = jest.requireMock('wx-server-sdk');
      const mockData = cloud._getMockData();

      const event = {
        type: 'other',
        content: '应用很好用'
      };

      const result = await submitFeedback.main(event, {});

      expect(result.success).toBe(true);
      expect(mockData.feedbacks.length).toBe(1);
    });
  });

  describe('摊位相关反馈', () => {

    test('应成功提交摊位反馈', async () => {
      const cloud = jest.requireMock('wx-server-sdk');
      const mockData = cloud._getMockData();

      const event = {
        stallId: 'stall_001',
        type: 'info_error',
        content: '摊位位置不准确'
      };

      const result = await submitFeedback.main(event, {});

      expect(result.success).toBe(true);

      const feedback = mockData.feedbacks[0];
      expect(feedback.stallId).toBe('stall_001');
      expect(feedback.source).toBe('stall');
      expect(feedback.type).toBe('info_error');
    });

    test('摊位不存在反馈应标记摊位为过期', async () => {
      const cloud = jest.requireMock('wx-server-sdk');
      const mockData = cloud._getMockData();

      const event = {
        stallId: 'stall_001',
        type: 'not_exist',
        content: '这个摊位已经不在了'
      };

      const result = await submitFeedback.main(event, {});

      expect(result.success).toBe(true);

      // 验证摊位被标记为过期
      const stall = mockData.stalls.find(s => s._id === 'stall_001');
      expect(stall.reliability).toBe(2); // 信息过期
    });

    test('多个用户反馈同一摊位应分别记录', async () => {
      const cloud = jest.requireMock('wx-server-sdk');
      const mockData = cloud._getMockData();

      // 第一个用户反馈
      cloud._setOpenId('openid_test_001');
      await submitFeedback.main({
        stallId: 'stall_002',
        type: 'info_error',
        content: '时间不对'
      }, {});

      // 第二个用户反馈
      cloud._setOpenId('openid_test_002');
      await submitFeedback.main({
        stallId: 'stall_002',
        type: 'not_exist',
        content: '已搬走'
      }, {});

      // 验证有两条反馈记录
      expect(mockData.feedbacks.length).toBe(2);
      expect(mockData.feedbacks[0].openId).toBe('openid_test_001');
      expect(mockData.feedbacks[1].openId).toBe('openid_test_002');
    });
  });

  describe('边界情况', () => {

    test('缺少 type 应使用默认值', async () => {
      const cloud = jest.requireMock('wx-server-sdk');
      const mockData = cloud._getMockData();

      const event = {
        content: '一般反馈'
      };

      const result = await submitFeedback.main(event, {});

      expect(result.success).toBe(true);
      expect(mockData.feedbacks[0].type).toBe('other');
    });

    test('反馈状态应为待处理', async () => {
      const cloud = jest.requireMock('wx-server-sdk');
      const mockData = cloud._getMockData();

      const event = {
        type: 'suggestion',
        content: '建议增加功能'
      };

      await submitFeedback.main(event, {});

      expect(mockData.feedbacks[0].status).toBe(0); // 待处理
    });

    test('未注册用户也能提交反馈', async () => {
      const cloud = jest.requireMock('wx-server-sdk');
      const mockData = cloud._getMockData();

      // 设置一个不存在的用户
      cloud._setOpenId('openid_unknown');

      const event = {
        type: 'suggestion',
        content: '游客反馈'
      };

      const result = await submitFeedback.main(event, {});

      expect(result.success).toBe(true);
      expect(mockData.feedbacks[0].openId).toBe('openid_unknown');
      expect(mockData.feedbacks[0].userId).toBeNull(); // 未关联到用户
    });
  });
});
