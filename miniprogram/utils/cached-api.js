/**
 * 带缓存的 API 封装
 * 保持与原 api.js 一致的接口，内部集成缓存逻辑
 */

const cloud = wx.cloud;
const { cacheManager } = require('./cache-manager.js');

/**
 * 生成摊位列表缓存键
 * @param {Object} options - 查询选项
 * @returns {string} 缓存键
 */
function generateStallsCacheKey(options) {
  const city = options.city || '';
  const categoryId = options.categoryId || '';
  const timeType = options.timeType || '';
  const keyword = options.keyword || '';
  const page = options.page || 1;
  return `stalls_${city}_${categoryId}_${timeType}_${keyword}_${page}`;
}

/**
 * 获取地摊列表（带缓存）
 * @param {Object} options - 查询选项
 * @param {Object} cacheOptions - 缓存选项
 * @param {boolean} cacheOptions.useCache - 是否使用缓存（默认true）
 * @param {boolean} cacheOptions.forceRefresh - 是否强制刷新（默认false）
 * @param {number} cacheOptions.ttl - 自定义缓存时间（毫秒）
 */
async function getStalls(options = {}, cacheOptions = {}) {
  const { useCache = true, forceRefresh = false, ttl } = cacheOptions;
  const cacheKey = generateStallsCacheKey(options);

  // 尝试从缓存获取
  if (useCache && !forceRefresh) {
    const cached = cacheManager.get(cacheKey, { type: 'stalls' });
    if (cached && !cached.isExpired) {
      console.log('[Cache] 命中摊位列表缓存', cacheKey);
      return {
        ...cached.data,
        fromCache: true,
        cacheTimestamp: cached.timestamp
      };
    }
  }

  // 调用云函数
  console.log('[Cache] 调用云函数获取摊位列表', forceRefresh ? '(强制刷新)' : '');
  try {
    const res = await cloud.callFunction({
      name: 'getStalls',
      data: options
    });
    
    const result = res.result;
    
    // 写入缓存
    if (useCache) {
      cacheManager.set(cacheKey, result, { 
        type: 'stalls',
        ttl: ttl 
      });
    }
    
    return {
      ...result,
      fromCache: false
    };
  } catch (err) {
    console.error('获取地摊列表失败', err);
    throw err;
  }
}

/**
 * 获取地摊详情（带缓存）
 * @param {string} stallId - 地摊ID
 * @param {Object} cacheOptions - 缓存选项
 */
async function getStallDetail(stallId, cacheOptions = {}) {
  const { useCache = true, forceRefresh = false, ttl } = cacheOptions;
  const cacheKey = `stall_detail_${stallId}`;

  // 尝试从缓存获取
  if (useCache && !forceRefresh) {
    const cached = cacheManager.get(cacheKey, { type: 'stallDetail' });
    if (cached && !cached.isExpired) {
      console.log('[Cache] 命中摊位详情缓存', stallId);
      return {
        ...cached.data,
        fromCache: true,
        cacheTimestamp: cached.timestamp
      };
    }
  }

  // 调用云函数
  console.log('[Cache] 调用云函数获取摊位详情', stallId, forceRefresh ? '(强制刷新)' : '');
  try {
    const res = await cloud.callFunction({
      name: 'getStallDetail',
      data: { stallId }
    });
    
    const result = res.result;
    
    // 写入缓存
    if (useCache) {
      cacheManager.set(cacheKey, result, { 
        type: 'stallDetail',
        ttl: ttl 
      });
    }
    
    return {
      ...result,
      fromCache: false
    };
  } catch (err) {
    console.error('获取地摊详情失败', err);
    throw err;
  }
}

/**
 * 获取分类数据（带缓存）
 * 分类数据变化频率极低，使用长期缓存
 * @param {Object} cacheOptions - 缓存选项
 */
async function getCategories(cacheOptions = {}) {
  const { useCache = true, forceRefresh = false, ttl } = cacheOptions;
  const cacheKey = 'categories';

  // 尝试从缓存获取
  if (useCache && !forceRefresh) {
    const cached = cacheManager.get(cacheKey, { type: 'categories' });
    if (cached && !cached.isExpired) {
      console.log('[Cache] 命中分类数据缓存');
      return {
        data: cached.data,
        fromCache: true,
        cacheTimestamp: cached.timestamp
      };
    }
  }

  // 从数据库加载
  console.log('[Cache] 从数据库加载分类数据', forceRefresh ? '(强制刷新)' : '');
  try {
    const db = wx.cloud.database();
    const res = await db.collection('categories')
      .orderBy('sort', 'asc')
      .get();
    
    const data = res.data || [];
    
    // 写入缓存
    if (useCache) {
      cacheManager.set(cacheKey, data, { 
        type: 'categories',
        ttl: ttl 
      });
    }
    
    return {
      data: data,
      fromCache: false
    };
  } catch (err) {
    console.error('加载分类失败', err);
    throw err;
  }
}

/**
 * 获取用户信息（带缓存）
 * 用户信息仅缓存在内存中
 * @param {Object} cacheOptions - 缓存选项
 */
async function getUserInfo(cacheOptions = {}) {
  const { useCache = true, forceRefresh = false, ttl } = cacheOptions;
  const cacheKey = 'user_info';

  // 尝试从缓存获取
  if (useCache && !forceRefresh) {
    const cached = cacheManager.get(cacheKey, { type: 'userInfo' });
    if (cached && !cached.isExpired) {
      console.log('[Cache] 命中用户信息缓存');
      return {
        ...cached.data,
        fromCache: true
      };
    }
  }

  // 调用云函数
  console.log('[Cache] 调用云函数获取用户信息', forceRefresh ? '(强制刷新)' : '');
  try {
    const res = await cloud.callFunction({
      name: 'getUserInfo'
    });
    
    const result = res.result;
    
    // 写入缓存（仅内存）
    if (useCache && result.code === 0) {
      cacheManager.set(cacheKey, result, { 
        type: 'userInfo',
        ttl: ttl 
      });
    }
    
    return {
      ...result,
      fromCache: false
    };
  } catch (err) {
    console.error('获取用户信息失败', err);
    throw err;
  }
}

/**
 * 清除用户相关缓存
 */
function clearUserCache() {
  cacheManager.remove('user_info');
}

/**
 * 清除摊位详情缓存
 * @param {string} stallId - 摊位ID，不传则清除所有
 */
function clearStallDetailCache(stallId) {
  if (stallId) {
    cacheManager.remove(`stall_detail_${stallId}`);
  } else {
    cacheManager.clearByPrefix('stall_detail_');
  }
}

/**
 * 清除摊位列表缓存
 */
function clearStallsCache() {
  cacheManager.clearByPrefix('stalls_');
}

/**
 * 清除分类缓存
 */
function clearCategoriesCache() {
  cacheManager.remove('categories');
}

/**
 * 清除所有缓存
 */
function clearAllCache() {
  cacheManager.clear();
}

/**
 * 获取缓存统计
 */
function getCacheStats() {
  return cacheManager.getStats();
}

// ==================== 以下是直接透传的API（不缓存）====================

/**
 * 提交入驻申请
 */
async function submitApplication(data) {
  const res = await cloud.callFunction({
    name: 'submitApplication',
    data
  });
  return res.result;
}

/**
 * 审核申请（管理员）
 */
async function auditApplication(data) {
  // 审核后清除相关缓存
  clearStallsCache();
  const res = await cloud.callFunction({
    name: 'auditApplication',
    data
  });
  return res.result;
}

/**
 * 获取申请列表（管理员）
 */
async function adminGetApplications(options = {}) {
  const res = await cloud.callFunction({
    name: 'adminGetApplications',
    data: options
  });
  return res.result;
}

/**
 * 提交反馈
 */
async function submitFeedback(data) {
  const res = await cloud.callFunction({
    name: 'submitFeedback',
    data
  });
  return res.result;
}

/**
 * 获取反馈列表（管理员）
 */
async function getFeedbacks(options = {}) {
  const res = await cloud.callFunction({
    name: 'getFeedbacks',
    data: options
  });
  return res.result;
}

/**
 * 处理反馈（管理员）
 */
async function handleFeedback(data) {
  const res = await cloud.callFunction({
    name: 'handleFeedback',
    data
  });
  return res.result;
}

/**
 * 一键下线摊位
 */
async function offlineStall(stallId) {
  // 清除相关缓存
  clearStallDetailCache(stallId);
  clearStallsCache();
  
  const res = await cloud.callFunction({
    name: 'offlineStall',
    data: { stallId }
  });
  return res.result;
}

/**
 * 绑定摊主微信号
 */
async function bindStallOwner(data) {
  // 清除相关缓存
  clearStallDetailCache(data.stallId);
  clearStallsCache();
  
  const res = await cloud.callFunction({
    name: 'bindStallOwner',
    data
  });
  return res.result;
}

/**
 * 解绑摊主微信号
 */
async function unbindStallOwner(stallId) {
  // 清除相关缓存
  clearStallDetailCache(stallId);
  clearStallsCache();
  
  const res = await cloud.callFunction({
    name: 'unbindStallOwner',
    data: { stallId }
  });
  return res.result;
}

/**
 * 压缩图片
 */
async function compressImage(src, quality = 80) {
  return new Promise((resolve, reject) => {
    wx.compressImage({
      src,
      quality,
      success: resolve,
      fail: reject
    });
  });
}

/**
 * 上传图片
 */
async function uploadImage(filePath, dir = '') {
  const ext = filePath.match(/\.[^.]+$/);
  const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}${ext ? ext[0] : '.jpg'}`;
  const cloudPath = `${dir}${fileName}`;
  
  const res = await cloud.uploadFile({
    cloudPath,
    filePath
  });
  return {
    fileID: res.fileID,
    cloudPath: res.cloudPath
  };
}

/**
 * 更新用户信息后清除缓存
 */
async function updateUserInfo(data) {
  // 清除用户缓存
  clearUserCache();
  
  const res = await cloud.callFunction({
    name: 'updateUserInfo',
    data
  });
  return res.result;
}

/**
 * 更新摊位信息后清除缓存
 */
async function updateStall(data) {
  // 清除相关缓存
  clearStallDetailCache(data.stallId || data._id);
  clearStallsCache();
  
  const res = await cloud.callFunction({
    name: 'updateStall',
    data
  });
  return res.result;
}

module.exports = {
  // 带缓存的API
  getStalls,
  getStallDetail,
  getCategories,
  getUserInfo,
  
  // 缓存管理
  clearUserCache,
  clearStallDetailCache,
  clearStallsCache,
  clearCategoriesCache,
  clearAllCache,
  getCacheStats,
  
  // 透传API
  submitApplication,
  auditApplication,
  adminGetApplications,
  submitFeedback,
  getFeedbacks,
  handleFeedback,
  offlineStall,
  bindStallOwner,
  unbindStallOwner,
  uploadImage,
  compressImage,
  updateUserInfo,
  updateStall
};
