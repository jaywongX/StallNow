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

    // 关键词搜索（支持摊位名称、商家名称、商品标签）
    if (keyword) {
      try {
        queryCommand = queryCommand.where(
          _.or([
            { displayName: db.RegExp({ regexp: keyword, options: 'i' }) },
            { vendorName: db.RegExp({ regexp: keyword, options: 'i' }) },
            { goodsTags: db.RegExp({ regexp: keyword, options: 'i' }) }
          ])
        );
      } catch (regexpErr) {
        // 忽略关键词搜索，继续执行
      }
    }

    // 分页查询
    const countResult = await queryCommand.count();
    const total = countResult.total;

    // 记录搜索日志（异步执行，不影响主流程）
    if (keyword && keyword.trim()) {
      db.collection('searchLogs').add({
        data: {
          keyword: keyword.trim(),
          city: city || '',
          hasResult: total > 0,
          resultCount: total,
          createTime: db.serverDate()
        }
      }).catch(err => {
        console.error('记录搜索日志失败:', err);
      });
    }

    const result = await queryCommand
      .orderBy('updateTime', 'asc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get();

    // 批量获取分类名称（优化：N+1查询 -> 3次查询）
    let categoryMap = {};
    const categoryIds = [...new Set(result.data.map(s => s.categoryId).filter(Boolean))];

    if (categoryIds.length > 0) {
      try {
        const categoriesRes = await db.collection('categories')
          .where({ _id: _.in(categoryIds) })
          .get();
        categoriesRes.data.forEach(c => {
          categoryMap[c._id] = c.name;
        });
      } catch (catErr) {
        console.error('批量获取分类失败:', catErr);
      }
    }

    // 映射分类名称到摊位
    const stalls = result.data.map(stall => ({
      ...stall,
      categoryName: categoryMap[stall.categoryId] || '其他'
    }));

    // 确保每个摊位都有 _id 字段
    let validStalls = stalls.filter(s => {
      if (!s._id) {
        console.error('发现无效数据（无_id）');
      }
      return s._id;
    });

    // 转换图片 URL（cloud:// -> 临时 URL）
    // 分批处理，每批最多50个文件（微信API限制）
    const BATCH_SIZE = 50;
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

    // 分批转换
    const urlMap = {};
    for (let i = 0; i < fileIdList.length; i += BATCH_SIZE) {
      const batch = fileIdList.slice(i, i + BATCH_SIZE);
      try {
        const tempRes = await cloud.getTempFileURL({
          fileList: batch
        });
        if (tempRes.fileList) {
          tempRes.fileList.forEach(item => {
            if (item.status === 0 && item.tempFileURL) {
              urlMap[item.fileID] = item.tempFileURL;
            }
          });
        }
      } catch (urlErr) {
        console.error(`转换图片URL失败(批次${Math.floor(i / BATCH_SIZE) + 1}):`, urlErr);
      }
    }

    // 替换图片URL
    validStalls.forEach(stall => {
      if (stall.images && stall.images.length > 0) {
        stall.images = stall.images.map(img => urlMap[img] || img);
      }
    });

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
