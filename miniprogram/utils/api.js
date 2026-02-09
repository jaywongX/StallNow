// 云开发API封装
const cloud = wx.cloud;

/**
 * 获取地摊列表
 * @param {Object} options - 查询选项
 * @param {Number} options.categoryId - 分类ID
 * @param {String} options.timeType - 时间类型
 * @param {String} options.keyword - 搜索关键词
 * @param {String} options.city - 城市
 * @param {Number} options.page - 页码
 * @param {Number} options.pageSize - 每页数量
 */
async function getStalls(options = {}) {
  try {
    const res = await cloud.callFunction({
      name: 'getStalls',
      data: options
    });
    return res.result;
  } catch (err) {
    console.error('获取地摊列表失败', err);
    throw err;
  }
}

/**
 * 获取地摊详情
 * @param {String} stallId - 地摊ID
 */
async function getStallDetail(stallId) {
  try {
    const res = await cloud.callFunction({
      name: 'getStallDetail',
      data: { stallId }
    });
    return res.result;
  } catch (err) {
    console.error('获取地摊详情失败', err);
    throw err;
  }
}

/**
 * 提交入驻申请
 * @param {Object} data - 申请数据
 */
async function submitApplication(data) {
  try {
    const res = await cloud.callFunction({
      name: 'submitApplication',
      data
    });
    return res.result;
  } catch (err) {
    console.error('提交申请失败', err);
    throw err;
  }
}

/**
 * 审核申请（管理员）
 * @param {Object} data - 审核数据
 */
async function auditApplication(data) {
  try {
    const res = await cloud.callFunction({
      name: 'auditApplication',
      data
    });
    return res.result;
  } catch (err) {
    console.error('审核申请失败', err);
    throw err;
  }
}

/**
 * 获取申请列表（管理员）
 * @param {Object} options - 查询选项
 */
async function adminGetApplications(options = {}) {
  try {
    const res = await cloud.callFunction({
      name: 'adminGetApplications',
      data: options
    });
    return res.result;
  } catch (err) {
    console.error('获取申请列表失败', err);
    throw err;
  }
}

/**
 * 摊主确认摊位（扫码确认）
 * @param {String} stallId - 地摊ID
 */
async function confirmStall(stallId) {
  try {
    const res = await cloud.callFunction({
      name: 'confirmStall',
      data: { stallId }
    });
    return res.result;
  } catch (err) {
    console.error('确认摊位失败', err);
    throw err;
  }
}

/**
 * 提交反馈
 * @param {Object} data - 反馈数据
 */
async function submitFeedback(data) {
  try {
    const res = await cloud.callFunction({
      name: 'submitFeedback',
      data
    });
    return res.result;
  } catch (err) {
    console.error('提交反馈失败', err);
    throw err;
  }
}

/**
 * 获取反馈列表（管理员）
 * @param {Object} options - 查询选项
 */
async function getFeedbacks(options = {}) {
  try {
    const res = await cloud.callFunction({
      name: 'getFeedbacks',
      data: options
    });
    return res.result;
  } catch (err) {
    console.error('获取反馈列表失败', err);
    throw err;
  }
}

/**
 * 处理反馈（管理员）
 * @param {Object} data - 处理数据
 */
async function handleFeedback(data) {
  try {
    const res = await cloud.callFunction({
      name: 'handleFeedback',
      data
    });
    return res.result;
  } catch (err) {
    console.error('处理反馈失败', err);
    throw err;
  }
}

/**
 * 一键下线摊位
 * @param {String} stallId - 地摊ID
 */
async function offlineStall(stallId) {
  try {
    const res = await cloud.callFunction({
      name: 'offlineStall',
      data: { stallId }
    });
    return res.result;
  } catch (err) {
    console.error('下线摊位失败', err);
    throw err;
  }
}

/**
 * 绑定摊主微信号
 * @param {Object} data - 绑定数据
 */
async function bindStallOwner(data) {
  try {
    const res = await cloud.callFunction({
      name: 'bindStallOwner',
      data
    });
    return res.result;
  } catch (err) {
    console.error('绑定摊主失败', err);
    throw err;
  }
}

/**
 * 解绑摊主微信号
 * @param {String} stallId - 地摊ID
 */
async function unbindStallOwner(stallId) {
  try {
    const res = await cloud.callFunction({
      name: 'unbindStallOwner',
      data: { stallId }
    });
    return res.result;
  } catch (err) {
    console.error('解绑摊主失败', err);
    throw err;
  }
}

/**
 * 上传图片
 * @param {String} filePath - 本地文件路径
 * @param {String} cloudPath - 云存储路径
 */
async function uploadImage(filePath, cloudPath) {
  try {
    const res = await cloud.uploadFile({
      cloudPath,
      filePath
    });
    return res.fileID;
  } catch (err) {
    console.error('上传图片失败', err);
    throw err;
  }
}

module.exports = {
  getStalls,
  getStallDetail,
  submitApplication,
  auditApplication,
  adminGetApplications,
  confirmStall,
  submitFeedback,
  getFeedbacks,
  handleFeedback,
  offlineStall,
  bindStallOwner,
  unbindStallOwner,
  uploadImage
};
