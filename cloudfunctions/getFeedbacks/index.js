const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();
const _ = db.command;

/**
 * 获取反馈列表
 * 供管理员后台使用
 */
exports.main = async (event, context) => {
  const { status } = event;
  
  try {
    // 构建查询条件
    let query = {};
    if (status !== undefined && status !== null) {
      query.status = parseInt(status);
    }
    
    // 查询反馈列表
    const res = await db.collection('feedbacks')
      .where(query)
      .orderBy('createTime', 'desc')
      .get();
    
    return {
      code: 0,
      data: res.data,
      message: '获取成功'
    };
  } catch (err) {
    console.error('获取反馈列表失败', err);
    return {
      code: -1,
      message: '获取反馈列表失败: ' + err.message
    };
  }
};
