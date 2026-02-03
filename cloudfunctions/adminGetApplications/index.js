const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();

/**
 * 获取申请列表（管理员）
 */
exports.main = async (event, context) => {
  const { status = 0 } = event;

  try {
    let query = {};

    // 状态筛选
    if (status !== undefined && status !== null) {
      query.status = status;
    }

    const result = await db.collection('applications')
      .where(query)
      .orderBy('submitTime', 'desc')
      .get();

    return {
      success: true,
      data: result.data
    };
  } catch (err) {
    console.error('获取申请列表失败', err);
    return {
      success: false,
      message: '获取申请列表失败'
    };
  }
};
