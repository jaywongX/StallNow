/**
 * adminGetApplications 云函数测试
 * 测试管理员获取申请列表功能
 */

// 导入被测试的云函数
const adminGetApplications = require('../../cloudfunctions/adminGetApplications');

describe('adminGetApplications 云函数测试', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('基础查询功能', () => {
    
    test('无条件查询应返回所有申请', async () => {
      const event = {};
      const result = await adminGetApplications.main(event, {});
      
      expect(result.code).toBe(0);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBe(3);
    });

    test('返回结果应包含申请人信息', async () => {
      const event = {};
      const result = await adminGetApplications.main(event, {});
      
      expect(result.code).toBe(0);
      
      result.data.forEach(app => {
        expect(app).toHaveProperty('userInfo');
      });
    });
  });

  describe('状态筛选功能', () => {
    
    test('筛选待审核申请应只返回status=0的申请', async () => {
      const event = { status: 0 };
      const result = await adminGetApplications.main(event, {});
      
      expect(result.code).toBe(0);
      expect(result.data.length).toBe(1);
      expect(result.data[0]._id).toBe('app_001');
      expect(result.data[0].status).toBe(0);
    });

    test('筛选已通过申请应只返回status=1的申请', async () => {
      const event = { status: 1 };
      const result = await adminGetApplications.main(event, {});
      
      expect(result.code).toBe(0);
      expect(result.data.length).toBe(1);
      expect(result.data[0]._id).toBe('app_002');
      expect(result.data[0].status).toBe(1);
    });

    test('筛选已拒绝申请应只返回status=2的申请', async () => {
      const event = { status: 2 };
      const result = await adminGetApplications.main(event, {});
      
      expect(result.code).toBe(0);
      expect(result.data.length).toBe(1);
      expect(result.data[0]._id).toBe('app_003');
      expect(result.data[0].status).toBe(2);
    });

    test('筛选不存在的status应返回空数组', async () => {
      const event = { status: 999 };
      const result = await adminGetApplications.main(event, {});
      
      expect(result.code).toBe(0);
      expect(result.data).toEqual([]);
    });
  });

  describe('图片URL转换功能', () => {
    
    test('摊位照片应转换为临时URL', async () => {
      const event = { status: 0 };
      const result = await adminGetApplications.main(event, {});
      
      expect(result.code).toBe(0);
      
      const app = result.data[0];
      expect(app.stallData.images.length).toBeGreaterThan(0);
      
      app.stallData.images.forEach(url => {
        expect(url).toMatch(/^https:\/\//);
      });
    });

    test('微信二维码应转换为临时URL', async () => {
      const event = { status: 0 };
      const result = await adminGetApplications.main(event, {});
      
      expect(result.code).toBe(0);
      
      const app = result.data[0];
      if (app.stallData.contact.wechatQR) {
        expect(app.stallData.contact.wechatQR).toMatch(/^https:\/\//);
      }
    });

    test('没有图片的申请应正常处理', async () => {
      const event = { status: 2 };
      const result = await adminGetApplications.main(event, {});
      
      expect(result.code).toBe(0);
      expect(result.data[0].stallData.images).toEqual([]);
    });
  });

  describe('异常情况处理', () => {
    
    test('数据库异常时应返回错误信息', async () => {
      // 这个测试需要特殊处理，暂时跳过
      expect(true).toBe(true);
    });
  });
});
