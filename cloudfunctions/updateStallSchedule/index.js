const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();

/**
 * 更新摊位出摊时间
 */
exports.main = async (event, context) => {
  const { stallId, scheduleTypes, schedule } = event;
  const { OPENID } = cloud.getWXContext();

  if (!stallId || !scheduleTypes || !Array.isArray(scheduleTypes)) {
    return {
      code: -1,
      message: '参数错误'
    };
  }

  try {
    // 1. 验证摊主身份
    const userRes = await db.collection('users').where({
      _openid: OPENID
    }).get();

    if (userRes.data.length === 0) {
      return {
        code: -1,
        message: '用户未登录'
      };
    }

    const user = userRes.data[0];
    
    if (!user.stallIds || !user.stallIds.includes(stallId)) {
      return {
        code: -1,
        message: '您没有权限修改此摊位'
      };
    }

    // 2. 验证摊位存在
    const stallRes = await db.collection('stalls').doc(stallId).get();
    if (!stallRes.data) {
      return {
        code: -1,
        message: '摊位不存在'
      };
    }

    // 3. 验证时间数据
    if (scheduleTypes.length === 0) {
      return {
        code: -1,
        message: '请至少选择一个出摊时间'
      };
    }

    if (scheduleTypes.includes('unfixed')) {
      if (!schedule || !schedule.customTimeStart || !schedule.customTimeEnd) {
        return {
          code: -1,
          message: '选择"不固定"时需要设置自定义时间段'
        };
      }
    }

    // 4. 执行更新
    await db.collection('stalls').doc(stallId).update({
      data: {
        scheduleTypes: scheduleTypes,
        schedule: schedule,
        updateTime: db.serverDate()
      }
    });

    return {
      code: 0,
      message: '更新成功'
    };

  } catch (err) {
    console.error('更新出摊时间失败', err);
    return {
      code: -1,
      message: '更新失败: ' + err.message
    };
  }
};
