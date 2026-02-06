/**
 * 测试辅助工具函数
 * 简化测试代码编写
 */

/**
 * 创建模拟的云数据库实例
 * @param {Object} mockData - 模拟数据配置
 * @returns {Object} 模拟的数据库实例
 */
function createMockDatabase(mockData = {}) {
  const {
    stalls = [],
    applications = [],
    users = [],
    categories = []
  } = mockData;

  // 存储所有数据
  const dataStore = {
    stalls: [...stalls],
    applications: [...applications],
    users: [...users],
    categories: [...categories]
  };

  // 模拟 collection 方法
  const mockCollection = (collectionName) => {
    const collection = dataStore[collectionName] || [];
    let queryResult = [...collection];
    let chainedQuery = null;

    const chainMethods = {
      where(condition) {
        if (condition) {
          queryResult = queryResult.filter(item => {
            return Object.entries(condition).every(([key, value]) => {
              if (typeof value === 'object' && value !== null) {
                // 处理复杂查询条件（如 $in, $gte 等）
                return matchComplexCondition(item[key], value);
              }
              return item[key] === value;
            });
          });
        }
        return chainMethods;
      },

      orderBy(field, order = 'asc') {
        queryResult.sort((a, b) => {
          const aVal = a[field];
          const bVal = b[field];
          if (order === 'desc') {
            return bVal > aVal ? 1 : -1;
          }
          return aVal > bVal ? 1 : -1;
        });
        return chainMethods;
      },

      skip(n) {
        queryResult = queryResult.slice(n);
        return chainMethods;
      },

      limit(n) {
        queryResult = queryResult.slice(0, n);
        return chainMethods;
      },

      async get() {
        return {
          data: queryResult,
          errMsg: 'collection.get:ok'
        };
      },

      async add({ data }) {
        const newItem = {
          _id: `mock_${Date.now()}`,
          ...data,
          createTime: new Date()
        };
        collection.push(newItem);
        return {
          _id: newItem._id,
          errMsg: 'collection.add:ok'
        };
      },

      doc(id) {
        const item = queryResult.find(i => i._id === id);
        return {
          async get() {
            return {
              data: item || null,
              errMsg: 'document.get:ok'
            };
          },
          async update({ data }) {
            if (item) {
              Object.assign(item, data, { updateTime: new Date() });
            }
            return {
              stats: { updated: item ? 1 : 0 },
              errMsg: 'document.update:ok'
            };
          },
          async remove() {
            const index = collection.findIndex(i => i._id === id);
            if (index > -1) {
              collection.splice(index, 1);
            }
            return {
              stats: { removed: index > -1 ? 1 : 0 },
              errMsg: 'document.remove:ok'
            };
          }
        };
      }
    };

    return chainMethods;
  };

  // 模拟 command
  const mockCommand = {
    in: (arr) => ({ $in: arr }),
    gte: (val) => ({ $gte: val }),
    lte: (val) => ({ $lte: val }),
    and: (...conditions) => ({ $and: conditions }),
    or: (...conditions) => ({ $or: conditions })
  };

  return {
    collection: mockCollection,
    command: mockCommand,
    // 测试辅助方法
    _getData: (collectionName) => dataStore[collectionName],
    _clear: (collectionName) => {
      if (collectionName) {
        dataStore[collectionName] = [];
      } else {
        Object.keys(dataStore).forEach(key => {
          dataStore[key] = [];
        });
      }
    }
  };
}

/**
 * 匹配复杂查询条件
 * @param {*} value - 字段值
 * @param {Object} condition - 条件对象
 * @returns {boolean}
 */
function matchComplexCondition(value, condition) {
  if (condition.$in) {
    return condition.$in.includes(value);
  }
  if (condition.$gte !== undefined) {
    return value >= condition.$gte;
  }
  if (condition.$lte !== undefined) {
    return value <= condition.$lte;
  }
  if (condition.$gt !== undefined) {
    return value > condition.$gt;
  }
  if (condition.$lt !== undefined) {
    return value < condition.$lt;
  }
  return false;
}

/**
 * 创建模拟的云开发环境
 * @param {Object} options - 配置选项
 * @returns {Object} 模拟的云开发实例
 */
function createMockCloud(options = {}) {
  const db = createMockDatabase(options);

  return {
    init: jest.fn(),
    DYNAMIC_CURRENT_ENV: 'test-env',
    database: () => db,
    getTempFileURL: jest.fn(async ({ fileList }) => {
      return {
        fileList: fileList.map(fileId => ({
          fileID: fileId,
          tempFileURL: `https://tmp.example.com/${fileId.replace(/.*\//, '')}`,
          status: 0,
          errMsg: 'ok'
        })),
        errMsg: 'getTempFileURL:ok'
      };
    }),
    uploadFile: jest.fn(async ({ cloudPath, fileContent }) => {
      return {
        fileID: `cloud://test-env/${cloudPath}`,
        statusCode: 200,
        errMsg: 'uploadFile:ok'
      };
    }),
    deleteFile: jest.fn(async ({ fileList }) => {
      return {
        fileList: fileList.map(() => ({ status: 0, errMsg: 'ok' })),
        errMsg: 'deleteFile:ok'
      };
    }),
    // 暴露数据库供测试使用
    _db: db
  };
}

/**
 * 创建模拟的事件对象（云函数入参）
 * @param {Object} data - 事件数据
 * @param {Object} userInfo - 用户信息
 * @returns {Object} 模拟的事件对象
 */
function createMockEvent(data = {}, userInfo = {}) {
  return {
    ...data,
    userInfo: {
      openId: 'mock_openid_' + Date.now(),
      appId: 'mock_appid',
      unionId: 'mock_unionid',
      ...userInfo
    }
  };
}

/**
 * 创建模拟的上下文对象（云函数上下文）
 * @returns {Object} 模拟的上下文对象
 */
function createMockContext() {
  return {
    function_name: 'test-function',
    memory_limit_in_mb: 256,
    time_limit_in_ms: 3000,
    request_id: 'mock-request-' + Date.now(),
    environment: 'test'
  };
}

/**
 * 断言云函数返回格式正确
 * @param {Object} result - 云函数返回结果
 * @param {number} expectedCode - 期望的状态码
 */
function assertCloudResult(result, expectedCode = 0) {
  expect(result).toHaveProperty('code');
  expect(result).toHaveProperty('data');
  expect(result).toHaveProperty('message');
  expect(result.code).toBe(expectedCode);
}

/**
 * 等待指定时间
 * @param {number} ms - 毫秒数
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  createMockDatabase,
  createMockCloud,
  createMockEvent,
  createMockContext,
  assertCloudResult,
  sleep
};
