/**
 * Mock 数据统一导出
 * 测试数据管理中心
 */

const stalls = require('./data/stalls');
const applications = require('./data/applications');

module.exports = {
  // 摊位数据
  ...stalls,
  
  // 申请数据
  ...applications,
  
  /**
   * 重置所有 Mock 数据到初始状态
   * 每个测试用例执行前调用
   */
  resetAll() {
    // 这里可以添加重置逻辑
    // 比如清空临时添加的数据
  },

  /**
   * 创建模拟的云数据库查询结果
   * @param {Array} data - 数据数组
   * @param {Object} options - 选项
   * @returns {Object} 模拟的查询结果
   */
  createMockQueryResult(data, options = {}) {
    const { total = data.length, offset = 0 } = options;
    return {
      data,
      total,
      offset,
      errMsg: 'collection.get:ok'
    };
  },

  /**
   * 创建模拟的云函数调用结果
   * @param {Object} result - 结果数据
   * @param {number} code - 状态码
   * @param {string} message - 消息
   * @returns {Object} 标准化的云函数返回格式
   */
  createMockCloudResult(result, code = 0, message = 'success') {
    return {
      result: {
        code,
        data: result,
        message
      }
    };
  },

  /**
   * 模拟异步延迟
   * @param {number} ms - 延迟毫秒数
   * @returns {Promise}
   */
  delay(ms = 100) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};
