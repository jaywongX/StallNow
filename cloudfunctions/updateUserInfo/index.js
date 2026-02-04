const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();

/**
 * 更新用户信息
 * 用于用户更新微信昵称和头像
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openId = wxContext.OPENID;
  const { nickName, avatarUrl } = event;

  try {
    // 查询用户
    const userRes = await db.collection('users').where({
      _openid: openId
    }).get();

    if (userRes.data.length === 0) {
      return {
        code: -1,
        message: '用户未注册'
      };
    }

    const userId = userRes.data[0]._id;

    // 更新用户信息
    const updateData = {
      updateTime: new Date().toISOString()
    };

    if (nickName !== undefined) {
      updateData.nickName = nickName;
    }

    if (avatarUrl !== undefined) {
      updateData.avatarUrl = avatarUrl;
    }

    await db.collection('users').doc(userId).update({
      data: updateData
    });

    return {
      code: 0,
      message: '更新成功'
    };
  } catch (err) {
    console.error('更新用户信息失败', err);
    return {
      code: -1,
      message: '更新用户信息失败: ' + err.message
    };
  }
};
