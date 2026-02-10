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
    console.log('[DEBUG getStalls] 请求参数:', { categoryId, timeType, keyword, city, page, pageSize });
    
    // 构建查询条件
    let query = {
      status: 1, // 只查询已上架的摊位
      reliability: _.in([0, 1]) // 只显示近期确认和可能还在的
    };

    if (city) {
      query.city = city;
      console.log('[DEBUG getStalls] 按城市筛选:', city);
    } else {
      console.log('[DEBUG getStalls] 未指定城市，查询所有城市');
    }

    if (categoryId) {
      query.categoryId = categoryId;
    }

    if (timeType) {
      query['schedule.type'] = timeType;
    }
    
    console.log('[DEBUG getStalls] 查询条件:', JSON.stringify(query));

    // 执行查询
    let queryCommand = db.collection('stalls').where(query);

    // 关键词搜索
    if (keyword) {
      console.log('[DEBUG getStalls] 添加关键词搜索:', keyword);
      try {
        queryCommand = queryCommand.where(
          _.or([
            { displayName: db.RegExp({ regexp: keyword, options: 'i' }) },
            { vendorName: db.RegExp({ regexp: keyword, options: 'i' }) }
          ])
        );
      } catch (regexpErr) {
        console.error('[DEBUG getStalls] RegExp 错误:', regexpErr);
        // 忽略关键词搜索，继续执行
      }
    }

    // 分页查询
    const countResult = await queryCommand.count();
    const total = countResult.total;
    console.log('[DEBUG getStalls] 总记录数:', total);

    const result = await queryCommand
      .orderBy('updateTime', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get();
    
    console.log('[DEBUG getStalls] 查询结果条数:', result.data.length);

    // 获取分类名称
    console.log('[DEBUG getStalls] 开始获取分类名称...');
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
            console.error('[DEBUG getStalls] 获取分类失败:', stall.categoryId, catErr.message);
            return { ...stall, categoryName: '其他' };
          }
        }
        return { ...stall, categoryName: '其他' };
      }));
    } catch (mapErr) {
      console.error('[DEBUG getStalls] 处理分类时出错:', mapErr);
      // 如果获取分类失败，直接返回原始数据
      stalls = result.data.map(s => ({ ...s, categoryName: '其他' }));
    }
    console.log('[DEBUG getStalls] 处理后的摊位数量:', stalls.length);
    if (stalls.length > 0) {
      console.log('[DEBUG getStalls] 第一条数据:', JSON.stringify(stalls[0]));
      console.log('[DEBUG getStalls] 第一条数据的_id:', stalls[0]._id);
    }

    // 确保每个摊位都有 _id 字段
    let validStalls = stalls.filter(s => {
      if (!s._id) {
        console.error('[DEBUG getStalls] 发现无效数据（无_id）:', s);
      }
      return s._id;
    });
    if (validStalls.length !== stalls.length) {
      console.error(`[DEBUG getStalls] 过滤掉 ${stalls.length - validStalls.length} 条无效数据`);
    }

    // 转换图片 URL（cloud:// -> 临时 URL）
    console.log('[DEBUG getStalls] 开始转换图片URL...');
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
    console.log('[DEBUG getStalls] 需要转换的图片数量:', fileIdList.length);

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
        console.log('[DEBUG getStalls] URL映射:', Object.keys(urlMap).length);

        // 替换图片URL
        validStalls.forEach(stall => {
          if (stall.images && stall.images.length > 0) {
            stall.images = stall.images.map(img => urlMap[img] || img);
          }
        });
      } catch (urlErr) {
        console.error('[DEBUG getStalls] 转换图片URL失败:', urlErr);
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
    console.error('[DEBUG getStalls] 错误详情:', err);
    console.error('[DEBUG getStalls] 错误消息:', err.message);
    console.error('[DEBUG getStalls] 错误堆栈:', err.stack);
    return {
      code: -1,
      message: '获取地摊列表失败: ' + err.message
    };
  }
};
