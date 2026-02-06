const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();
const _ = db.command;

/**
 * 获取地摊详情
 * 增加访问计数
 */
exports.main = async (event, context) => {
  const { stallId } = event;

  try {
    // 获取地摊详情
    const stall = await db.collection('stalls').doc(stallId).get();

    if (!stall.data) {
      return {
        success: false,
        message: '地摊不存在'
      };
    }

    // 增加访问计数
    await db.collection('stalls').doc(stallId).update({
      data: {
        viewCount: _.inc(1)
      }
    });

    // 获取分类名称
    let categoryName = '其他';
    if (stall.data.categoryId) {
      const category = await db.collection('categories')
        .doc(stall.data.categoryId)
        .get();
      categoryName = category.data ? category.data.name : '其他';
    }

    return {
      success: true,
      data: {
        ...stall.data,
        categoryName
      }
    };
  } catch (err) {
    console.error('获取地摊详情失败', err);
    return {
      success: false,
      message: '获取地摊详情失败'
    };
  }
};
