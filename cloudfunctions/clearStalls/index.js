// 删除所有摊位数据
const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  try {
    // 获取总数
    const countResult = await db.collection('stalls').count();
    const total = countResult.total;

    if (total === 0) {
      return {
        success: true,
        message: '摊位集合为空，无需删除',
        deletedCount: 0
      };
    }

    // 微信云数据库每次最多删除100条，需要分批删除
    let deletedCount = 0;
    const batchSize = 100;

    while (deletedCount < total) {
      // 获取一批记录的 _id
      const { data } = await db.collection('stalls')
        .limit(batchSize)
        .get();

      if (data.length === 0) break;

      // 批量删除
      const deletePromises = data.map(item => 
        db.collection('stalls').doc(item._id).remove()
      );

      const results = await Promise.all(deletePromises);
      deletedCount += results.filter(r => r.stats && r.stats.removed > 0).length;

      console.log(`已删除 ${deletedCount} / ${total} 条记录`);
    }

    return {
      success: true,
      message: `成功删除所有摊位数据`,
      deletedCount: deletedCount,
      totalBefore: total
    };

  } catch (err) {
    console.error('删除摊位数据失败', err);
    return {
      success: false,
      message: '删除失败：' + err.message
    };
  }
};
