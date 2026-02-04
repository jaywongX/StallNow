const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();
const _ = db.command;

/**
 * 提交反馈
 * 支持两种模式：
 * 1. 摊位相关反馈（stallId + type）
 * 2. 用户意见反馈（type + content + contact）
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openId = wxContext.OPENID;
  const { stallId, type, content, contact } = event;

  try {
    // 获取用户信息（使用 _openid 字段）
    const userRes = await db.collection('users').where({
      _openid: openId
    }).get();
    
    const userId = userRes.data.length > 0 ? userRes.data[0]._id : null;

    // 判断反馈类型
    const isStallFeedback = !!stallId;

    // 构建反馈记录
    const feedback = {
      openId: openId,
      userId: userId,
      
      // 反馈类型
      type: type || 'other',
      
      // 用户反馈内容（新模式）
      content: content || '',
      contact: contact || '',
      
      // 关联摊位（可选）
      stallId: stallId || null,
      
      // 处理状态：0待处理 1已标记 2已处理
      status: 0,
      
      // 反馈来源：stall-摊位反馈 / user-用户反馈
      source: isStallFeedback ? 'stall' : 'user',
      
      createTime: new Date().toISOString(),
      processedAt: null,
      processedBy: null,
      remark: ''
    };

    // 保存到数据库
    await db.collection('feedbacks').add({
      data: feedback
    });

    // 如果是摊位相关反馈（旧模式兼容）
    if (isStallFeedback && type === 'not_exist') {
      // 标记摊位为待确认
      await db.collection('stalls').doc(stallId).update({
        data: {
          reliability: 2, // 信息过期
          updateTime: new Date().toISOString()
        }
      });
    }

    return {
      success: true,
      message: '反馈提交成功'
    };
  } catch (err) {
    console.error('提交反馈失败', err);
    return {
      success: false,
      message: '提交反馈失败: ' + err.message
    };
  }
};
