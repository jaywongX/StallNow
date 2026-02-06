/**
 * submitApplication 云函数测试
 * 测试入驻申请提交功能
 */

// 导入被测试的云函数
const submitApplication = require('../../cloudfunctions/submitApplication');

describe('submitApplication 云函数测试', () => {

  beforeEach(() => {
    // 重置 mock 数据
    const cloud = jest.requireMock('wx-server-sdk');
    if (cloud._resetData) {
      cloud._resetData();
    }

    // 清空所有待审核申请（避免重复提交检查）
    const mockData = cloud._getMockData();
    cloud._setCollection('applications', mockData.applications.filter(app => app.status !== 0));

    jest.clearAllMocks();
  });

  describe('正常提交场景', () => {
    
    test('完整数据提交应成功', async () => {
      const event = {
        stallData: {
          categoryId: 'category_001',
          categoryName: '烧烤/烤串',
          goodsTags: ['羊肉串', '牛肉串'],
          landmark: '红色棚子',
          location: {
            latitude: 23.1291,
            longitude: 113.2644,
            address: '老街夜市'
          },
          address: '老街夜市东口',
          city: '汕尾市',
          scheduleTypes: ['evening'],
          schedule: {
            type: 'evening',
            timeRange: '18:00-02:00'
          },
          contact: {
            hasContact: true,
            phone: '13800138000'
          },
          description: '招牌烧烤',
          vendorName: '老王烧烤'
        }
      };

      const result = await submitApplication.main(event, {});

      expect(result.code).toBe(0);
      expect(result.message).toBe('申请提交成功');
      expect(result.data).toHaveProperty('applicationId');
    });

    test('最小数据提交应成功', async () => {
      const event = {
        stallData: {
          categoryId: 'category_001',
          categoryName: '烧烤',
          landmark: '红色棚子',
          location: {
            latitude: 23.1291,
            longitude: 113.2644
          },
          scheduleTypes: ['evening']
        }
      };

      const result = await submitApplication.main(event, {});

      expect(result.code).toBe(0);
      expect(result.message).toBe('申请提交成功');
    });

    test('未注册用户应返回错误', async () => {
      const cloud = jest.requireMock('wx-server-sdk');
      cloud._setOpenId('openid_not_exist');
      
      const event = {
        stallData: {
          categoryId: 'category_001',
          categoryName: '烧烤',
          landmark: '红色棚子',
          location: { latitude: 23.1291, longitude: 113.2644 },
          scheduleTypes: ['evening']
        }
      };
      
      const result = await submitApplication.main(event, {});
      
      expect(result.code).toBe(-1);
      expect(result.message).toBe('用户未注册');
    });

    test('已有待审核申请应阻止重复提交', async () => {
      const cloud = jest.requireMock('wx-server-sdk');

      // 手动添加一个待审核申请
      const mockData = cloud._getMockData();
      const currentUserId = mockData.users.find(u => u._openid === 'openid_test_001')._id;
      const existingApp = {
        _id: 'app_pending_test',
        userId: currentUserId,
        stallData: {
          displayName: '测试摊位',
          categoryId: 'category_001',
          landmark: '测试地',
          location: { latitude: 23.1291, longitude: 113.2644 },
          schedule: { type: 'evening' },
          images: [],
          contact: { hasContact: false }
        },
        status: 0,
        submitTime: new Date()
      };
      mockData.applications.push(existingApp);
      cloud._setCollection('applications', [...mockData.applications]);

      const event = {
        stallData: {
          categoryId: 'category_001',
          categoryName: '烧烤',
          landmark: '红色棚子',
          location: { latitude: 23.1291, longitude: 113.2644 },
          scheduleTypes: ['evening']
        }
      };

      const result = await submitApplication.main(event, {});

      expect(result.code).toBe(-1);
      expect(result.message).toContain('请勿重复提交');
    });

    test('已是摊主应阻止再次申请', async () => {
      const cloud = jest.requireMock('wx-server-sdk');
      cloud._setOpenId('openid_test_002');
      
      const event = {
        stallData: {
          categoryId: 'category_001',
          categoryName: '烧烤',
          landmark: '红色棚子',
          location: { latitude: 23.1291, longitude: 113.2644 },
          scheduleTypes: ['evening']
        }
      };
      
      const result = await submitApplication.main(event, {});
      
      expect(result.code).toBe(-1);
      expect(result.message).toContain('已是摊主');
    });
  });
});
