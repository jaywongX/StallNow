const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();

/**
 * 检查用户是否点赞了某摊位
 */
exports.main = async (event, context) => {
  const { stallId } = event;
  const { OPENID } = cloud.getWXContext();

  if (!stallId) {
    return {
      code: -1,
      message: '参数错误'
    };
  }

  try {
    // 1. 获取用户信息
    const userRes = await db.collection('users').where({
      _openid: OPENID
    }).get();

    let isLiked = false;
    if (userRes.data.length > 0) {
      const likes = userRes.data[0].likes || [];
      isLiked = likes.includes(stallId);
    }

    // 2. 获取摊位点赞数
    const stallRes = await db.collection('stalls').doc(stallId).get();
    const likeCount = stallRes.data ? (stallRes.data.likeCount || 0) : 0;

    return {
      code: 0,
      data: {
        isLiked,
        likeCount
      }
    };

  } catch (err) {
    console.error('检查点赞状态失败', err);
    return {
      code: -1,
      message: '操作失败: ' + err.message
    };
  }
};
