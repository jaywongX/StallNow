/**
 * 缓存管理器
 * 实现双层缓存：内存缓存 + Storage持久化缓存
 */

// 缓存键前缀
const CACHE_PREFIX = 'stallnow_';

// 默认缓存时间（毫秒）
const DEFAULT_TTL = 5 * 60 * 1000; // 5分钟

// 缓存类型配置
// 注意：云开发临时文件URL有效期约2小时，摊位相关缓存时间不宜过长
const CACHE_CONFIG = {
  categories: { ttl: 7 * 24 * 60 * 60 * 1000, persist: true },  // 分类数据：7天
  stalls: { ttl: 10 * 60 * 1000, persist: true },               // 摊位列表：10分钟（临时URL有效期限制）
  stallDetail: { ttl: 30 * 60 * 1000, persist: true },          // 摊位详情：30分钟
  userInfo: { ttl: 30 * 60 * 1000, persist: false },            // 用户信息：30分钟，仅内存
  favorites: { ttl: 5 * 60 * 1000, persist: false }             // 收藏列表：5分钟，仅内存
};

// 内存缓存
const memoryCache = new Map();

// 缓存统计
const cacheStats = {
  hits: 0,
  misses: 0,
  memoryHits: 0,
  storageHits: 0
};

/**
 * 缓存管理器类
 */
class CacheManager {
  /**
   * 生成缓存键
   * @param {string} key - 原始键
   * @returns {string} 带前缀的缓存键
   */
  _generateKey(key) {
    return CACHE_PREFIX + key;
  }

  /**
   * 检查缓存是否过期
   * @param {Object} cacheItem - 缓存项
   * @returns {boolean} 是否过期
   */
  _isExpired(cacheItem) {
    if (!cacheItem || !cacheItem.timestamp) return true;
    return Date.now() - cacheItem.timestamp > cacheItem.ttl;
  }

  /**
   * 获取缓存
   * @param {string} key - 缓存键
   * @param {Object} options - 选项
   * @param {boolean} options.checkExpired - 是否检查过期（默认true）
   * @returns {Object|null} 缓存数据或null
   */
  get(key, options = {}) {
    const { checkExpired = true } = options;
    const fullKey = this._generateKey(key);

    // 1. 先检查内存缓存
    const memoryItem = memoryCache.get(fullKey);
    if (memoryItem) {
      if (!checkExpired || !this._isExpired(memoryItem)) {
        cacheStats.hits++;
        cacheStats.memoryHits++;
        return {
          data: memoryItem.data,
          fromCache: true,
          fromMemory: true,
          isExpired: checkExpired ? false : this._isExpired(memoryItem),
          timestamp: memoryItem.timestamp
        };
      }
      // 内存缓存过期，移除
      memoryCache.delete(fullKey);
    }

    // 2. 检查 Storage 缓存
    try {
      const storageItem = wx.getStorageSync(fullKey);
      if (storageItem) {
        if (!checkExpired || !this._isExpired(storageItem)) {
          // 回填到内存缓存
          memoryCache.set(fullKey, storageItem);
          cacheStats.hits++;
          cacheStats.storageHits++;
          return {
            data: storageItem.data,
            fromCache: true,
            fromStorage: true,
            isExpired: checkExpired ? false : this._isExpired(storageItem),
            timestamp: storageItem.timestamp
          };
        }
        // Storage 缓存过期，移除
        wx.removeStorageSync(fullKey);
      }
    } catch (err) {
      console.warn('读取Storage缓存失败', err);
    }

    // 3. 缓存未命中
    cacheStats.misses++;
    return null;
  }

  /**
   * 设置缓存
   * @param {string} key - 缓存键
   * @param {*} data - 缓存数据
   * @param {Object} options - 选项
   * @param {number} options.ttl - 有效期（毫秒）
   * @param {string} options.type - 缓存类型（用于获取默认配置）
   * @param {boolean} options.persist - 是否持久化到Storage
   */
  set(key, data, options = {}) {
    const fullKey = this._generateKey(key);
    
    // 获取配置
    const typeConfig = options.type ? CACHE_CONFIG[options.type] : null;
    const ttl = options.ttl || (typeConfig ? typeConfig.ttl : DEFAULT_TTL);
    const persist = options.persist !== undefined ? options.persist : (typeConfig ? typeConfig.persist : true);

    const cacheItem = {
      data: data,
      timestamp: Date.now(),
      ttl: ttl,
      version: 1
    };

    // 存入内存缓存
    memoryCache.set(fullKey, cacheItem);

    // 持久化到 Storage
    if (persist) {
      try {
        wx.setStorageSync(fullKey, cacheItem);
      } catch (err) {
        console.warn('写入Storage缓存失败', err);
        // Storage 写入失败不影响内存缓存
      }
    }
  }

  /**
   * 删除缓存
   * @param {string} key - 缓存键
   */
  remove(key) {
    const fullKey = this._generateKey(key);
    
    // 删除内存缓存
    memoryCache.delete(fullKey);
    
    // 删除 Storage 缓存
    try {
      wx.removeStorageSync(fullKey);
    } catch (err) {
      console.warn('删除Storage缓存失败', err);
    }
  }

  /**
   * 清空所有缓存
   */
  clear() {
    // 清空内存缓存
    memoryCache.clear();
    
    // 清空 Storage 缓存（只清除带前缀的）
    try {
      const info = wx.getStorageInfoSync();
      const keys = info.keys || [];
      keys.forEach(key => {
        if (key.startsWith(CACHE_PREFIX)) {
          wx.removeStorageSync(key);
        }
      });
    } catch (err) {
      console.warn('清空Storage缓存失败', err);
    }
  }

  /**
   * 清空特定前缀的缓存
   * @param {string} prefix - 缓存键前缀（不含 CACHE_PREFIX）
   */
  clearByPrefix(prefix) {
    const fullPrefix = this._generateKey(prefix);
    
    // 清空内存缓存
    for (const key of memoryCache.keys()) {
      if (key.startsWith(fullPrefix)) {
        memoryCache.delete(key);
      }
    }
    
    // 清空 Storage 缓存
    try {
      const info = wx.getStorageInfoSync();
      const keys = info.keys || [];
      keys.forEach(key => {
        if (key.startsWith(fullPrefix)) {
          wx.removeStorageSync(key);
        }
      });
    } catch (err) {
      console.warn('清空前缀Storage缓存失败', err);
    }
  }

  /**
   * 获取缓存统计
   * @returns {Object} 统计数据
   */
  getStats() {
    const total = cacheStats.hits + cacheStats.misses;
    return {
      ...cacheStats,
      total: total,
      hitRate: total > 0 ? (cacheStats.hits / total * 100).toFixed(2) + '%' : '0%'
    };
  }

  /**
   * 重置统计
   */
  resetStats() {
    cacheStats.hits = 0;
    cacheStats.misses = 0;
    cacheStats.memoryHits = 0;
    cacheStats.storageHits = 0;
  }

  /**
   * 获取缓存类型配置
   * @param {string} type - 缓存类型
   * @returns {Object} 配置
   */
  getTypeConfig(type) {
    return CACHE_CONFIG[type] || { ttl: DEFAULT_TTL, persist: true };
  }

  /**
   * 更新缓存类型配置
   * @param {string} type - 缓存类型
   * @param {Object} config - 配置
   */
  setTypeConfig(type, config) {
    CACHE_CONFIG[type] = { ...CACHE_CONFIG[type], ...config };
  }
}

// 导出单例
const cacheManager = new CacheManager();

module.exports = {
  cacheManager,
  CACHE_PREFIX,
  CACHE_CONFIG,
  DEFAULT_TTL
};
