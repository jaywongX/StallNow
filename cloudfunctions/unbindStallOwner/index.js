const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();

/**
 * 解绑摊主微信号
 */
exports.main = async (event, context) => {
  const { stallId } = event;

  try {
    // 更新绑定状态
    await db.collection('stalls').doc(stallId).update({
      data: {
        ownerOpenId: '',
        bindStatus: 0, // 0未绑定
        updateTime: new Date().toISOString()
      }
    });

    return {
      code: 0,
      message: '解绑成功'
    };
  } catch (err) {
    console.error('解绑摊主失败', err);
    return {
      code: -1,
      message: '解绑摊主失败'
    };
  }
};
