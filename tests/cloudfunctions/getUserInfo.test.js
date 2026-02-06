/**
 * getUserInfo 云函数测试
 * 测试用户信息获取功能（含自动注册）
 */

// 导入被测试的云函数
const getUserInfo = require('../../cloudfunctions/getUserInfo');

describe('getUserInfo 云函数测试', () => {

  beforeEach(() => {
    // 重置 mock 数据
    const cloud = jest.requireMock('wx-server-sdk');
    if (cloud._resetData) {
      cloud._resetData();
    }
    jest.clearAllMocks();
  });

  describe('已注册用户查询', () => {

    test('已存在用户应返回用户信息', async () => {
      const cloud = jest.requireMock('wx-server-sdk');
      const mockData = cloud._getMockData();

      // 确认用户存在
      const existingUser = mockData.users.find(u => u._openid === 'openid_test_001');
      expect(existingUser).toBeDefined();

      const result = await getUserInfo.main({}, {});

      expect(result.code).toBe(0);
      expect(result.data).toBeDefined();
      expect(result.data._openid).toBe('openid_test_001');
      expect(result.data.role).toBeDefined();
    });

    test('返回的用户信息应包含必要字段', async () => {
      const result = await getUserInfo.main({}, {});

      expect(result.code).toBe(0);
      expect(result.data).toHaveProperty('_id');
      expect(result.data).toHaveProperty('_openid');
      expect(result.data).toHaveProperty('role');
      expect(result.data).toHaveProperty('nickName');
      expect(result.data).toHaveProperty('avatarUrl');
      expect(result.data).toHaveProperty('createTime');
    });

    test('摊主用户应返回 vendor 角色', async () => {
      const cloud = jest.requireMock('wx-server-sdk');
      // 切换到摊主用户
      cloud._setOpenId('openid_test_002');

      const result = await getUserInfo.main({}, {});

      expect(result.code).toBe(0);
      expect(result.data.role).toBe('vendor');
    });

    test('普通用户应返回 user 角色', async () => {
      const cloud = jest.requireMock('wx-server-sdk');
      // 切换到普通用户
      cloud._setOpenId('openid_test_001');

      const result = await getUserInfo.main({}, {});

      expect(result.code).toBe(0);
      expect(result.data.role).toBe('user');
    });
  });

  describe('新用户自动注册', () => {

    test('不存在的用户应自动创建新用户', async () => {
      const cloud = jest.requireMock('wx-server-sdk');
      const mockData = cloud._getMockData();

      // 切换到不存在的用户
      cloud._setOpenId('openid_new_user');

      const usersCountBefore = mockData.users.length;

      const result = await getUserInfo.main({}, {});

      expect(result.code).toBe(0);
      expect(result.data).toBeDefined();
      expect(result.data._openid).toBe('openid_new_user');

      // 验证用户已添加到数据库
      expect(mockData.users.length).toBe(usersCountBefore + 1);

      // 验证新用户角色为 user
      expect(result.data.role).toBe('user');
    });

    test('新用户应包含默认字段值', async () => {
      const cloud = jest.requireMock('wx-server-sdk');
      cloud._setOpenId('openid_new_user_2');

      const result = await getUserInfo.main({}, {});

      expect(result.code).toBe(0);
      expect(result.data.nickName).toBe('');
      expect(result.data.avatarUrl).toBe('');
      expect(result.data.stallIds).toEqual([]);
      expect(result.data.favorites).toEqual([]);
    });
  });

  describe('边界情况', () => {

    test('管理员用户应返回 admin 角色', async () => {
      const cloud = jest.requireMock('wx-server-sdk');
      // 切换到管理员用户
      cloud._setOpenId('openid_admin_001');

      const result = await getUserInfo.main({}, {});

      expect(result.code).toBe(0);
      expect(result.data.role).toBe('admin');
    });

    test('连续调用应返回相同用户信息', async () => {
      const result1 = await getUserInfo.main({}, {});
      const result2 = await getUserInfo.main({}, {});

      expect(result1.code).toBe(0);
      expect(result2.code).toBe(0);
      expect(result1.data._id).toBe(result2.data._id);
    });
  });
});
