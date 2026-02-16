const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();
const _ = db.command;

/**
 * 获取地摊列表
 * 支持分类、时间、关键词、距离筛选，支持城市过滤
 */
exports.main = async (event, context) => {
  const {
    categoryId,
    timeType,
    keyword,
    city,
    page = 1,
    pageSize = 10,
    latitude,      // 用户纬度（用于距离筛选和排序）
    longitude,     // 用户经度
    maxDistance    // 最大距离（米）
  } = event;

  try {
    // 构建查询条件
    let query = {
      status: 1, // 只查询已上架的摊位
      reliability: _.in([0, 1]) // 只显示近期确认和可能还在的
    };

    if (city) {
      query.city = city;
    }

    if (categoryId) {
      query.categoryId = categoryId;
    }

    if (timeType) {
      query['schedule.type'] = timeType;
    }

    // 执行查询
    let queryCommand = db.collection('stalls').where(query);

    // 关键词搜索
    if (keyword) {
      try {
        queryCommand = queryCommand.where(
          _.or([
            { displayName: db.RegExp({ regexp: keyword, options: 'i' }) },
            { vendorName: db.RegExp({ regexp: keyword, options: 'i' }) }
          ])
        );
      } catch (regexpErr) {
        // 忽略关键词搜索，继续执行
      }
    }

    // 分页查询
    const countResult = await queryCommand.count();
    const total = countResult.total;

    const result = await queryCommand
      .orderBy('updateTime', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get();

    // 获取分类名称
    let stalls = [];
    try {
      stalls = await Promise.all(result.data.map(async (stall) => {
        if (stall.categoryId) {
          try {
            const category = await db.collection('categories')
              .doc(stall.categoryId)
              .get();
            return {
              ...stall,
              categoryName: category.data ? category.data.name : '其他'
            };
          } catch (catErr) {
            return { ...stall, categoryName: '其他' };
          }
        }
        return { ...stall, categoryName: '其他' };
      }));
    } catch (mapErr) {
      // 如果获取分类失败，直接返回原始数据
      stalls = result.data.map(s => ({ ...s, categoryName: '其他' }));
    }

    // 确保每个摊位都有 _id 字段
    let validStalls = stalls.filter(s => {
      if (!s._id) {
        console.error('发现无效数据（无_id）');
      }
      return s._id;
    });

    // 转换图片 URL（cloud:// -> 临时 URL）
    const fileIdList = [];
    validStalls.forEach(stall => {
      if (stall.images && stall.images.length > 0) {
        stall.images.forEach(img => {
          if (img && img.startsWith('cloud://')) {
            fileIdList.push(img);
          }
        });
      }
    });

    if (fileIdList.length > 0) {
      try {
        const tempRes = await cloud.getTempFileURL({
          fileList: fileIdList
        });
        const urlMap = {};
        if (tempRes.fileList) {
          tempRes.fileList.forEach(item => {
            if (item.status === 0 && item.tempFileURL) {
              urlMap[item.fileID] = item.tempFileURL;
            }
          });
        }

        // 替换图片URL
        validStalls.forEach(stall => {
          if (stall.images && stall.images.length > 0) {
            stall.images = stall.images.map(img => urlMap[img] || img);
          }
        });
      } catch (urlErr) {
        console.error('转换图片URL失败:', urlErr);
      }
    }

    return {
      code: 0,
      data: validStalls,
      total,
      page,
      pageSize
    };
  } catch (err) {
    console.error('获取地摊列表失败:', err);
    return {
      code: -1,
      message: '获取地摊列表失败: ' + err.message
    };
  }
};
