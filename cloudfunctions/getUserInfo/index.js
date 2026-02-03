const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();

/**
 * 获取用户信息（含角色）
 * 如果用户不存在，自动创建用户记录
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openId = wxContext.OPENID;

  try {
    // 查询用户是否存在
    let userRes = await db.collection('users').where({
      openId: openId
    }).get();

    let userInfo;

    if (userRes.data.length === 0) {
      // 用户不存在，创建新用户
      const newUser = {
        openId: openId,
        nickName: '',
        avatarUrl: '',
        role: 'user', // user:普通用户, vendor:摊主, admin:管理员
        vendorInfo: null,
        stallIds: [],
        favorites: [],
        recentViews: [],
        createTime: new Date().toISOString(),
        updateTime: new Date().toISOString()
      };

      const addRes = await db.collection('users').add({
        data: newUser
      });

      userInfo = {
        _id: addRes._id,
        ...newUser
      };
    } else {
      userInfo = userRes.data[0];
    }

    return {
      code: 0,
      data: userInfo,
      message: 'success'
    };
  } catch (err) {
    console.error('获取用户信息失败', err);
    return {
      code: -1,
      message: '获取用户信息失败: ' + err.message
    };
  }
};
