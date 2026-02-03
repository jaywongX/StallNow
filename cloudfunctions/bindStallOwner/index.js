const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();

/**
 * 绑定摊主微信号
 */
exports.main = async (event, context) => {
  const { stallId, openId } = event;
  const wxContext = cloud.getWXContext();

  try {
    // 获取地摊信息
    const stall = await db.collection('stalls').doc(stallId).get();

    if (!stall.data) {
      return {
        success: false,
        message: '地摊不存在'
      };
    }

    // 更新绑定状态
    await db.collection('stalls').doc(stallId).update({
      data: {
        ownerOpenId: openId || wxContext.OPENID,
        bindStatus: 1, // 1已绑定
        updateTime: new Date().toISOString()
      }
    });

    return {
      success: true
    };
  } catch (err) {
    console.error('绑定摊主失败', err);
    return {
      success: false,
      message: '绑定摊主失败'
    };
  }
};
