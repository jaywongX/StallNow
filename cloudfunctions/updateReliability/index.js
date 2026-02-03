const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();

/**
 * 更新可信度状态（定时触发）
 * 根据最后确认时间更新可信度状态
 */
exports.main = async (event, context) => {
  try {
    const now = new Date();

    // 获取所有已上架的地摊
    const stalls = await db.collection('stalls')
      .where({
        status: 1
      })
      .get();

    for (const stall of stalls.data) {
      if (!stall.lastConfirmedAt) continue;

      const lastConfirmed = new Date(stall.lastConfirmedAt);
      const daysDiff = Math.floor((now - lastConfirmed) / (1000 * 60 * 60 * 24));

      let newReliability = stall.reliability;

      // 根据天数更新可信度状态
      if (daysDiff <= 30) {
        newReliability = 0; // 近期确认
      } else if (daysDiff <= 90) {
        newReliability = 1; // 可能还在
      } else {
        newReliability = 2; // 信息过期
      }

      // 如果状态发生变化，更新数据库
      if (newReliability !== stall.reliability) {
        await db.collection('stalls').doc(stall._id).update({
          data: {
            reliability: newReliability,
            updateTime: now.toISOString()
          }
        });
      }
    }

    return {
      success: true,
      message: '可信度状态更新完成'
    };
  } catch (err) {
    console.error('更新可信度状态失败', err);
    return {
      success: false,
      message: '更新可信度状态失败'
    };
  }
};
