const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();

/**
 * 摊主签到功能
 * 更新 lastConfirmedAt、lastCheckInDate、reliability
 */
exports.main = async (event, context) => {
  const { stallId } = event;
  const wxContext = cloud.getWXContext();

  try {
    // 获取用户信息
    const userRes = await db.collection('users').where({
      _openid: wxContext.OPENID
    }).get();

    if (!userRes.data || userRes.data.length === 0) {
      return { code: -1, message: '用户不存在' };
    }

    const user = userRes.data[0];

    // 获取摊位信息
    const stallRes = await db.collection('stalls').doc(stallId).get();
    if (!stallRes.data) {
      return { code: -1, message: '摊位不存在' };
    }

    const stall = stallRes.data;

    // 验证权限：必须是摊位所有者
    if (stall.ownerUserId !== user._id) {
      return { code: -1, message: '无权限操作此摊位' };
    }

    // 获取今天的日期字符串（YYYY-MM-DD）
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // 检查今日是否已签到
    if (stall.lastCheckInDate === todayStr) {
      return {
        code: 0,
        data: {
          alreadyCheckIn: true,
          message: '今日已签到'
        }
      };
    }

    // 更新签到信息
    const now = new Date();
    await db.collection('stalls').doc(stallId).update({
      data: {
        lastConfirmedAt: now.toISOString(),
        lastCheckInDate: todayStr,
        reliability: 0, // 签到后重置为近期确认
        confirmMethod: 'owner_checkin',
        updateTime: now.toISOString()
      }
    });

    return {
      code: 0,
      data: {
        alreadyCheckIn: false,
        message: '签到成功'
      }
    };
  } catch (err) {
    console.error('签到失败', err);
    return {
      code: -1,
      message: '签到失败: ' + err.message
    };
  }
};
