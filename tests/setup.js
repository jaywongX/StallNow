/**
 * Jest 测试前置配置
 * 在所有测试运行前执行
 */

// 全局测试超时设置
jest.setTimeout(10000);

// 全局测试工具函数
global.mockCloudFunction = (fn) => {
  return async (event = {}, context = {}) => {
    return fn.main(event, context);
  };
};

// 清理 console 方法（避免测试输出太多日志）
if (process.env.CI) {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn()
  };
}

/**
 * 全局配置 wx-server-sdk mock
 * 所有测试文件共享同一个 mock 实例
 */
const { createWxServerSdkMock: mockCreateWxServerSdkMock } = require('./mock/wx-server-sdk-mock');
jest.mock('wx-server-sdk', () => mockCreateWxServerSdkMock(), { virtual: true });

// 预初始化 database()，确保云函数模块加载时 db.command 已就绪
const mockCloud = jest.requireMock('wx-server-sdk');
mockCloud.database();
