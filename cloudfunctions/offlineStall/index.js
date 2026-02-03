const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();

/**
 * 一键下线摊位
 */
exports.main = async (event, context) => {
  const { stallId } = event;

  try {
    // 更新摊位状态为已下线
    await db.collection('stalls').doc(stallId).update({
      data: {
        status: 3, // 3已下线
        updateTime: new Date().toISOString()
      }
    });

    return {
      success: true
    };
  } catch (err) {
    console.error('下线摊位失败', err);
    return {
      success: false,
      message: '下线摊位失败'
    };
  }
};
