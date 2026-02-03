const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();
const _ = db.command;

/**
 * 获取地摊列表
 * 支持分类、时间、关键词筛选，支持城市过滤
 */
exports.main = async (event, context) => {
  const {
    categoryId,
    timeType,
    keyword,
    city,
    page = 1,
    pageSize = 10
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
      queryCommand = queryCommand.where(
        _.or([
          { displayName: db.RegExp({ regexp: keyword, options: 'i' }) },
          { vendorName: db.RegExp({ regexp: keyword, options: 'i' }) }
        ])
      );
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
    const stalls = await Promise.all(result.data.map(async (stall) => {
      if (stall.categoryId) {
        const category = await db.collection('categories')
          .doc(stall.categoryId)
          .get();
        return {
          ...stall,
          categoryName: category.data ? category.data.name : '其他'
        };
      }
      return { ...stall, categoryName: '其他' };
    }));

    return {
      success: true,
      data: stalls,
      total,
      page,
      pageSize
    };
  } catch (err) {
    console.error('获取地摊列表失败', err);
    return {
      success: false,
      message: '获取地摊列表失败'
    };
  }
};
