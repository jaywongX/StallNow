const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();

/**
 * 处理反馈
 * @param {string} feedbackId - 反馈ID
 * @param {string} action - 操作：mark(标记) / process(处理)
 */
exports.main = async (event, context) => {
  const { feedbackId, action } = event;
  
  if (!feedbackId || !action) {
    return {
      code: -1,
      message: '参数错误：缺少反馈ID或操作类型'
    };
  }
  
  try {
    // 更新反馈状态
    const result = await db.collection('feedbacks').doc(feedbackId).update({
      data: {
        status: action === 'mark' ? 1 : 2,
        processedAt: new Date().toISOString()
      }
    });
    
    return {
      code: 0,
      data: result,
      message: '操作成功'
    };
  } catch (err) {
    console.error('处理反馈失败', err);
    return {
      code: -1,
      message: '操作失败: ' + err.message
    };
  }
};
