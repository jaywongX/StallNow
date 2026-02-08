const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();

/**
 * 摊主确认摊位（扫码确认）
 * 延长30天可信度有效期
 */
exports.main = async (event, context) => {
  const { stallId } = event;

  try {
    // 获取地摊信息
    const stall = await db.collection('stalls').doc(stallId).get();

    if (!stall.data) {
      return {
        code: -1,
        message: '地摊不存在'
      };
    }

    // 更新确认时间和可信度状态
    await db.collection('stalls').doc(stallId).update({
      data: {
        lastConfirmedAt: new Date().toISOString(),
        confirmMethod: 'owner_scan',
        reliability: 0, // 重置为近期确认
        updateTime: new Date().toISOString()
      }
    });

    return {
      code: 0,
      message: '确认成功'
    };
  } catch (err) {
    console.error('确认摊位失败', err);
    return {
      code: -1,
      message: '确认摊位失败'
    };
  }
};
