/**
 * getStallDetail 云函数测试
 * 测试摊位详情查询 + 访问计数功能
 */

// 云函数会在 beforeAll 中加载，确保 mock 完全准备好
let getStallDetail;

describe('getStallDetail 云函数测试', () => {

  beforeAll(() => {
    // 确保 mock 已初始化
    const cloud = jest.requireMock('wx-server-sdk');
    cloud.database(); // 预初始化

    // 现在加载云函数
    getStallDetail = require('../../cloudfunctions/getStallDetail');
  });

  beforeEach(() => {
    // 重置 mock 数据
    const cloud = jest.requireMock('wx-server-sdk');
    cloud._resetData();
    jest.clearAllMocks();
  });

  describe('正常查询', () => {

    test('应返回摊位详情', async () => {
      const cloud = jest.requireMock('wx-server-sdk');
      const mockData = cloud._getMockData();
      console.log('mock stalls:', mockData.stalls.map(s => s._id));

      const event = {
        stallId: 'stall_001'
      };

      const result = await getStallDetail.main(event, {});

      console.log('查询结果:', result);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data._id).toBe('stall_001');
      expect(result.data.displayName).toBeDefined();
    });

    test('应返回分类名称', async () => {
      const event = {
        stallId: 'stall_001'
      };

      const result = await getStallDetail.main(event, {});

      expect(result.success).toBe(true);
      expect(result.data.categoryName).toBeDefined();
      expect(result.data.categoryName).toBe('烧烤/烤串');
    });

    test('无分类的摊位应返回"其他"', async () => {
      const cloud = jest.requireMock('wx-server-sdk');
      const mockData = cloud._getMockData();

      // 创建一个无分类的摊位
      const noCategoryStall = {
        _id: 'stall_no_category',
        displayName: '无分类摊位',
        categoryId: '',
        status: 1
      };
      mockData.stalls.push(noCategoryStall);
      cloud._setCollection('stalls', [...mockData.stalls]);

      const event = {
        stallId: 'stall_no_category'
      };

      const result = await getStallDetail.main(event, {});

      expect(result.success).toBe(true);
      expect(result.data.categoryName).toBe('其他');
    });
  });

  describe('访问计数', () => {

    test('应增加访问计数', async () => {
      const cloud = jest.requireMock('wx-server-sdk');
      const mockData = cloud._getMockData();

      const initialViewCount = mockData.stalls.find(s => s._id === 'stall_001').viewCount || 0;

      const event = {
        stallId: 'stall_001'
      };

      await getStallDetail.main(event, {});

      // 验证访问计数已增加
      const updatedStall = mockData.stalls.find(s => s._id === 'stall_001');
      expect(updatedStall.viewCount).toBe(initialViewCount + 1);
    });

    test('多次访问应持续增加计数', async () => {
      const cloud = jest.requireMock('wx-server-sdk');
      const mockData = cloud._getMockData();

      const initialViewCount = mockData.stalls.find(s => s._id === 'stall_002').viewCount || 0;

      const event = {
        stallId: 'stall_002'
      };

      // 连续访问3次
      await getStallDetail.main(event, {});
      await getStallDetail.main(event, {});
      await getStallDetail.main(event, {});

      const updatedStall = mockData.stalls.find(s => s._id === 'stall_002');
      expect(updatedStall.viewCount).toBe(initialViewCount + 3);
    });
  });

  describe('异常情况', () => {

    test('不存在的摊位应返回错误', async () => {
      const event = {
        stallId: 'stall_nonexistent'
      };

      const result = await getStallDetail.main(event, {});

      expect(result.success).toBe(false);
      expect(result.message).toContain('不存在');
    });

    test('缺少 stallId 应返回错误', async () => {
      const event = {};

      const result = await getStallDetail.main(event, {});

      expect(result.success).toBe(false);
    });
  });
});
