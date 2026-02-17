/**
 * 缓存管理器测试
 */

// 模拟微信 API
global.wx = {
  getStorageSync: jest.fn((key) => {
    const storage = global.__mockStorage__ || {};
    return storage[key];
  }),
  setStorageSync: jest.fn((key, value) => {
    global.__mockStorage__ = global.__mockStorage__ || {};
    global.__mockStorage__[key] = value;
  }),
  removeStorageSync: jest.fn((key) => {
    global.__mockStorage__ = global.__mockStorage__ || {};
    delete global.__mockStorage__[key];
  }),
  getStorageInfoSync: jest.fn(() => {
    const storage = global.__mockStorage__ || {};
    return { keys: Object.keys(storage) };
  })
};

// 引入缓存管理器
const { cacheManager, CACHE_PREFIX, DEFAULT_TTL } = require('../../miniprogram/utils/cache-manager.js');

describe('CacheManager', () => {
  beforeEach(() => {
    // 清空存储
    global.__mockStorage__ = {};
    cacheManager.clear();
    cacheManager.resetStats();
  });

  describe('基本功能', () => {
    test('应该能设置和获取缓存', () => {
      const testData = { name: 'test', value: 123 };
      cacheManager.set('test_key', testData, { ttl: 60000 });
      
      const result = cacheManager.get('test_key');
      expect(result).not.toBeNull();
      expect(result.data).toEqual(testData);
      expect(result.fromCache).toBe(true);
    });

    test('应该使用正确的缓存键前缀', () => {
      cacheManager.set('my_key', 'value');
      
      // 验证存储的键带有前缀
      expect(global.__mockStorage__[CACHE_PREFIX + 'my_key']).toBeDefined();
    });

    test('应该能删除缓存', () => {
      cacheManager.set('test_key', 'value');
      cacheManager.remove('test_key');
      
      const result = cacheManager.get('test_key');
      expect(result).toBeNull();
    });

    test('应该能清空所有缓存', () => {
      cacheManager.set('key1', 'value1');
      cacheManager.set('key2', 'value2');
      cacheManager.clear();
      
      expect(cacheManager.get('key1')).toBeNull();
      expect(cacheManager.get('key2')).toBeNull();
    });
  });

  describe('过期机制', () => {
    test('过期缓存不应返回', () => {
      const testData = { name: 'test' };
      // 设置 1ms 过期
      cacheManager.set('test_key', testData, { ttl: 1 });
      
      // 等待过期
      return new Promise(resolve => {
        setTimeout(() => {
          const result = cacheManager.get('test_key');
          expect(result).toBeNull();
          resolve();
        }, 10);
      });
    });

    test('可以获取过期的缓存（不检查过期）', () => {
      const testData = { name: 'test' };
      cacheManager.set('test_key', testData, { ttl: 1 });
      
      return new Promise(resolve => {
        setTimeout(() => {
          const result = cacheManager.get('test_key', { checkExpired: false });
          expect(result).not.toBeNull();
          expect(result.isExpired).toBe(true);
          resolve();
        }, 10);
      });
    });
  });

  describe('缓存统计', () => {
    test('应该正确统计命中和未命中', () => {
      cacheManager.set('key1', 'value1');
      
      // 命中
      cacheManager.get('key1');
      // 未命中
      cacheManager.get('key_not_exist');
      
      const stats = cacheManager.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe('50.00%');
    });
  });

  describe('前缀清理', () => {
    test('应该能按前缀清理缓存', () => {
      cacheManager.set('stalls_list1', 'value1');
      cacheManager.set('stalls_list2', 'value2');
      cacheManager.set('other_key', 'value3');
      
      cacheManager.clearByPrefix('stalls_');
      
      expect(cacheManager.get('stalls_list1')).toBeNull();
      expect(cacheManager.get('stalls_list2')).toBeNull();
      expect(cacheManager.get('other_key')).not.toBeNull();
    });
  });

  describe('类型配置', () => {
    test('应该能获取类型配置', () => {
      const config = cacheManager.getTypeConfig('categories');
      expect(config.ttl).toBe(7 * 24 * 60 * 60 * 1000); // 7天
      expect(config.persist).toBe(true);
    });
  });
});
