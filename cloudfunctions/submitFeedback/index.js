const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();
const _ = db.command;

/**
 * 提交反馈
 * 标记摊位为待确认状态
 */
exports.main = async (event, context) => {
  const { stallId, type } = event;

  try {
    // 创建反馈记录
    const feedback = {
      stallId,
      type, // wrong_location/wrong_info/not_exist/other
      status: 0, // 0待处理 1已标记 2已处理
      createTime: new Date().toISOString()
    };

    await db.collection('feedbacks').add({
      data: feedback
    });

    // 如果是"已不存在"，标记摊位为待确认
    if (type === 'not_exist') {
      await db.collection('stalls').doc(stallId).update({
        data: {
          reliability: 2, // 信息过期
          updateTime: new Date().toISOString()
        }
      });
    }

    return {
      success: true
    };
  } catch (err) {
    console.error('提交反馈失败', err);
    return {
      success: false,
      message: '提交反馈失败'
    };
  }
};
