const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();

/**
 * 获取申请列表（管理员）
 * 关联用户信息显示
 */
exports.main = async (event, context) => {
  const { status } = event;

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

    // 获取申请人信息
    const userIds = result.data.map(app => app.userId).filter(id => id);
    const uniqueUserIds = [...new Set(userIds)];

    // 批量获取用户信息
    const userMap = {};
    if (uniqueUserIds.length > 0) {
      // 由于云函数限制，需要分批查询
      const batchSize = 50;
      for (let i = 0; i < uniqueUserIds.length; i += batchSize) {
        const batch = uniqueUserIds.slice(i, i + batchSize);
        const userRes = await db.collection('users')
          .where({
            _id: db.command.in(batch)
          })
          .get();
        
        userRes.data.forEach(user => {
          userMap[user._id] = user;
        });
      }
    }

    // 合并数据
    const applications = result.data.map(app => ({
      ...app,
      userInfo: userMap[app.userId] ? {
        nickName: userMap[app.userId].nickName,
        avatarUrl: userMap[app.userId].avatarUrl,
        role: userMap[app.userId].role
      } : null
    }));

    return {
      code: 0,
      data: applications,
      message: 'success'
    };
  } catch (err) {
    console.error('获取申请列表失败', err);
    return {
      code: -1,
      message: '获取申请列表失败: ' + err.message
    };
  }
};
