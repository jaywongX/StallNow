const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();

/**
 * 检查用户是否收藏了某个摊位
 */
exports.main = async (event, context) => {
  const { stallId } = event;
  const { OPENID } = cloud.getWXContext();

  if (!stallId) {
    return {
      code: -1,
      message: '摊位ID不能为空'
    };
  }

  try {
    // 查询用户收藏
    const userRes = await db.collection('users').where({
      _openid: OPENID
    }).get();

    if (userRes.data.length === 0) {
      return {
        code: 0,
        data: { isFavorite: false }
      };
    }

    const user = userRes.data[0];
    const favorites = user.favorites || [];
    const isFavorite = favorites.includes(stallId);

    return {
      code: 0,
      data: { isFavorite }
    };

  } catch (err) {
    console.error('检查收藏状态失败', err);
    return {
      code: -1,
      message: '检查失败: ' + err.message
    };
  }
};
