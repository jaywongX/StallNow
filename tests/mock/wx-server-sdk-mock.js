/**
 * wx-server-sdk 统一 Mock 工厂
 * 所有测试文件共享同一个 mock，但可以自定义数据
 */

const { mockStalls, mockCategories } = require('./data/stalls');
const { mockApplications, mockUsers } = require('./data/applications');

// 全局 mock 数据（深拷贝避免污染）
const mockDb = {
  stalls: JSON.parse(JSON.stringify(mockStalls)),
  categories: JSON.parse(JSON.stringify(mockCategories)),
  applications: JSON.parse(JSON.stringify(mockApplications)),
  users: JSON.parse(JSON.stringify(mockUsers)),
  feedbacks: [] // 反馈数据初始为空
};

// 当前模拟的 openid
let mockCurrentOpenId = 'openid_test_001';

// 缓存 database() 返回的对象
let dbInstance = null;

/**
 * 创建数据库 mock 对象
 */
function createDatabaseMock() {
  return {
    collection: jest.fn((name) => {
      const collection = mockDb[name] || [];

      return {
        where: jest.fn(function(query) {
          let data = [...collection];

          if (query && Object.keys(query).length > 0) {
            data = data.filter(item => {
              for (const key in query) {
                const condition = query[key];
                if (condition === undefined) continue;

                if (typeof condition === 'object' && condition !== null) {
                  if (condition.$in) {
                    if (!condition.$in.includes(item[key])) return false;
                  }
                  if (condition.$or) {
                    if (!condition.$or.some(c => item[c.key] === c.value)) return false;
                  }
                } else {
                  if (item[key] !== condition) return false;
                }
              }
              return true;
            });
          }

          this._filteredData = data;
          return this;
        }),

        orderBy: jest.fn(function(field, order) {
          if (this._filteredData) {
            this._filteredData.sort((a, b) => {
              const aVal = a[field];
              const bVal = b[field];
              if (order === 'desc') {
                return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
              }
              return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
            });
          }
          return this;
        }),

        skip: jest.fn(function(n) {
          if (this._filteredData) {
            this._filteredData = this._filteredData.slice(n);
          }
          return this;
        }),

        limit: jest.fn(function(n) {
          if (this._filteredData) {
            this._filteredData = this._filteredData.slice(0, n);
          }
          return this;
        }),

        count: jest.fn(function() {
          return Promise.resolve({
            total: this._filteredData?.length || 0
          });
        }),

        get: jest.fn(function() {
          return Promise.resolve({
            data: this._filteredData || []
          });
        }),

        add: jest.fn(function({ data }) {
          const newItem = {
            _id: `${name}_${Date.now()}`,
            ...data
          };
          mockDb[name].push(newItem);
          return Promise.resolve({
            _id: newItem._id,
            errMsg: 'collection.add:ok'
          });
        }),

        doc: jest.fn(function(id) {
          const item = collection.find(i => i._id === id);
          return {
            get: jest.fn(() => Promise.resolve({ data: item || null })),
            update: jest.fn(function({ data }) {
              if (item) {
                Object.entries(data).forEach(([key, value]) => {
                  if (value && typeof value === 'object' && value.$push !== undefined) {
                    if (!Array.isArray(item[key])) {
                      item[key] = [];
                    }
                    item[key].push(value.$push);
                  } else if (value && typeof value === 'object' && value.$inc !== undefined) {
                    item[key] = (item[key] || 0) + value.$inc;
                  } else {
                    item[key] = value;
                  }
                });
              }
              return Promise.resolve({
                errMsg: 'document.update:ok'
              });
            }),
            remove: jest.fn(function() {
              const index = collection.findIndex(i => i._id === id);
              if (index > -1) {
                collection.splice(index, 1);
              }
              return Promise.resolve({
                errMsg: 'document.remove:ok'
              });
            })
          };
        })
      };
    }),

    command: {
      in: (arr) => ({ $in: arr }),
      or: (conditions) => ({ $or: conditions }),
      and: (conditions) => ({ $and: conditions }),
      eq: (val) => ({ $eq: val }),
      neq: (val) => ({ $neq: val }),
      gte: (val) => ({ $gte: val }),
      lte: (val) => ({ $lte: val }),
      gt: (val) => ({ $gt: val }),
      lt: (val) => ({ $lt: val }),
      push: (val) => ({ $push: val }),
      inc: (val) => ({ $inc: val })
    },

    RegExp: ({ regexp, options }) => new RegExp(regexp, options)
  };
}

/**
 * 创建 wx-server-sdk mock
 * @returns {Object} wx-server-sdk mock 对象
 */
function createWxServerSdkMock() {
  const getDbInstance = () => {
    if (!dbInstance) {
      dbInstance = createDatabaseMock();
    }
    return dbInstance;
  };

  return {
    init: jest.fn(),
    DYNAMIC_CURRENT_ENV: 'test-env',

    getWXContext: jest.fn(() => ({
      OPENID: mockCurrentOpenId,
      APPID: 'test_appid',
      UNIONID: 'test_unionid'
    })),

    _setOpenId: (openId) => {
      mockCurrentOpenId = openId;
    },

    _resetData: () => {
      mockDb.stalls = JSON.parse(JSON.stringify(mockStalls));
      mockDb.categories = JSON.parse(JSON.stringify(mockCategories));
      mockDb.applications = JSON.parse(JSON.stringify(mockApplications));
      mockDb.users = JSON.parse(JSON.stringify(mockUsers));
      mockDb.feedbacks = [];
      mockCurrentOpenId = 'openid_test_001';
      dbInstance = null;
    },

    _resetCollection: (collectionName) => {
      switch (collectionName) {
        case 'stalls':
          mockDb.stalls = JSON.parse(JSON.stringify(mockStalls));
          break;
        case 'categories':
          mockDb.categories = JSON.parse(JSON.stringify(mockCategories));
          break;
        case 'applications':
          mockDb.applications = JSON.parse(JSON.stringify(mockApplications));
          break;
        case 'users':
          mockDb.users = JSON.parse(JSON.stringify(mockUsers));
          break;
        case 'feedbacks':
          mockDb.feedbacks = [];
          break;
      }
    },

    _getMockData: () => {
      return {
        stalls: mockDb.stalls,
        categories: mockDb.categories,
        applications: mockDb.applications,
        users: mockDb.users,
        feedbacks: mockDb.feedbacks
      };
    },

    _setCollection: (collectionName, data) => {
      mockDb[collectionName] = [...data];
    },

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

    database: getDbInstance
  };
}

module.exports = { createWxServerSdkMock };
