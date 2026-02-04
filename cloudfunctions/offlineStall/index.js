const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();

/**
 * 一键下线/上线摊位
 * status: 1已上架 2已下架
 */
exports.main = async (event, context) => {
  const { stallId, status } = event;

  try {
    // 更新摊位状态
    // status: 1=上架, 2=下架
    const newStatus = status === 2 ? 2 : 1;
    
    await db.collection('stalls').doc(stallId).update({
      data: {
        status: newStatus,
        updateTime: new Date().toISOString()
      }
    });

    return {
      code: 0,
      message: status === 2 ? '已下线' : '已上线'
    };
  } catch (err) {
    console.error('下线摊位失败', err);
    return {
      code: -1,
      message: '下线摊位失败: ' + err.message
    };
  }
};
